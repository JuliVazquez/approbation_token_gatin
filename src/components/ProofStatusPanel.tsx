// src/components/ProofStatusPanel.tsx
import { useEffect, useState } from 'react'
import { getContract } from '../utils/web3'
import { ABIS } from '../abi'
import { CONTRACTS } from '../utils/contracts'
import { BrowserProvider } from 'ethers'
import type { ProofOfWorkData } from '../utils/web3' // 👈 usamos el tipo ya definido

interface Props {
  wallet: string
  provider: BrowserProvider
}

const ProofStatusPanel = ({ wallet, provider }: Props) => {
  const [asistData, setAsistData] = useState<ProofOfWorkData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const contract = await getContract(provider, CONTRACTS.TPNFT_TEST, ABIS.POW_TEST)

        for (let tokenId = 1; tokenId <= 100; tokenId++) {
          const balance: bigint = await contract.balanceOf(wallet, tokenId)
          if (balance > 0n) {
            const datos = await contract.datosDeAsist(tokenId)

            const poof: ProofOfWorkData = {
               id: Number(tokenId),
              fecha: datos.fecha,
              alumno: datos.alumno,
              emisor: datos.emisor,
              PoF: datos.PoF.map((entry: { id: bigint; tema: string }) => ({
                id: Number(entry.id),
                tema: entry.tema
              }))
            }

            setAsistData(poof)
            break
          }
        }
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
    <div className="p-4 border rounded bg-neutral-900 text-white w-full space-y-2">
      <h3 className="text-lg font-semibold mb-2">NFT de Aprobación</h3>
      <p><strong>ID:</strong> {asistData.id}</p>
      <p><strong>Fecha:</strong> {asistData.fecha}</p>
      <p><strong>Alumno:</strong> {asistData.alumno}</p>
      <p><strong>Emisor:</strong> {asistData.emisor}</p>
      <div>
        <strong>Pruebas de trabajo (PoF):</strong>
        <ul className="ml-6 list-disc text-sm mt-1">
          {asistData.PoF.map((item) => (
            <li key={item.id}>ID {item.id} – {item.tema}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default ProofStatusPanel
