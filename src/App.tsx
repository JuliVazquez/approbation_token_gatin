// src/App.tsx
import { useState } from 'react'
import Header from './components/Header'
import ProofStatusPanel from './components/ProofStatusPanel'
import ApprovalStatusPanel from './components/ApprovalStatusPanel'
import ValidationFlow from './components/ValidationFlow'
import { connectMetamask } from './utils/web3'
import { WALLETS } from './utils/wallets'
import { CONTRACTS } from './utils/contracts'
import type { BrowserProvider } from 'ethers'

type Panel = 'validacion' | 'aprobaciones' | 'docente'

function App() {
  const [esProfesor, setEsProfesor] = useState(false)
  const [account, setAccount] = useState<string | null>(null)
  const [provider, setProvider] = useState<BrowserProvider | null>(null)
  const [panelActivo, setPanelActivo] = useState<Panel>('validacion')

  const connectWallet = async () => {
    try {
      const { account, provider } = await connectMetamask()
      setAccount(account)
      setProvider(provider)

      const esProfe = [
        WALLETS.WALLET_D.toLowerCase(),
        WALLETS.WALLET_P.toLowerCase()
      ].includes(account.toLowerCase())

      setEsProfesor(esProfe)
      setPanelActivo('validacion')
    } catch (error) {
      alert('No se pudo conectar con Metamask')
      console.error(error)
    }
  }

  const disconnectWallet = () => {
    setAccount(null)
    setProvider(null)
    setEsProfesor(false)
    setPanelActivo('validacion')
  }

  const renderTabs = () => (
    <div className="flex border-b border-gray-600 mb-6">
      <button
        onClick={() => setPanelActivo('validacion')}
        className={`px-4 py-2 font-semibold text-sm rounded-t ${
          panelActivo === 'validacion'
            ? 'bg-emerald-600 text-white'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
      >
        🧪 Validación
      </button>

      <button
        onClick={() => setPanelActivo('aprobaciones')}
        className={`px-4 py-2 font-semibold text-sm rounded-t ml-2 ${
          panelActivo === 'aprobaciones'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
      >
        📘 Estado del curso
      </button>

      <button
        onClick={() => setPanelActivo('docente')}
        className={`px-4 py-2 font-semibold text-sm rounded-t ml-2 ${
          panelActivo === 'docente'
            ? 'bg-indigo-600 text-white'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
      >
        🎓 Docente
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-800 text-white flex flex-col items-center">
      <Header account={account} onConnect={connectWallet} onDisconnect={disconnectWallet} />

      <main className="w-full max-w-4xl p-6">
        <h2 className="text-xl font-semibold mb-4">Bienvenido al sistema de validación</h2>

        {!account || !provider ? (
          <p className="text-center">Conectá tu wallet para continuar.</p>
        ) : (
          <>
            {renderTabs()}

            {panelActivo === 'validacion' && (
              esProfesor ? (
                <div className="p-6 bg-red-900 text-white rounded-lg text-center shadow">
                  <p className="text-lg font-semibold">🚫 Sección inhabilitada</p>
                  <p className="text-sm mt-1">Esta sección es exclusiva para alumnos.</p>
                </div>
              ) : (
                <ValidationFlow wallet={account} provider={provider} />
              )
            )}

            {panelActivo === 'aprobaciones' && (
              esProfesor ? (
                <div className="p-6 bg-red-900 text-white rounded-lg text-center shadow">
                  <p className="text-lg font-semibold">🚫 Sección inhabilitada</p>
                  <p className="text-sm mt-1">Esta sección es exclusiva para alumnos.</p>
                </div>
              ) : (
                <ApprovalStatusPanel
                  wallet={account}
                  provider={provider}
                  contractAddress={CONTRACTS.APPROVAL}
                  onProceed={() => setPanelActivo('validacion')}
                />
              )
            )}

            {panelActivo === 'docente' && (
              esProfesor ? (
                <ProofStatusPanel wallet={account} provider={provider} setToast={() => {}} />
              ) : (
                <div className="p-6 bg-red-900 text-white rounded-lg text-center shadow">
                  <p className="text-lg font-semibold">🚫 Sección inhabilitada</p>
                  <p className="text-sm mt-1">Esta sección es exclusiva para docentes autorizados.</p>
                </div>
              )
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default App
