import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('show_trilhao_token') || null)
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('show_trilhao_user')
    try {
      return savedUser ? JSON.parse(savedUser) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (token) {
      localStorage.setItem('show_trilhao_token', token)
    } else {
      localStorage.removeItem('show_trilhao_token')
    }

    if (user) {
      localStorage.setItem('show_trilhao_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('show_trilhao_user')
    }
  }, [token, user])

  const login = (tokenData, userData) => {
    setToken(tokenData)
    setUser(userData)
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('show_trilhao_token')
    localStorage.removeItem('show_trilhao_user')
  }

  const isAuthenticated = Boolean(token)
  const isPresenter = user?.role === 'ROLE_APRESENTADOR' || user?.role === 'ROLE_ADMIN'
  const isAdmin = user?.role === 'ROLE_ADMIN'

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        setLoading,
        isAuthenticated,
        isPresenter,
        isAdmin,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider')
  }
  return context
}
