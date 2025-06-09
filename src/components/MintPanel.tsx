// src/components/MintPanel.tsx
import { useState } from 'react'

interface Props {
  onSubmit: (data: { nombre: string; apellido: string; fecha: string; alumno: string }) => void
  onCancel?: () => void
  loading?: boolean
}

const MintPanel = ({ onSubmit, onCancel, loading }: Props) => {
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [fecha, setFecha] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const alumno = `${nombre.trim()} ${apellido.trim()}`
    onSubmit({ nombre, apellido, fecha, alumno })
  }

  return (
    <div className="relative mt-6 p-6 border rounded-lg bg-neutral-900 text-white w-full max-w-lg mx-auto">
      {onCancel && (
        <button
          onClick={onCancel}
          className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xl font-bold"
          title="Cerrar"
        >
          ✖
        </button>
      )}
      <h3 className="text-lg font-semibold mb-4">Formulario de emisión de ProofOfWorkNFT</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Nombre</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-600 text-white"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Apellido</label>
          <input
            type="text"
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
            required
            className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-600 text-white"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Fecha</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
            className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-600 text-white"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-700 py-2 rounded font-semibold flex items-center justify-center disabled:opacity-50"
          disabled={loading}
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : (
            'Confirmar y mintear'
          )}
        </button>

      </form>
    </div>
  )
}

export default MintPanel
