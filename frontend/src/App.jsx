import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { PreferencesProvider } from './context/PreferencesContext'
import { ToastProvider } from './components/ui/Toast'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import Home from './pages/public/Home'
import Properties from './pages/properties/Properties'
import Login from './pages/public/Login'
import Register from './pages/public/Register'
import ForgotPassword from './pages/public/ForgotPassword'
import ResetPassword from './pages/public/ResetPassword'
import PropertyDetail from './pages/properties/PropertyDetail'
import Favorites from './pages/user/Favorites'
import Contact from './pages/public/Contact'
import PublishProperty from './pages/properties/PublishProperty'
import EditProperty from './pages/admin/EditProperty'
import Messages from './pages/user/Messages'
import MyProperties from './pages/user/MyProperties'
import Profile from './pages/user/Profile'
import AccountSettings from './pages/user/AccountSettings'
import HelpCenter from './pages/public/HelpCenter'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './components/admin/layout/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminPropiedades from './pages/admin/AdminPropiedades'
import AdminSolicitudes from './pages/admin/AdminSolicitudes'
import AdminUsuarios from './pages/admin/AdminUsuarios'
import AdminContactos from './pages/admin/AdminContactos'
import AdminNotificaciones from './pages/admin/AdminNotificaciones'
import AdminReportes from './pages/admin/AdminReportes'
import AdminActividad from './pages/admin/AdminActividad'
import './styles/global/App.css'

function App() {
  return (
    <AuthProvider>
      <PreferencesProvider>
      <ToastProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Admin routes — AdminLayout provides sidebar + topbar + Outlet */}
          <Route path="/admin" element={<ProtectedRoute adminOnly={true}><AdminLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="propiedades" element={<AdminPropiedades />} />
            <Route path="solicitudes" element={<AdminSolicitudes />} />
            <Route path="usuarios" element={<AdminUsuarios />} />
            <Route path="contactos" element={<AdminContactos />} />
            <Route path="notificaciones" element={<AdminNotificaciones />} />
            <Route path="reportes" element={<AdminReportes />} />
            <Route path="actividad" element={<AdminActividad />} />
          </Route>

          {/* Public / user routes — Navbar + Footer */}
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
                    <Route path="/favoritos" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
                    <Route path="/mensajes" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                    <Route path="/mis-propiedades" element={<ProtectedRoute><MyProperties /></ProtectedRoute>} />
                    <Route path="/publicar" element={<ProtectedRoute><PublishProperty /></ProtectedRoute>} />
                    <Route path="/perfil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/configuracion" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
                    <Route path="/ayuda" element={<HelpCenter />} />
                    <Route path="/editar-propiedad/:id" element={<ProtectedRoute><EditProperty /></ProtectedRoute>} />
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
