import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'

const settingsSchema = z.object({
  app_name: z.string().min(1, 'Nome obrigatório'),
  logo_url: z.string().url('URL inválida').optional().or(z.literal('')),
  favicon_url: z.string().url('URL inválida').optional().or(z.literal('')),
  primary_color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor inválida (ex: #0000FF)'),
  secondary_color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor inválida (ex: #0000FF)'),
  theme: z.enum(['light', 'dark', 'auto']),
  registrations_open: z.boolean(),
})

type SettingsFormData = z.infer<typeof settingsSchema>

export default function SettingsPage() {
  const { hasPermission } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState(false)
  const [hasAccess, setHasAccess] = useState(false)

  const { register, handleSubmit, formState: { errors }, reset } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
  })

  // Check permission and load settings
  useEffect(() => {
    const loadData = async () => {
      try {
        const canAccess = await hasPermission('admin.settings.manage')
        setHasAccess(canAccess)

        if (!canAccess) {
          setError('Acesso negado')
          setLoading(false)
          return
        }

        const { data, error: fetchError } = (await (supabase as any)
          .from('app_settings')
          .select('*')
          .eq('id', 1)
          .single()) as any

        if (fetchError) throw fetchError
        reset(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar configurações')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [hasPermission, reset])

  const onSubmit = async (data: SettingsFormData) => {
    try {
      setSaving(true)
      setError('')
      setSuccess(false)

      // @ts-expect-error - RPC call with custom function
      const { error: rpcError } = await supabase.rpc('update_app_settings', {
        p_app_name: data.app_name,
        p_logo_url: data.logo_url || null,
        p_favicon_url: data.favicon_url || null,
        p_primary_color: data.primary_color,
        p_secondary_color: data.secondary_color,
        p_theme: data.theme,
        p_registrations_open: data.registrations_open,
      })

      if (rpcError) throw rpcError
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-8">Carregando...</div>
  }

  if (!hasAccess) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-900">
          Você não tem permissão para acessar esta página.
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Configurações do Aplicativo</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-800 text-sm">
          ✓ Configurações salvas com sucesso!
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white rounded-lg shadow p-6">
        {/* Nome da Aplicação */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Nome da Aplicação</label>
          <input
            type="text"
            {...register('app_name')}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.app_name && <p className="text-red-600 text-sm mt-1">{errors.app_name.message}</p>}
        </div>

        {/* Logo URL */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">URL do Logo</label>
          <input
            type="text"
            {...register('logo_url')}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://..."
          />
          {errors.logo_url && <p className="text-red-600 text-sm mt-1">{errors.logo_url.message}</p>}
        </div>

        {/* Favicon URL */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">URL do Favicon</label>
          <input
            type="text"
            {...register('favicon_url')}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://..."
          />
          {errors.favicon_url && <p className="text-red-600 text-sm mt-1">{errors.favicon_url.message}</p>}
        </div>

        {/* Cores */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Cor Primária</label>
            <div className="flex gap-2">
              <input
                type="color"
                {...register('primary_color')}
                className="h-10 w-16 border border-slate-300 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                {...register('primary_color')}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="#0000FF"
              />
            </div>
            {errors.primary_color && <p className="text-red-600 text-sm mt-1">{errors.primary_color.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Cor Secundária</label>
            <div className="flex gap-2">
              <input
                type="color"
                {...register('secondary_color')}
                className="h-10 w-16 border border-slate-300 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                {...register('secondary_color')}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="#00FF00"
              />
            </div>
            {errors.secondary_color && <p className="text-red-600 text-sm mt-1">{errors.secondary_color.message}</p>}
          </div>
        </div>

        {/* Tema */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Tema</label>
          <select
            {...register('theme')}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="light">Claro</option>
            <option value="dark">Escuro</option>
            <option value="auto">Automático</option>
          </select>
        </div>

        {/* Cadastros Abertos */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              {...register('registrations_open')}
              className="w-4 h-4 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-slate-700">Permitir novos cadastros</span>
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </form>
    </div>
  )
}
