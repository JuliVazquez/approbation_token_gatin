import { useEffect } from 'react'
import { ExternalLink } from 'lucide-react'

interface ToastProps {
  message: string
  hash?: string
  onClose: () => void
  duration?: number
}

const Toast = ({ message, hash, onClose, duration = 8000 }: ToastProps) => {
  useEffect(() => {
    const timeout = setTimeout(onClose, duration)
    return () => clearTimeout(timeout)
  }, [onClose, duration])

  return (
    <div className="fixed top-6 left-6 bg-white text-gray-900 px-6 py-4 rounded-xl shadow-xl z-50 animate-fade-in w-full max-w-lg border border-gray-300">
      <div className="flex justify-between items-start">
        <div className="text-sm font-medium space-y-2 break-words overflow-hidden">
          <div>{message}</div>
          <div className="text-xs text-gray-500">(hash: {hash || 'no hash recibido'})</div>
          {hash && (
            <div className="flex items-center gap-1">
              <a
                href={`https://sepolia.etherscan.io/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Ver en Sepolia Etherscan"
                className="text-blue-700 underline break-all hover:text-blue-900 transition"
              >
                {hash}
              </a>
              <ExternalLink className="w-4 h-4 text-blue-700" />
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-800 text-xl font-bold ml-4 leading-none"
        >
          &times;
        </button>
      </div>
    </div>
  )
}

export default Toast
