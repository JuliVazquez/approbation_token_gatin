// src/components/ApprovalStatusPanel.tsx
import { useEffect, useState } from 'react'
import { getAllApprovalNFTsForWallet } from '../utils/web3'
import type { ApprovalNFTData } from '../utils/web3'
import type { BrowserProvider } from 'ethers'

interface Props {
  wallet: string
  provider: BrowserProvider
  contractAddress: string
  onProceed: () => void
}

const ApprovalStatusPanel = ({ wallet, provider, contractAddress, onProceed }: Props) => {
  const [loading, setLoading] = useState(false)
  const [nfts, setNfts] = useState<ApprovalNFTData[]>([])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const results = await getAllApprovalNFTsForWallet(wallet, provider, contractAddress)
        setNfts(results)
      } catch (error) {
        console.error('❌ Error al obtener NFTs de aprobación:', error)
        setNfts([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [wallet, provider, contractAddress])

   if (loading) {
   return (
      <div className="flex justify-center items-center py-6">
         <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24" fill="none">
         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
         </svg>
         <span className="ml-3 text-sm text-gray-300">Cargando NFTs de aprobación...</span>
      </div>
   )
   }

  if (nfts.length > 0) {
    return (
      <div className="p-4 border rounded bg-neutral-900 text-white w-full space-y-6">
        <h3 className="text-lg font-semibold">✅ NFTs de aprobación encontrados: {nfts.length}</h3>

        {nfts.map((nft) => (
          <div
            key={nft.tokenId}
            className="p-4 border rounded-lg bg-gray-800 space-y-2 text-sm"
          >
            <p><strong>ID:</strong> {nft.tokenId}</p>
            <p><strong>Nota:</strong> {nft.nota}</p>
            <p><strong>Comentario:</strong> {nft.comentario}</p>
            <p><strong>Emisor:</strong> {nft.emisor}</p>

            <div className="border-t pt-3">
              <p className="text-sm mb-1">{nft.metadata.description}</p>
              <img
                src={nft.metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                alt={nft.metadata.name}
                className="w-full max-w-xs rounded-lg mx-auto"
              />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="text-center p-6 bg-neutral-900 border rounded text-white">
      <p className="mb-4">No se encontró ningún NFT de aprobación.</p>
      <button
        onClick={onProceed}
        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-semibold"
      >
        Validar 10 NFTs base
      </button>
    </div>
  )
}

export default ApprovalStatusPanel
