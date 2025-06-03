import { useState } from 'react'
import Header from './components/Header'
import CheckPanel from './components/CheckPanel'
import { connectMetamask } from './utils/web3'
import { BrowserProvider } from 'ethers'

function App() {
  const [account, setAccount] = useState<string | null>(null)
  const [provider, setProvider] = useState<BrowserProvider | null>(null)
  const [validado, setValidado] = useState(false)


  const connectWallet = async () => {
    try {
      const { account, provider } = await connectMetamask()
      setAccount(account)
      setProvider(provider)
      setValidado(false)
    } catch (error) {
      alert('No se pudo conectar con Metamask')
      console.error(error)
    }
  }

  const disconnectWallet = () => {
    setAccount(null)
    setProvider(null)
    setValidado(false)
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
          {/*Solo mostramos CheckPanel si aún no fue validado */}
          {!validado && (
            <CheckPanel
              wallet={account}
              provider={provider}
              onValid={() => setValidado(true)}
            />
          )}

          {/*Mostrar botón solo si pasó la validación */}
          {validado && (
            <div className="mt-6 text-center">
              <button
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold"
                onClick={() => alert("Listo para emitir el NFT-TP 🚀")}
              >
                Emitir NFT-TP
              </button>
            </div>
          )}
        </>
      )}
    </main>
  </div>
)

}

export default App;
