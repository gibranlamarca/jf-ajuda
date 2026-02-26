import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 text-center">
      <div className="text-6xl mb-4">🗺️</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Pedido não encontrado</h1>
      <p className="text-gray-500 text-sm mb-6 max-w-sm">
        Este pedido pode ter sido removido ou o endereço está incorreto.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
      >
        Voltar ao mapa
      </Link>
    </div>
  )
}
