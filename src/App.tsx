import { useState, useRef } from 'react'
import Header from './components/Header'
import CheckPanel from './components/CheckPanel'
import MintPanel from './components/MintPanel'
import { connectMetamask, getContract, mintProofOfWorkNFT } from './utils/web3'
import { BrowserProvider } from 'ethers'
import type { NFTAsist, ProofOfWorkData } from './utils/web3'
import { CONTRACTS } from './utils/contracts'
import { WALLETS } from './utils/wallets'
import { ABIS } from './abi/index'
import NFTListPanel from './components/NFTListaPanel'
import ProofStatusPanel from './components/ProofStatusPanel'

function App() {
  const [esProfesor, setEsProfesor] = useState(false)
  const [account, setAccount] = useState<string | null>(null)
  const [provider, setProvider] = useState<BrowserProvider | null>(null)
  const [validado, setValidado] = useState(false)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [mostrarNFTs, setMostrarNFTs] = useState(false)
  const [loadingMint, setLoadingMint] = useState(false)
  const [disableMintButton, setDisableMintButton] = useState(true)
  const [mintSuccess, setMintSuccess] = useState(false)

  const nftCacheRef = useRef<NFTAsist[] | null>(null)

  const connectWallet = async () => {
    try {
      const { account, provider } = await connectMetamask()
      setAccount(account)
      setProvider(provider)

      const esProfe = [WALLETS.TEST_WALLET_1.toLowerCase(), WALLETS.TEST_WALLET_2.toLowerCase()].includes(account.toLowerCase())
      setEsProfesor(esProfe)

      setValidado(false)
      setMostrarFormulario(false)
      setMostrarNFTs(false)
      setMintSuccess(false)
      nftCacheRef.current = null
    } catch (error) {
      alert('No se pudo conectar con Metamask')
      console.error(error)
    }
  }

  const disconnectWallet = () => {
    setAccount(null)
    setProvider(null)
    setValidado(false)
    setMostrarFormulario(false)
    setMostrarNFTs(false)
    setMintSuccess(false)
    nftCacheRef.current = null
  }

  const handleMintSubmit = async (data: { nombre: string, apellido: string, fecha: string, alumno: string }) => {
    if (!account || !provider) {
      alert('No hay wallet conectada')
      return
    }

    const alumno = `${data.nombre} ${data.apellido}`
    const emisor = account
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
        await mintProofOfWorkNFT(contract, receptor, payload)
      } catch (error) {
        console.error(`❌ Error al mintear para ${receptor}:`, error)
        alert(`Error al mintear el NFT para ${receptor}`)
      }
    }

    setLoadingMint(false)
    setMostrarFormulario(false)
    setMintSuccess(true)
  }

  return (
    <div className="min-h-screen bg-gray-800 text-white flex flex-col items-center">
      {!esProfesor && (
        <Header account={account} onConnect={connectWallet} onDisconnect={disconnectWallet} />
      )}

      <main className="w-full max-w-4xl p-6">
        <h2 className="text-xl font-semibold mb-4">Bienvenido al sistema de validación</h2>

        {!account || !provider ? (
          <p className="text-center">Conectá tu wallet para continuar.</p>
        ) : esProfesor ? (
          <ProofStatusPanel wallet={account} provider={provider} />
        ) : (
          <>
            <CheckPanel
              wallet={account}
              provider={provider}
              onValid={(nfts) => {
                setValidado(true)
                setDisableMintButton(false)
                setMostrarFormulario(false)
                setMintSuccess(false)
                nftCacheRef.current = nfts
                setMostrarNFTs(true)
              }}
              onReset={() => {
                setValidado(false)
                setMostrarNFTs(false)
                setMostrarFormulario(false)
                setDisableMintButton(true)
                setMintSuccess(false)
                nftCacheRef.current = null
              }}
            />

            <div className="mt-6 text-center min-h-[72px] flex justify-center items-center">
              {disableMintButton ? (
                <div className="bg-red-800 text-white p-4 rounded-lg shadow-md">
                  <p className="text-md font-semibold">Aún no cumple los requisitos para aprobar.</p>
                </div>
              ) : mintSuccess ? (
                <div className="bg-green-800 text-white p-4 rounded-lg shadow-md">
                  <p className="text-md font-semibold">✅ NFT de ProofOfWork emitidos y minteados exitosamente</p>
                </div>
              ) : (
                <button
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold"
                  onClick={() => {
                    setMostrarNFTs(false)
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
                onSubmit={(data) => handleMintSubmit(data)}
                onCancel={() => setMostrarFormulario(false)}
                loading={loadingMint}
              />
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default App
