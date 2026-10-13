import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import ColdStartBanner from './ColdStartBanner'

export default function Layout() {
  const location = useLocation()
  const isGameRoute = location.pathname.startsWith('/jogo')

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
