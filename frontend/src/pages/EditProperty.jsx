import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PublishProperty from './PublishProperty'

const EditProperty = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  // Solo admin puede editar
  if (!user || user.rol !== 'admin') {
    navigate('/')
    return null
  }

  return <PublishProperty editMode={true} propertyId={id} />
}

export default EditProperty
