import { useEffect, useState } from 'react'
import { getContract, getProofOfWorkNFTForWallet } from '../utils/web3'
import { ABIS } from '../abi'
import { CONTRACTS } from '../utils/contracts'
import { BrowserProvider } from 'ethers'
import type { ProofOfWorkData } from '../utils/web3'

interface Props {
  wallet: string
  provider: BrowserProvider
}

interface Metadata {
  name: string
  description: string
  image: string
}

interface AsistDataExt extends ProofOfWorkData {
  tokenId: number
  metadata: Metadata
}

const ProofStatusPanel = ({ wallet, provider }: Props) => {
  const [asistData, setAsistData] = useState<AsistDataExt | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const nft = await getProofOfWorkNFTForWallet(wallet, provider)
        setAsistData(nft)
      } catch (err) {
        console.error('Error al obtener datos del NFT:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [wallet, provider])

  if (loading) return <div className="text-sm text-gray-300">Cargando datos del NFT de aprobación...</div>
  if (!asistData) return <div className="text-sm text-red-400">No se encontró NFT de aprobación.</div>

  return (
    <div className="p-4 border rounded bg-neutral-900 text-white w-full space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">NFT de Aprobación</h3>
        <p><strong>ID:</strong> {asistData.tokenId}</p>
        <p><strong>Fecha:</strong> {asistData.fecha}</p>
        <p><strong>Alumno:</strong> {asistData.alumno}</p>
        <p><strong>Emisor:</strong> {asistData.emisor}</p>
        <div>
          <strong>Pruebas de trabajo (PoF):</strong>
          <ul className="ml-6 list-disc text-sm mt-1">
            {asistData.PoF.map((item) => (
              <li key={item.id}>ID {item.id}</li>
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
    </div>
  )
}

export default ProofStatusPanel