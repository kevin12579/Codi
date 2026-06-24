import { createContext, useContext } from 'react'

const AuthContext = createContext({
  user: null,
  isLoggedIn: false,
})

export const AuthProvider = ({ children, user = null, isLoggedIn = false }) => {
  return <AuthContext.Provider value={{ user, isLoggedIn }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
