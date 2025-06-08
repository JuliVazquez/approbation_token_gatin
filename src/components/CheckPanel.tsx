import { useEffect, useRef, useState } from 'react'
import type { BrowserProvider } from 'ethers'
import { fetchNFTsFromWallet } from '../utils/web3'
import type { NFTAsist } from '../utils/web3'
import { CONTRACTS } from '../utils/contracts'

interface Props {
  wallet: string
  provider: BrowserProvider
  onValid: (nfts: NFTAsist[]) => void
}

const FECHA_CORTE = new Date('2025-05-28T00:00:00Z')

const CheckPanel = ({ wallet, provider, onValid }: Props) => {
  const [loading, setLoading] = useState(false)
  const [cumpleCantidad, setCumpleCantidad] = useState(false)
  const [cumpleFechas, setCumpleFechas] = useState(false)
  const [sinMovimientos, setSinMovimientos] = useState(false)
  const [forceRefresh, setForceRefresh] = useState(0)

  const yaValidado = useRef(false)
  const walletValidado = useRef<string | null>(null)

  useEffect(() => {
    if (!wallet || !provider) return
    if (yaValidado.current && walletValidado.current === wallet && forceRefresh === 0) return

    const validar = async () => {
      setLoading(true)
      setCumpleCantidad(false)
      setCumpleFechas(false)
      setSinMovimientos(false)

      try {
        const nfts = await fetchNFTsFromWallet(wallet, provider, CONTRACTS.CLASS_NFT)

        const cumpleA = nfts.length >= 10
        const cumpleB = nfts.every(nft => nft.fecha && nft.fecha < FECHA_CORTE)
        const cumpleC = nfts.every(nft => !nft.fueTransferido)

        setCumpleCantidad(cumpleA)
        setCumpleFechas(cumpleB)
        setSinMovimientos(cumpleC)

        if (cumpleA && cumpleB && cumpleC) {
          yaValidado.current = true
          walletValidado.current = wallet
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

  const renderEstado = (ok: boolean, texto: string) => {
    return (
      <li className={`flex items-center space-x-2 ${ok ? 'text-green-400' : 'text-red-400'}`}>
        {loading && !ok ? (
          <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        ) : (
          <span>{ok ? '✔' : '✘'}</span>
        )}
        <span>{texto}</span>
      </li>
    )
  }

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

      <ul className="list-disc ml-6 text-sm space-y-1">
        {renderEstado(cumpleCantidad, 'Posee al menos 10 NFTs del contrato')}
        {renderEstado(cumpleFechas, 'Todos fueron minteados antes del 28/05/2025')}
        {renderEstado(sinMovimientos, 'Ningún NFT fue transferido luego de recibido')}
      </ul>
    </div>
  )
}

export default CheckPanel
