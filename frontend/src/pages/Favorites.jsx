import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api, parseApiError } from '../config/api'
import PropertyCard from '../components/PropertyCard'
import './Favorites.css'

const Favorites = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    fetchFavorites()
  }, [user, navigate])

  const fetchFavorites = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/favoritos')
      setFavorites(response.data.favoritos || [])
      setError('')
    } catch (err) {
      setError(parseApiError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFavorite = async (id) => {
    try {
      await api.delete(`/api/favoritos/${id}`)
      setFavorites(favorites.filter(f => f.id_inmueble !== id))
    } catch (err) {
      setError(parseApiError(err))
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Cargando favoritos...</p>
      </div>
    )
  }

  return (
    <div className="favorites-page">
      <div className="favorites-header">
        <h1>Mis Favoritos</h1>
        <p>Propiedades que has guardado</p>
      </div>

      {error && <div className="error-message" role="alert">⚠️ {error}</div>}

      {favorites.length === 0 ? (
        <div className="empty-favorites">
          <h2>No tienes favoritos aún</h2>
          <p>Explora propiedades y guarda las que te gusten</p>
          <button onClick={() => navigate('/')} className="btn-primary">Ver Propiedades</button>
        </div>
      ) : (
        <div className="favorites-grid">
          {favorites.map(property => (
            <PropertyCard
              key={property.id_inmueble}
              property={property}
              onRemoveFavorite={handleRemoveFavorite}
              isFavorite={true}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default Favorites
