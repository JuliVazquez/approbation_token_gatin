import { useEffect, useRef, useState } from 'react'
import type { BrowserProvider } from 'ethers'
import { fetchNFTsFromWallet } from '../utils/web3'
import type { NFTAsist } from '../utils/web3'

interface Props {
  wallet: string
  provider: BrowserProvider
  onValid: (nfts: NFTAsist[]) => void
}

const FECHA_CORTE = new Date('2025-05-28T00:00:00Z')

const CheckPanel = ({ wallet, provider, onValid }: Props) => {
  const [nftCountOK, setNftCountOK] = useState(false)
  const [fechaOK, setFechaOK] = useState(false)
  const [sinTransferencias, setSinTransferencias] = useState(false)
  const [loading, setLoading] = useState(false)
  const [forceRefresh, setForceRefresh] = useState(0)

  const yaValidado = useRef(false)
  const walletValidado = useRef<string | null>(null)

  useEffect(() => {
    console.log("🔁 Ejecutando useEffect de CheckPanel")

    if (!wallet || !provider) return
    if (yaValidado.current && walletValidado.current === wallet && forceRefresh === 0) return

    const validar = async () => {
      // Limpieza previa
      setLoading(true)
      setNftCountOK(false)
      setFechaOK(false)
      setSinTransferencias(false)

      try {
        console.log('🚀 Ejecutando fetchNFTsFromWallet')
        const nfts = await fetchNFTsFromWallet(wallet, provider)

        const cumpleCantidad = nfts.length >= 10
        const cumpleFechas = nfts.every(nft => nft.fecha && nft.fecha < FECHA_CORTE)
        const sinMovimientos = nfts.every(nft => !nft.fueTransferido)

        setNftCountOK(cumpleCantidad)
        setFechaOK(cumpleFechas)
        setSinTransferencias(sinMovimientos)

        if (cumpleCantidad && cumpleFechas && sinMovimientos) {
          console.log('✔️ Habilitado para emitir NFT-TP')
          yaValidado.current = true
          walletValidado.current = wallet;
          onValid(nfts) 
        }
      } catch (error) {
        console.error('Error al validar NFTs:', error)
      } finally {
        setLoading(false)
      }
    }

    validar()
  }, [wallet, provider, onValid, forceRefresh])

  return (
    <div className="p-4 border rounded bg-neutral-900 text-white w-full">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">Validaciones:</h3>
        <button
          onClick={() => {
            yaValidado.current = false
            walletValidado.current = null
            setForceRefresh(prev => prev + 1)
          }}
          className="text-sm text-blue-400 hover:text-blue-200"
        >
          🔄 Actualizar validación
        </button>
      </div>
      {loading ? (
        <p className="text-gray-400">Cargando NFTs y eventos...</p>
      ) : (
        <ul className="list-disc ml-6 text-sm space-y-1">
          <li className={nftCountOK ? 'text-green-400' : 'text-red-400'}>
            A. Posee al menos 10 NFTs del contrato: {nftCountOK ? '✔' : '✘'}
          </li>
          <li className={fechaOK ? 'text-green-400' : 'text-red-400'}>
            B. Todos fueron minteados antes del 28/05/2025: {fechaOK ? '✔' : '✘'}
          </li>
          <li className={sinTransferencias ? 'text-green-400' : 'text-red-400'}>
            C. Ningún NFT fue transferido luego de recibido: {sinTransferencias ? '✔' : '✘'}
          </li>
        </ul>
      )}
    </div>
  )
}

export default CheckPanel
