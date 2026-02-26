'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import ResolveModal from '@/components/ResolveModal'
import type { HelpRequest, Comment } from '@/types'
import { URGENCY_CONFIG, HELP_TYPE_COLORS, formatTimeAgo } from '@/types'

const MiniMapPreview = dynamic(() => import('@/components/map/MiniMapPreview'), {
  ssr: false,
  loading: () => <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />,
})

interface RequestDetailProps {
  request: HelpRequest
  initialComments: Comment[]
}

export default function RequestDetail({ request: r, initialComments }: RequestDetailProps) {
  const [showResolve, setShowResolve] = useState(false)
  const [resolved, setResolved] = useState(r.status === 'RESOLVED')
  const [confirming, setConfirming] = useState(false)
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null)
  const [reporting, setReporting] = useState(false)
  const [reportMessage, setReportMessage] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [commentError, setCommentError] = useState<string | null>(null)
  const [commentSuccess, setCommentSuccess] = useState(false)

  const isResolved = resolved

  const urgency = URGENCY_CONFIG[r.urgency]

  const copyLocation = async () => {
    const text = `https://www.openstreetmap.org/?mlat=${r.lat}&mlon=${r.lng}#map=17/${r.lat}/${r.lng}`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // silent fail
    }
  }

  const handleConfirm = async () => {
    setConfirming(true)
    try {
      const res = await fetch(`/api/requests/${r.id}/confirm`, { method: 'POST' })
      const data = await res.json()
      setConfirmMessage(data.message || data.error)
      if (data.autoResolved) setResolved(true)
    } catch {
      setConfirmMessage('Erro ao confirmar. Tente novamente.')
    } finally {
      setConfirming(false)
    }
  }

  const handleReport = async () => {
    setReporting(true)
    try {
      const res = await fetch(`/api/requests/${r.id}/report`, { method: 'POST' })
      const data = await res.json()
      setReportMessage(data.message || data.error)
    } catch {
      setReportMessage('Erro ao reportar. Tente novamente.')
    } finally {
      setReporting(false)
    }
  }

  const handleCommentSubmit = async () => {
    const content = commentText.trim()
    if (!content) return
    setSubmitting(true)
    setCommentError(null)
    try {
      const res = await fetch(`/api/requests/${r.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, _hp: '' }),
      })
      const data = await res.json()
      if (!res.ok) {
        setCommentError(data.error ?? 'Erro ao enviar comentário.')
        return
      }
      setComments((prev) => [...prev, data as Comment])
      setCommentText('')
      setCommentSuccess(true)
      setTimeout(() => setCommentSuccess(false), 3000)
    } catch {
      setCommentError('Erro ao enviar comentário. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-red-700 text-white px-4 py-3 shadow-md">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link
            href="/"
            className="p-1.5 rounded-lg hover:bg-red-600 transition-colors"
            aria-label="Voltar ao mapa"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="font-bold text-base leading-tight">JF Ajuda</h1>
            <p className="text-red-200 text-xs">Detalhes do pedido</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Status + urgency badges */}
        <div className="flex flex-wrap gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${
              isResolved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${isResolved ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}
            />
            {isResolved ? 'Resolvido' : 'Precisando de ajuda'}
          </span>

          <span className={`px-3 py-1 rounded-full text-sm font-medium ${urgency?.badge}`}>
            Urgência {r.urgency} — {urgency?.label}
          </span>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-extrabold text-gray-900 leading-tight">{r.title}</h2>

        {/* Meta */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            {r.neighborhood}, Juiz de Fora, MG
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {formatTimeAgo(r.createdAt)}
          </span>
          {isResolved && r.resolvedAt && (
            <span className="flex items-center gap-1 text-green-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
              </svg>
              Resolvido {formatTimeAgo(r.resolvedAt)} via{' '}
              {r.resolvedByMethod === 'COMMUNITY' ? 'comunidade' : 'código'}
            </span>
          )}
        </div>

        {/* Map preview */}
        <MiniMapPreview lat={r.lat} lng={r.lng} title={r.title} height="h-52" />

        {/* Description */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Descrição</h3>
          <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{r.description}</p>
        </div>

        {/* Help types */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Tipos de ajuda necessária</h3>
          <div className="flex flex-wrap gap-1.5">
            {r.helpTypes.map((type) => (
              <span
                key={type}
                className={`px-3 py-1 rounded-full text-sm border ${
                  HELP_TYPE_COLORS[type as keyof typeof HELP_TYPE_COLORS] ??
                  'bg-gray-100 text-gray-700 border-gray-200'
                }`}
              >
                {type}
              </span>
            ))}
          </div>
        </div>

        {/* Contact */}
        {(r.contactName || r.contactPhone) && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Contato</h3>
            {r.contactName && <p className="text-gray-800 text-sm font-medium">{r.contactName}</p>}
            {r.contactPhone && (
              <p className="text-gray-600 text-sm font-mono mt-0.5">{r.contactPhone}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Número parcialmente ocultado por privacidade.
            </p>
          </div>
        )}

        {/* Community stats */}
        {(r.confirmationsCount > 0 || r.reportsCount > 0) && (
          <div className="flex gap-3 text-xs text-gray-400">
            {r.confirmationsCount > 0 && (
              <span>✓ {r.confirmationsCount} confirmação(ões) da comunidade</span>
            )}
            {r.reportsCount > 0 && <span>⚠ {r.reportsCount} denúncia(s)</span>}
          </div>
        )}

        {/* Address label */}
        {r.addressLabel && (
          <p className="text-xs text-gray-400 bg-gray-100 rounded-lg px-3 py-2">
            📍 {r.addressLabel}
          </p>
        )}

        {/* Comments — help updates */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            Atualizações de quem ajudou
            {comments.length > 0 && (
              <span className="ml-auto text-xs font-normal text-gray-400">{comments.length}</span>
            )}
          </h3>

          {/* Comment list */}
          {comments.length > 0 ? (
            <ul className="space-y-2">
              {comments.map((c) => (
                <li key={c.id} className="bg-gray-50 rounded-lg px-3 py-2.5">
                  <p className="text-gray-800 text-sm leading-relaxed">{c.content}</p>
                  <p className="text-gray-400 text-xs mt-1">{formatTimeAgo(c.createdAt)}</p>
                </li>
              ))}
            </ul>
          ) : (
            !isResolved && (
              <p className="text-gray-400 text-xs">
                Nenhuma atualização ainda. Seja o primeiro a registrar o que foi enviado.
              </p>
            )
          )}

          {/* Comment form — only for open requests */}
          {!isResolved && (
            <div className="space-y-2 pt-1">
              <textarea
                value={commentText}
                onChange={(e) => {
                  setCommentText(e.target.value.slice(0, 300))
                  setCommentError(null)
                }}
                placeholder='Ex: Já foram enviados 10 fardos de água pelo grupo X'
                rows={2}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent placeholder-gray-400"
              />
              <div className="flex items-center justify-between gap-2">
                <span className={`text-xs ${commentText.length >= 280 ? 'text-orange-500' : 'text-gray-400'}`}>
                  {commentText.length}/300
                </span>
                <button
                  onClick={handleCommentSubmit}
                  disabled={submitting || commentText.trim().length < 5}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : null}
                  {submitting ? 'Enviando...' : 'Registrar ajuda enviada'}
                </button>
              </div>
              {commentError && (
                <p className="text-red-600 text-xs">{commentError}</p>
              )}
              {commentSuccess && (
                <p className="text-green-600 text-xs">✓ Atualização registrada com sucesso!</p>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="space-y-2 pb-8">
          {/* Copy location */}
          <button
            onClick={copyLocation}
            className="w-full flex items-center justify-center gap-2 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            {copied ? '✓ Link copiado!' : 'Copiar link da localização'}
          </button>

          {!isResolved && (
            <>
              {/* Resolve */}
              <button
                onClick={() => setShowResolve(true)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Marcar como resolvido (com código)
              </button>

              {/* Community confirm */}
              {!confirmMessage ? (
                <button
                  onClick={handleConfirm}
                  disabled={confirming}
                  className="w-full flex items-center justify-center gap-2 py-3 border border-blue-300 text-blue-700 rounded-xl text-sm font-medium hover:bg-blue-50 transition-colors disabled:opacity-50"
                >
                  {confirming ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                      />
                    </svg>
                  )}
                  {confirming ? 'Confirmando...' : 'Confirmar que ajuda chegou'}
                </button>
              ) : (
                <div className="w-full py-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700 text-center px-4">
                  {confirmMessage}
                </div>
              )}

              {/* Report */}
              {!reportMessage ? (
                <button
                  onClick={handleReport}
                  disabled={reporting}
                  className="w-full flex items-center justify-center gap-2 py-2 text-gray-400 hover:text-gray-600 text-xs transition-colors"
                >
                  ⚠ Reportar este pedido como abusivo ou falso
                </button>
              ) : (
                <p className="text-center text-xs text-gray-400">{reportMessage}</p>
              )}
            </>
          )}

          {isResolved && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <p className="text-green-700 font-semibold text-sm">✓ Este pedido foi resolvido</p>
              {r.resolvedReason && (
                <p className="text-green-600 text-xs mt-1">{r.resolvedReason}</p>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Resolve modal */}
      {showResolve && (
        <ResolveModal
          requestId={r.id}
          requestTitle={r.title}
          onClose={() => setShowResolve(false)}
          onResolved={() => setResolved(true)}
        />
      )}
    </div>
  )
}
