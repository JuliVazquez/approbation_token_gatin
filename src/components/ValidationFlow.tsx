import { useEffect, useRef, useState } from 'react'
import CheckPanel from './CheckPanel'
import MintPanel from './MintPanel'
import NFTListPanel from './NFTListaPanel'
import Toast from './Toast'
import { getContract, mintProofOfWorkNFT, getAllApprovalNFTsForWallet } from '../utils/web3'
import { CONTRACTS } from '../utils/contracts'
import { ABIS } from '../abi'
import { WALLETS } from '../utils/wallets'
import type { NFTAsist, ProofOfWorkData, ApprovalNFTData } from '../utils/web3'
import type { BrowserProvider } from 'ethers'

interface Props {
  wallet: string
  provider: BrowserProvider
}

const ValidationFlow = ({ wallet, provider }: Props) => {
  const [validado, setValidado] = useState(false)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [mostrarNFTs, setMostrarNFTs] = useState(false)
  const [loadingMint, setLoadingMint] = useState(false)
  const [disableMintButton, setDisableMintButton] = useState(true)
  const [toast, setToast] = useState<{ visible: boolean; message: string; hash?: string }>({
    visible: false,
    message: ''
  })
  const [yaAprobado, setYaAprobado] = useState(false)

  const nftCacheRef = useRef<NFTAsist[] | null>(null)

  const verificarAprobacion = async () => {
    try {
      const approvals: ApprovalNFTData[] = await getAllApprovalNFTsForWallet(wallet, provider, CONTRACTS.APPROVAL)
      setYaAprobado(approvals.length > 0)
    } catch (error) {
      console.error('Error al verificar aprobación:', error)
    }
  }

  useEffect(() => {
    verificarAprobacion()
  }, [wallet, provider])

  const handleMintSubmit = async (data: { nombre: string, apellido: string, fecha: string, alumno: string }) => {
    const alumno = `${data.nombre} ${data.apellido}`
    const emisor = wallet
    const cache = nftCacheRef.current
    if (!cache || cache.length < 10) {
      alert('Error: No se encontraron los 10 NFTs base.')
      return
    }

    const PoF = cache.slice(0, 10).map(nft => ({
      id: nft.tokenId,
      contractAddress: CONTRACTS.CLASS_NFT
    }))

    const payload: ProofOfWorkData = { fecha: data.fecha, alumno, emisor, PoF }

    setLoadingMint(true)
    const contract = await getContract(provider, CONTRACTS.POW_NFT, ABIS.POW_TEST)
    const receptores = [WALLETS.TEST_WALLET_1, WALLETS.TEST_WALLET_2]

    for (const receptor of receptores) {
      try {
        const txResult = await mintProofOfWorkNFT(contract, receptor, payload)
        if (txResult) {
          setToast({
            visible: true,
            message: `✅ NFT emitido exitosamente a ${receptor}`,
            hash: txResult.hash
          })
        }
      } catch (error) {
        console.error(`❌ Error al mintear para ${receptor}:`, error)
        alert(`Error al mintear el NFT para ${receptor}`)
      }
    }

    setLoadingMint(false)
    setMostrarFormulario(false)
    verificarAprobacion()
  }

  return (
    <div className="space-y-4">
      <CheckPanel
        wallet={wallet}
        provider={provider}
        onValid={(nfts) => {
          setValidado(true)
          setDisableMintButton(false)
          setMostrarFormulario(false)
          nftCacheRef.current = nfts
          setMostrarNFTs(true)
          verificarAprobacion()
        }}
        onReset={() => {
          setValidado(false)
          setMostrarNFTs(false)
          setMostrarFormulario(false)
          setDisableMintButton(true)
          setToast({ visible: false, message: '', hash: undefined })
          nftCacheRef.current = null
          verificarAprobacion()
        }}
      />

      <div className="mt-6 text-center min-h-[72px] flex flex-col items-center gap-2">
        {yaAprobado ? (
          <div className="bg-orange-500 text-white p-4 rounded-lg shadow-md">
            <p className="text-md font-semibold">ℹ️ El alumno ya tiene un NFT de aprobación.</p>
          </div>
        ) : disableMintButton ? (
          <div className="bg-red-800 text-white p-4 rounded-lg shadow-md">
            <p className="text-md font-semibold">Aún no cumple los requisitos para aprobar.</p>
          </div>
        ) : (
          <div className="bg-green-800 text-white p-4 rounded-lg shadow-md">
            <p className="text-md font-semibold">✅ Cumple con los requisitos para aprobar.</p>
          </div>
        )}

        {!disableMintButton && (
          <button
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold"
            onClick={() => {
              setMostrarNFTs(false)
              setToast({ visible: false, message: '' })
              setMostrarFormulario(true)
            }}
          >
            Emitir ProofOfWorkNFT
          </button>
        )}
      </div>

      {validado && nftCacheRef.current && (
        <div className="my-4">
          <button
            className="mb-2 px-4 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
            onClick={() => setMostrarNFTs(prev => !prev)}
          >
            {mostrarNFTs ? 'Ocultar NFTs ⬆' : 'Mostrar NFTs ⬇'}
          </button>
          {mostrarNFTs && <NFTListPanel nfts={nftCacheRef.current} />}
        </div>
      )}

      {validado && mostrarFormulario && (
        <MintPanel
          onSubmit={handleMintSubmit}
          onCancel={() => setMostrarFormulario(false)}
          loading={loadingMint}
        />
      )}

      {toast.visible && (
        <Toast
          message={toast.message}
          hash={toast.hash}
          onClose={() => setToast({ visible: false, message: '', hash: undefined })}
        />
      )}
    </div>
  )
}

export default ValidationFlow
