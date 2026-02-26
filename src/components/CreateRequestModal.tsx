'use client'

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import AddressSearch from './AddressSearch'
import type { HelpType } from '@/types'
import { HELP_TYPES, HELP_TYPE_COLORS } from '@/types'

const LocationPicker = dynamic(() => import('./map/LocationPicker'), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
      <span className="text-gray-400 text-sm">Carregando mapa...</span>
    </div>
  ),
})

interface FormState {
  title: string
  description: string
  helpTypes: HelpType[]
  urgency: number
  neighborhood: string
  contactName: string
  contactPhone: string
  lat: number | null
  lng: number | null
  addressLabel: string
  locationMethod: 'map' | 'search'
}

interface FormErrors {
  title?: string
  description?: string
  helpTypes?: string
  urgency?: string
  neighborhood?: string
  location?: string
  contactPhone?: string
  general?: string
}

interface CreateRequestModalProps {
  onClose: () => void
  onSuccess: (requestId: string) => void
}

const URGENCY_LABELS = ['', 'Muito Baixa', 'Baixa', 'Média', 'Alta', 'Crítica']
const URGENCY_COLORS = [
  '',
  'bg-slate-100 border-slate-300 text-slate-700',
  'bg-blue-100 border-blue-300 text-blue-700',
  'bg-yellow-100 border-yellow-300 text-yellow-700',
  'bg-orange-100 border-orange-300 text-orange-700',
  'bg-red-100 border-red-300 text-red-700',
]

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {}
  if (!form.title.trim() || form.title.trim().length < 3)
    errors.title = 'Título deve ter pelo menos 3 caracteres'
  if (!form.description.trim() || form.description.trim().length < 10)
    errors.description = 'Descrição deve ter pelo menos 10 caracteres'
  if (form.description.trim().length > 800)
    errors.description = 'Descrição deve ter no máximo 800 caracteres'
  if (form.helpTypes.length === 0)
    errors.helpTypes = 'Selecione pelo menos um tipo de ajuda'
  if (!form.urgency)
    errors.urgency = 'Selecione o nível de urgência'
  if (!form.neighborhood.trim())
    errors.neighborhood = 'Informe o bairro'
  if (form.lat === null || form.lng === null)
    errors.location = 'Marque ou pesquise a localização'
  if (form.contactPhone && form.contactPhone.replace(/\D/g, '').length < 10)
    errors.contactPhone = 'Telefone inválido. Use formato: (32) 99999-9999'
  return errors
}

