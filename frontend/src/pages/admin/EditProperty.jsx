import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import PublishProperty from '../properties/PublishProperty'

const EditProperty = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  // Admin puede editar cualquier propiedad
  // Usuarios dueños pueden editar si tienen solicitud aprobada (verificado en backend)
  if (!user) {
    navigate('/')
    return null
  }

  return <PublishProperty editMode={true} propertyId={id} />
}

export default EditProperty
