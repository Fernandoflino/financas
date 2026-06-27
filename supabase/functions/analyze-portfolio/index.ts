import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

interface AnalysisRequest {
  portfolioId: string
  promptType: string
  prompt: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export default async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { portfolioId, promptType, prompt } = (await req.json()) as AnalysisRequest

    const openrouterApiKey = Deno.env.get('OPENROUTER_API_KEY')
    if (!openrouterApiKey) {
      throw new Error('OpenRouter API key not configured')
    }

    // Call OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterApiKey}`,
        'HTTP-Referer': 'https://financas-platform.com',
        'X-Title': 'Financas Platform',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openrouter/auto',
        messages: [
          {
            role: 'system',
            content: `Você é um analista financeiro especializado em mercado de ações brasileiro.
Forneça análises concisas, práticas e baseadas em dados. Seja direto e evite jargão técnico desnecessário.
Sempre inclua um disclaimer informando que as análises são educacionais e não devem ser consideradas como recomendação de investimento.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`OpenRouter error: ${JSON.stringify(errorData)}`)
    }

    const data = await response.json()
    const analysis = data.choices[0].message.content
    const tokensUsed = data.usage?.total_tokens || 0
    const costUsd = data.usage?.prompt_tokens ? (data.usage.prompt_tokens * 0.0001 + data.usage.completion_tokens * 0.0003) : 0

    // Store analysis in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const userId = req.headers.get('x-user-id')
    if (!userId) {
      throw new Error('User ID required')
    }

    const { data: analysisRecord, error: dbError } = await (supabase as any)
      .from('ai_analyses')
      .insert({
        user_id: userId,
        portfolio_id: portfolioId,
        prompt_type: promptType,
        request_prompt: prompt,
        response_text: analysis,
        model: 'openrouter/auto',
        tokens_used: tokensUsed,
        cost_usd: costUsd,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      throw dbError
    }

    return new Response(
      JSON.stringify({
        analysisId: analysisRecord.id,
        analysis,
        model: 'openrouter/auto',
        tokensUsed,
        costUsd,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Analysis error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}
