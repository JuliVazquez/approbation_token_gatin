// src/components/NFTListPanel.tsx
import type { NFTAsist } from '../utils/web3'

interface Props {
  nfts: NFTAsist[]
}

const NFTListPanel = ({ nfts }: Props) => {
  if (!nfts || nfts.length === 0) return null

  return (
    <div className="my-6">
      <h3 className="text-lg font-semibold mb-2 text-center">Tus NFTs válidos encontrados</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {nfts.map((nft, idx) => (
          <div
            key={idx}
            className="border rounded bg-gray-900 p-3 text-sm text-white flex flex-col items-start">
            {nft.metadata?.image && (
            <img
              src={nft.metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/')}
              alt={`NFT ${nft.tokenId}`}
              className="mt-2 rounded max-w-full max-h-40 object-contain"
            />
            )}
            <div><strong>ID:</strong> {nft.tokenId}</div>
            <div><strong>Tema:</strong> {nft.tema || 'Desconocido'}</div>
            <div>
              <strong>Fecha:</strong>{' '}
              {nft.fecha ? nft.fecha.toISOString().slice(0, 10) : '-'}
            </div>
            <div><strong>Transferido:</strong> {nft.fueTransferido ? 'Sí' : 'No'}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default NFTListPanel
