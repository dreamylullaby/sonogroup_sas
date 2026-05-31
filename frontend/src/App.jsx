import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { PreferencesProvider } from './context/PreferencesContext'
import { ToastProvider } from './components/ui/Toast'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Properties from './pages/Properties'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import PropertyDetail from './pages/PropertyDetail'
import Favorites from './pages/Favorites'
import Contact from './pages/Contact'
import PublishProperty from './pages/PublishProperty'
import EditProperty from './pages/EditProperty'
import AdminDashboardNew from './pages/admin/AdminDashboard'
import Messages from './pages/Messages'
import MyProperties from './pages/MyProperties'
import Profile from './pages/Profile'
import AccountSettings from './pages/AccountSettings'
import HelpCenter from './pages/HelpCenter'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './components/admin/layout/AdminLayout'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <PreferencesProvider>
      <ToastProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Admin routes — use AdminLayout (no public Navbar/Footer) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboardNew />} />
            {/* Future admin sub-routes will be added here */}
          </Route>

          {/* Public / user routes — use public Navbar + Footer */}
          <Route
            path="*"
            element={
              <div className="app">
                <Navbar />
                <main className="main-content">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/propiedades" element={<Properties />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/registro" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/restablecer-password" element={<ResetPassword />} />
                    <Route path="/propiedad/:id" element={<PropertyDetail />} />
                    <Route path="/contacto" element={<Contact />} />
                    <Route
                      path="/favoritos"
                      element={
                        <ProtectedRoute>
                          <Favorites />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/mensajes"
                      element={
                        <ProtectedRoute>
                          <Messages />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/mis-propiedades"
                      element={
                        <ProtectedRoute>
                          <MyProperties />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/publicar"
                      element={
                        <ProtectedRoute>
                          <PublishProperty />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/perfil"
                      element={
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/configuracion"
                      element={
                        <ProtectedRoute>
                          <AccountSettings />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/ayuda" element={<HelpCenter />} />
                    <Route
                      path="/editar-propiedad/:id"
                      element={
                        <ProtectedRoute adminOnly={true}>
                          <EditProperty />
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </main>
                <Footer />
              </div>
            }
          />
        </Routes>
      </Router>
      </ToastProvider>
      </PreferencesProvider>
    </AuthProvider>
  )
}

export default App
