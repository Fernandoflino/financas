import { z } from 'zod'

export const Investidor10AssetSchema = z.object({
  ticker: z.string().min(1),
  quantity: z.number().positive(),
  averagePrice: z.number().positive(),
  currentPrice: z.number().nonnegative(),
  category: z.string().optional(),
  sector: z.string().optional(),
})

export type Investidor10Asset = z.infer<typeof Investidor10AssetSchema>

interface ParsedRow {
  ticker: string
  quantity: number
  averagePrice: number
  currentPrice: number
  category?: string
}

export class Investidor10TextProvider {
  static parse(text: string): Investidor10Asset[] {
    if (!text || text.trim().length === 0) {
      return []
    }

    const lines = text.split('\n').filter(line => line.trim())
    const assets: ParsedRow[] = []

    for (const line of lines) {
      const asset = this.parseLine(line)
      if (asset) {
        assets.push(asset)
      }
    }

    return assets.map(a => this.validateAsset(a)).filter(Boolean) as Investidor10Asset[]
  }

  private static parseLine(line: string): ParsedRow | null {
    const trimmed = line.trim()

    // Padrão: TICKER QTD PREÇO_MÉD PREÇO_ATUAL (mínimo 4 campos numéricos/texto)
    // Exemplo: PETR4 100 20.50 21.30
    const pattern =
      /^([A-Z0-9]{4,6})\s+([0-9,.]+)\s+([0-9,.]+)\s+([0-9,.]+)/

    const match = trimmed.match(pattern)
    if (!match) {
      return null
    }

    const [, ticker, qtyStr, avgPriceStr, curPriceStr] = match
    const rest = trimmed.substring(match[0].length).trim()

    try {
      const quantity = this.parseNumber(qtyStr)
      const averagePrice = this.parseNumber(avgPriceStr)
      const currentPrice = this.parseNumber(curPriceStr)

      if (quantity <= 0 || averagePrice <= 0 || currentPrice < 0) {
        return null
      }

      // Extrair categoria do restante da linha se houver
      const category = rest ? this.extractCategory(rest) : undefined

      return {
        ticker: ticker.toUpperCase(),
        quantity,
        averagePrice,
        currentPrice,
        category,
      }
    } catch {
      return null
    }
  }

  private static parseNumber(str: string): number {
    // Aceita formato brasileiro (ponto como separador de milhar, vírgula como decimal)
    // e formato internacional (vírgula como separador de milhar, ponto como decimal)
    const normalized = str
      .replace(/\./g, '@') // marca pontos temporariamente
      .replace(/,/g, '.') // converte vírgula para ponto
      .replace(/@/g, '') // remove marcadores (elimina separador de milhar se for ponto)

    const num = parseFloat(normalized)
    return isNaN(num) ? 0 : num
  }

  private static extractCategory(str: string): string | undefined {
    const categoryKeywords: Record<string, string> = {
      acao: 'acao',
      stock: 'acao',
      fii: 'fii',
      fund: 'fii',
      etf: 'etf',
      'renda fixa': 'renda_fixa',
      bond: 'renda_fixa',
      debênture: 'renda_fixa',
    }

    const lower = str.toLowerCase()
    for (const [keyword, category] of Object.entries(categoryKeywords)) {
      if (lower.includes(keyword)) {
        return category
      }
    }

    return undefined
  }

  private static validateAsset(asset: ParsedRow): Investidor10Asset | null {
    try {
      return Investidor10AssetSchema.parse(asset)
    } catch {
      return null
    }
  }
}
