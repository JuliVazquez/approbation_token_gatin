import { useState } from 'react'
import { getProofOfWorkNFTForWallet, getContract, mintApprovalNFT } from '../utils/web3'
import type { AsistDataExt } from '../utils/web3'
import { BrowserProvider, Contract } from 'ethers'
import { CONTRACTS } from '../utils/contracts'
import { RotateCcw, LogOut } from 'lucide-react'
import { ABIS } from '../abi'

interface Props {
  wallet: string
  provider: BrowserProvider
  setToast: (data: { visible: boolean; message: string; hash?: string }) => void
}

const ProofStatusPanel = ({ wallet, provider, setToast }: Props) => {
  const [asistData, setAsistData] = useState<AsistDataExt | null>(null)
  const [loading, setLoading] = useState(false)
  const [contractAddress, setContractAddress] = useState(CONTRACTS.POW_NFT)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [nota, setNota] = useState('')
  const [comentario, setComentario] = useState('')
  const [approvedHash, setApprovedHash] = useState<string | null>(null)

const fetchData = async () => {
  if (!contractAddress) return
  setLoading(true)
  try {
    console.log("Buscando ProofOfWorkNFT con wallet:", wallet, "en contrato:", contractAddress)
    const nft = await getProofOfWorkNFTForWallet(wallet, provider, contractAddress)
    console.log("NFT Proof of Work recibido:", nft)
    setAsistData(nft)
  } catch (err) {
    console.error('Error al obtener datos del NFT:', err)
    setAsistData(null)
  } finally {
    setLoading(false)
  }
}

  const handleDisconnect = () => {
    setAsistData(null)
    setContractAddress(CONTRACTS.POW_NFT)
  }

const handleSubmit = async () => {
  if (!asistData?.emisor || !provider) {
    alert("No se puede enviar la evaluación: faltan datos o conexión.")
    return
  }

  try {
    const contract = await getContract(provider, CONTRACTS.APPROVAL, ABIS.APPROVAL)
    const txResult = await mintApprovalNFT(contract as Contract, asistData.emisor, comentario, nota)

    if (txResult) {
      setToast({
        visible: true,
        message: 'NFT de aprobación emitido correctamente',
        hash: txResult.hash
      })

      setApprovedHash(txResult.hash)
      setMostrarFormulario(false)
      setComentario('')
      setNota('')
    }
  } catch (err) {
    console.error("Error al emitir NFT de aprobación:", err)
    alert("Error al emitir el Approval NFT. Verifique que cumple con las condiciones de emision")
  }
}


  return (
    <div className="p-4 border rounded bg-neutral-900 text-white w-full space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mb-4">
        <input
          type="text"
          value={contractAddress}
          onChange={(e) => setContractAddress(e.target.value)}
          placeholder="Dirección del contrato"
          className="flex-grow px-3 py-2 rounded bg-gray-800 text-white border border-gray-600 mb-2 sm:mb-0"
        />
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm"
        >Buscar</button>
        <button
          onClick={() => {
            setContractAddress(CONTRACTS.POW_NFT)
            fetchData()
          }}
          className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm"
          title="Reset"
        >
          <RotateCcw size={18} />
        </button>
        <button
          onClick={handleDisconnect}
          className="p-2 bg-red-700 hover:bg-red-600 rounded text-white text-sm"
          title="Desconectar"
        >
          <LogOut size={18} />
        </button>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-6">
          <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span className="ml-3 text-sm text-gray-300">Buscando NFT de prueba de trabajo...</span>
        </div>
      )}

      {!loading && !asistData && <div className="text-sm text-red-400">No se encontró NFT de prueba de trabajo para el contrato ingresado.</div>}

      {asistData && !mostrarFormulario && (
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">NFT de Aprobación</h3>
            <p><strong>ID:</strong> {asistData.tokenId}</p>
            <p><strong>Fecha:</strong> {asistData.fecha}</p>
            <p><strong>Alumno (quien emitió):</strong> {asistData.alumno}</p>
            <p><strong>Emisor (contrato que recibió):</strong> {asistData.emisor}</p>
            <div>
              <strong>Pruebas de trabajo (PoF):</strong>
              <ul className="ml-6 list-disc text-sm mt-1">
                {asistData.PoF.map((item) => (
                  <li key={item.id}>
                    ID {item.id}
                    {item.tema && <> — Tema: <strong>{item.tema}</strong></>}
                    {item.clase !== undefined && <> — Clase: <strong>{item.clase}</strong></>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {asistData.metadata && (
            <div className="border-t pt-4">
              <h4 className="text-md font-semibold mb-1">Metadata:</h4>
              <p className="mb-1 text-sm">{asistData.metadata.description}</p>
              <img
                src={asistData.metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                alt={asistData.metadata.name}
                className="w-full max-w-xs rounded-lg mx-auto"
              />
            </div>
          )}

          {approvedHash ? (
            <div className="mt-4 p-4 bg-green-800 text-white rounded-lg shadow text-sm">
              ✅ Se aprobó al alumno <span className="font-mono">{asistData.emisor}</span>.
            </div>
          ) : (
            <div className="pt-4 text-center">
              <button
                onClick={() => setMostrarFormulario(true)}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-semibold"
              >Aprobar</button>
            </div>
          )}
        </div>
      )}

      {mostrarFormulario && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Formulario de Evaluación</h3>
          <div>
            <label className="block text-sm mb-1">Nota</label>
            <input
              type="text"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-600 text-white"
              placeholder="Ej: 10"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Comentario</label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-600 text-white"
              rows={3}
              placeholder="Escribe tu observación"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setMostrarFormulario(false)}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded text-white"
            >Cancelar</button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white"
            >Enviar</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProofStatusPanel
