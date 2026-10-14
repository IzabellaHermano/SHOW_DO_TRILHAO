import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import ColdStartBanner from './ColdStartBanner'
import { useToast } from '../context/ToastContext'

export default function Layout() {
  const location = useLocation()
  const isGameRoute = location.pathname.startsWith('/jogo')
  const toast = useToast()

  useEffect(() => {
    const handleLost = () => {
      toast.notifyConnectionLost?.()
    }

    const handleRestored = () => {
      toast.notifyConnectionRestored?.()
    }

    window.addEventListener('app-connection-lost', handleLost)
    window.addEventListener('app-connection-restored', handleRestored)

    return () => {
      window.removeEventListener('app-connection-lost', handleLost)
      window.removeEventListener('app-connection-restored', handleRestored)
    }
  }, [toast])

  return (
    <div className={`app-root-shell ${isGameRoute ? 'shell-game-mode' : ''}`}>
      {!isGameRoute && <Navbar />}
      <ColdStartBanner />
      <main className={`main-stage ${isGameRoute ? 'main-game-fullscreen' : ''}`}>
        <Outlet />
      </main>
    </div>
  )
}
