import React, { createContext, useState, useContext, useEffect } from 'react'
import { api, parseApiError } from '../config/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = () => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData))
      } catch {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }

  const login = async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', { email, password })
      const { token, usuario } = response.data
      
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(usuario))
      
      setUser(usuario)
      return { success: true }
    } catch (error) {
      return { success: false, error: parseApiError(error) }
    }
  }

  const register = async (userData) => {
    try {
      const response = await api.post('/api/auth/registro', {
        nombre: userData.nombre,
        email: userData.email,
        telefono: userData.telefono || null,
        password: userData.password,
        tipo_identificacion: userData.tipo_identificacion || 'CC',
        numero_identificacion: userData.numero_identificacion || '0',
        rol: 'cliente'
      })
      const { token, usuario } = response.data
      
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(usuario))
      
      setUser(usuario)
      return { success: true }
    } catch (error) {
      return { success: false, error: parseApiError(error) }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const isAdmin = () => user?.rol === 'admin'
  const isComisionista = () => user?.rol === 'comisionista'

  const updateUser = (updatedData) => {
    const newUser = { ...user, ...updatedData }
    setUser(newUser)
    localStorage.setItem('user', JSON.stringify(newUser))
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, isAdmin, isComisionista, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}
