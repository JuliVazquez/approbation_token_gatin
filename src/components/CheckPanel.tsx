import { useEffect, useRef, useState } from 'react'
import type { BrowserProvider } from 'ethers'
import { fetchNFTsFromWallet } from '../utils/web3'
import type { NFTAsist } from '../utils/web3'


interface Props {
  wallet: string
  provider: BrowserProvider
  onValid?: () => void
}

const FECHA_CORTE = new Date('2025-05-28T00:00:00Z')

const CheckPanel = ({ wallet, provider, onValid }: Props) => {
  const [nftCountOK, setNftCountOK] = useState(false)
  const [fechaOK, setFechaOK] = useState(false)
  const [sinTransferencias, setSinTransferencias] = useState(false)
  const [loading, setLoading] = useState(false)

  const yaValidado = useRef(false)
  const resultadoCacheado = useRef<NFTAsist[] | null>(null)

  useEffect(() => {
   console.log("🔁 Ejecutando useEffect de CheckPanel") 
   if (!wallet || !provider || yaValidado.current) return

    const validar = async () => {
      setLoading(true)
      try {
        console.log('Ejecutando fetchNFTsFromWallet')
        const nfts = await fetchNFTsFromWallet(wallet, provider)
        resultadoCacheado.current = nfts

        const cumpleCantidad = nfts.length >= 10
        const cumpleFechas = nfts.every(nft => nft.fecha && nft.fecha < FECHA_CORTE)
        const sinMovimientos = nfts.every(nft => !nft.fueTransferido)

        setNftCountOK(cumpleCantidad)
        setFechaOK(cumpleFechas)
        setSinTransferencias(sinMovimientos)

        if (cumpleCantidad && cumpleFechas && sinMovimientos) {
          console.log('Habilitado para emitir NFT-TP')
          yaValidado.current = true
          onValid?.()
        }
      } catch (error) {
        console.error('Error al validar NFTs:', error)
        setNftCountOK(false)
        setFechaOK(false)
        setSinTransferencias(false)
      } finally {
        setLoading(false)
      }
    }

    validar()
  }, [wallet, provider, onValid])

  return (
    <div className="p-4 border rounded bg-neutral-900 text-white w-full">
      <h3 className="text-lg font-semibold mb-2">Validaciones:</h3>
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
