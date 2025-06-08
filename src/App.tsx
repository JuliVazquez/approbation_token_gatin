// src/App.tsx
import { useState, useRef} from 'react'
import Header from './components/Header'
import CheckPanel from './components/CheckPanel'
import MintPanel from './components/MintPanel'
import { connectMetamask, getContract, mintProofOfWorkNFT } from './utils/web3'
import { BrowserProvider } from 'ethers'
import type { NFTAsist, ProofOfWorkData } from './utils/web3'
import { CONTRACTS } from './utils/contracts'
import { ABIS } from './abi/index'

function App() {
  const [account, setAccount] = useState<string | null>(null)
  const [provider, setProvider] = useState<BrowserProvider | null>(null)
  const [validado, setValidado] = useState(false)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const nftCacheRef = useRef<NFTAsist[] | null>(null)
  
  const connectWallet = async () => {
    try {
      const { account, provider } = await connectMetamask()
      setAccount(account)
      setProvider(provider)
      setValidado(false)
      setMostrarFormulario(false)
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
    nftCacheRef.current = null
  }

  const handleMintSubmit = async (data: {
    nombre: string
    apellido: string
    fecha: string
    alumno: string
  }) => {
    if (!account || !provider) {
      alert('No hay wallet conectada')
      return
    }

    const alumno = `${data.nombre} ${data.apellido}`
    const emisor = account

    const cache = nftCacheRef.current
    console.log('🔍 Verificando NFTs en caché:', cache)
    if (!cache || cache.length < 10) {
      alert('Error: No se encontraron los 10 NFTs base.')
      return
    }

    const ids = cache.slice(0, 10).map(nft => nft.tokenId)

    const payload: ProofOfWorkData = {
      fecha: data.fecha,
      alumno,
      emisor,
      ids
    }
    console.log('📤 Payload PoF (solo ID y tema):', payload)

    const receptor = "0x0df90beF386E5F6f5AB511D2117ce85DF91b6aFE"
    const contract = await getContract(provider, CONTRACTS.TPNFT_TEST, ABIS.POW_TEST)
    await mintProofOfWorkNFT(contract, receptor, payload)
    await mintProofOfWorkNFT(contract, receptor, payload) // 2da emisión simulada
  }

  return (
    <div className="min-h-screen bg-gray-800 text-white flex flex-col items-center">
      <Header account={account} onConnect={connectWallet} onDisconnect={disconnectWallet} />
      <main className="w-full max-w-4xl p-6">
        <h2 className="text-xl font-semibold mb-4">Bienvenido al sistema de validación</h2>
        {!account || !provider ? (
          <p className="text-center">Conectá tu wallet para continuar.</p>
        ) : (
          <>
           <CheckPanel
              wallet={account}
              provider={provider}
              onValid={(nfts) => {
                setValidado(true)
                nftCacheRef.current = nfts
                console.log('💾 NFTs cargados en caché:', nfts)
              }}
            />
        
            {validado && !mostrarFormulario && (
              <div className="mt-6 text-center">
                <button
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold"
                  onClick={() => setMostrarFormulario(true)}
                >
                  Emitir ProofOfWorkNFT 🚀
                </button>
              </div>
            )}

            {validado && mostrarFormulario && (
              <MintPanel onSubmit={handleMintSubmit} onCancel={() => setMostrarFormulario(false)}/>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default App
