import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import PublishProperty from '../properties/PublishProperty'

const EditProperty = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  if (!user) {
    navigate('/')
    return null
  }

  // Admin edita directamente, usuario edita en modo revisión
  const modoRevision = user.rol !== 'admin'

  return <PublishProperty editMode={true} propertyId={id} modoRevision={modoRevision} />
}

export default EditProperty