export default function CreateRequestModal({ onClose, onSuccess }: CreateRequestModalProps) {
  const [form, setForm] = useState<FormState>({
    title: '',
    description: '',
    helpTypes: [],
    urgency: 0,
    neighborhood: '',
    contactName: '',
    contactPhone: '',
    lat: null,
    lng: null,
    addressLabel: '',
    locationMethod: 'map',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)

  // Token display state
  const [token, setToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [createdId, setCreatedId] = useState<string | null>(null)

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const toggleType = (type: HelpType) => {
    set(
      'helpTypes',
      form.helpTypes.includes(type)
        ? form.helpTypes.filter((t) => t !== type)
        : [...form.helpTypes, type],
    )
  }

  const handleLocationSelect = useCallback(
    (lat: number, lng: number) => {
      set('lat', lat)
      set('lng', lng)
    },
    [],
  )

  const handleAddressSelect = useCallback(
    (lat: number, lng: number, label: string, neighborhood: string) => {
      setForm((prev) => ({
        ...prev,
        lat,
        lng,
        addressLabel: label,
        neighborhood: neighborhood || prev.neighborhood,
      }))
    },
    [],
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSubmitting(true)
    setErrors({})

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          helpTypes: form.helpTypes,
          urgency: form.urgency,
          neighborhood: form.neighborhood.trim(),
          lat: form.lat!,
          lng: form.lng!,
          addressLabel: form.addressLabel || null,
          contactName: form.contactName.trim() || null,
          contactPhone: form.contactPhone.trim() || null,
          _hp: '', // honeypot — always empty from real users
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrors({ general: data.error || 'Erro ao criar pedido. Tente novamente.' })
        return
      }

      setToken(data.token)
      setCreatedId(data.id)
    } catch {
      setErrors({ general: 'Erro de conexão. Verifique sua internet e tente novamente.' })
    } finally {
      setSubmitting(false)
    }
  }

  const copyToken = async () => {
    if (!token) return
    try {
      await navigator.clipboard.writeText(token)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch {
      // fallback: select text manually
    }
  }

  // Token display screen
  if (token) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-2">Pedido criado com sucesso!</h2>
          <p className="text-gray-500 text-sm mb-6">
            Seu pedido já está no mapa e pode ser visto pela comunidade.
          </p>

          <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 mb-4">
            <p className="text-amber-800 text-sm font-semibold mb-2 flex items-center justify-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              Guarde este código para encerrar o pedido depois:
            </p>
            <div className="flex items-center gap-2 bg-white border border-amber-200 rounded-lg p-3">
              <code className="flex-1 font-mono text-sm text-gray-900 break-all select-all">
                {token}
              </code>
              <button
                onClick={copyToken}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  copied
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {copied ? '✓ Copiado!' : 'Copiar'}
              </button>
            </div>
            <p className="text-amber-700 text-xs mt-2">
              Este código <strong>não será mostrado novamente</strong>. Salve-o agora.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                onSuccess(createdId!)
                onClose()
              }}
              className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700 transition-colors"
            >
              Ver no mapa
            </button>
            {createdId && (
              <a
                href={`/requests/${createdId}`}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors text-center"
              >
                Ver detalhes
              </a>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Form screen
  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Pedir ajuda</h2>
            <p className="text-xs text-gray-500">Preencha os dados do pedido de emergência</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-4 space-y-5">
            {/* Honeypot — hidden from real users, bots fill this */}
            <input
              type="text"
              name="_hp"
              tabIndex={-1}
              autoComplete="off"
              style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }}
              aria-hidden="true"
            />

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="Ex: Família sem água potável"
                maxLength={150}
                className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Descreva a situação em detalhes: quantas pessoas, o que é necessário, como chegar..."
                rows={4}
                maxLength={800}
                className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              <div className="flex justify-between mt-1">
                {errors.description ? (
                  <p className="text-red-500 text-xs">{errors.description}</p>
                ) : (
                  <span />
                )}
                <span
                  className={`text-xs ${form.description.length > 750 ? 'text-orange-500' : 'text-gray-400'}`}
                >
                  {form.description.length}/800
                </span>
              </div>
            </div>

            {/* Help types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipos de ajuda necessária <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {HELP_TYPES.map((type) => {
                  const selected = form.helpTypes.includes(type)
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleType(type)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                        selected
                          ? HELP_TYPE_COLORS[type] + ' ring-2 ring-offset-1 ring-current'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {type}
                    </button>
                  )
                })}
              </div>
              {errors.helpTypes && (
                <p className="text-red-500 text-xs mt-1">{errors.helpTypes}</p>
              )}
            </div>

            {/* Urgency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Urgência <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => set('urgency', u)}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                      form.urgency === u
                        ? URGENCY_COLORS[u] + ' border-current'
                        : 'bg-white border-gray-200 text-gray-400 hover:border-gray-400'
                    }`}
                  >
                    {u}
                    <span className="block text-xs font-normal leading-tight">
                      {URGENCY_LABELS[u]}
                    </span>
                  </button>
                ))}
              </div>
              {errors.urgency && <p className="text-red-500 text-xs mt-1">{errors.urgency}</p>}
            </div>

            {/* Neighborhood */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bairro <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.neighborhood}
                onChange={(e) => set('neighborhood', e.target.value)}
                placeholder="Ex: Cascatinha, Centro, São Mateus..."
                className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  errors.neighborhood ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.neighborhood && (
                <p className="text-red-500 text-xs mt-1">{errors.neighborhood}</p>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Localização <span className="text-red-500">*</span>
              </label>
              {/* Method tabs */}
              <div className="flex rounded-xl border border-gray-200 mb-3 overflow-hidden">
                <button
                  type="button"
                  onClick={() => set('locationMethod', 'map')}
                  className={`flex-1 py-2 text-xs font-medium transition-colors ${
                    form.locationMethod === 'map'
                      ? 'bg-red-600 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  📍 Clicar no mapa
                </button>
                <button
                  type="button"
                  onClick={() => set('locationMethod', 'search')}
                  className={`flex-1 py-2 text-xs font-medium transition-colors ${
                    form.locationMethod === 'search'
                      ? 'bg-red-600 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  🔍 Buscar endereço
                </button>
              </div>

              {form.locationMethod === 'map' ? (
                <LocationPicker
                  value={form.lat !== null && form.lng !== null ? { lat: form.lat, lng: form.lng } : null}
                  onChange={handleLocationSelect}
                />
              ) : (
                <AddressSearch onSelect={handleAddressSelect} />
              )}

              {errors.location && (
                <p className="text-red-500 text-xs mt-1">{errors.location}</p>
              )}
            </div>

            {/* Contact (optional) */}
            <div className="border border-gray-200 rounded-xl p-4">
              <p className="text-sm font-medium text-gray-700 mb-3">
                Contato{' '}
                <span className="text-gray-400 font-normal text-xs">(opcional)</span>
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Nome</label>
                  <input
                    type="text"
                    value={form.contactName}
                    onChange={(e) => set('contactName', e.target.value)}
                    placeholder="Seu nome ou apelido"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">WhatsApp ou Telefone</label>
                  <input
                    type="tel"
                    value={form.contactPhone}
                    onChange={(e) => set('contactPhone', e.target.value)}
                    placeholder="(32) 99999-9999"
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      errors.contactPhone ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.contactPhone && (
                    <p className="text-red-500 text-xs mt-1">{errors.contactPhone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* TODO: Photo upload — up to 3 photos */}
            {/* Future feature: integrate with Cloudflare R2 or similar storage */}

            {/* General error */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                {errors.general}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex-shrink-0 bg-gray-50">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Enviando pedido...
                  </>
                ) : (
                  '🆘 Enviar pedido de ajuda'
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">
              Ao enviar, você concorda em fornecer informações verídicas sobre a situação de emergência.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
