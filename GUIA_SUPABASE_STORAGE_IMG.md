# Guía: Configurar Supabase Storage para Imágenes de Propiedades

## Contexto

Las fotografías de propiedades se almacenan en Supabase Storage (S3 compatible). 
La tabla `fotografias` en BD guarda la URL pública de cada imagen.

---

## Paso 1: Crear el bucket en Supabase

1. Ir a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Seleccionar tu proyecto (sonogroup)
3. Menú lateral → **Storage**
4. Clic en **"New bucket"**
5. Configurar:
   - Nombre: `propiedades`
   - Public bucket: **SÍ** (activar toggle) — las imágenes son públicas
   - File size limit: `5MB` (suficiente para fotos de propiedades)
   - Allowed MIME types: `image/jpeg, image/png, image/webp`
6. Clic en **"Create bucket"**

---

## Paso 2: Configurar políticas de acceso (RLS)

Como es un bucket público, las lecturas son libres. Pero la subida debe estar restringida.

1. En Storage → seleccionar bucket `propiedades`
2. Ir a la pestaña **"Policies"**
3. Crear las siguientes políticas:

### Política 1: Lectura pública (SELECT)
- Name: `Lectura pública de imágenes`
- Allowed operation: **SELECT**
- Target roles: `public`
- Policy: `true` (sin restricción)

```sql
CREATE POLICY "Lectura pública de imágenes"
ON storage.objects FOR SELECT
USING (bucket_id = 'propiedades');
```

### Política 2: Subida autenticada (INSERT)
- Name: `Usuarios autenticados pueden subir`
- Allowed operation: **INSERT**
- Target roles: `authenticated`
- Policy: `bucket_id = 'propiedades'`

```sql
CREATE POLICY "Usuarios autenticados pueden subir"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'propiedades'
  AND auth.role() = 'authenticated'
);
```

### Política 3: Eliminación por propietario o admin (DELETE)
- Name: `Propietario o admin puede eliminar`
- Allowed operation: **DELETE**

```sql
CREATE POLICY "Propietario o admin puede eliminar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'propiedades'
  AND auth.role() = 'authenticated'
);
```

**Nota:** Si usas el Supabase client desde tu backend (service_role key), las políticas RLS no aplican — el backend tiene acceso completo. Las políticas son relevantes solo si el frontend sube directamente.

---

## Paso 3: Estructura de carpetas en el bucket

Organizar las imágenes por ID de inmueble:

```
propiedades/
├── 1/
│   ├── portada.jpg
│   ├── foto_1.jpg
│   └── foto_2.jpg
├── 2/
│   ├── portada.jpg
│   └── foto_1.jpg
└── 15/
    ├── portada.jpg
    ├── foto_1.jpg
    ├── foto_2.jpg
    └── foto_3.jpg
```

---

## Paso 4: Obtener la URL del bucket

La URL pública de cualquier imagen sigue este patrón:

```
https://<project-ref>.supabase.co/storage/v1/object/public/propiedades/<id_inmueble>/<filename>
```

Ejemplo:
```
https://abcdefgh.supabase.co/storage/v1/object/public/propiedades/15/portada.jpg
```

Tu `project-ref` lo encuentras en:
- Dashboard → Settings → General → Reference ID

---

## Paso 5: Implementar la subida desde el backend

En tu backend (Node.js + Supabase client):

```javascript
import { supabase } from '../config/supabase.js'

async function subirImagen(idInmueble, archivo, nombreArchivo) {
  const path = `${idInmueble}/${nombreArchivo}`
  
  const { data, error } = await supabase.storage
    .from('propiedades')
    .upload(path, archivo, {
      contentType: archivo.type || 'image/jpeg',
      upsert: true // sobreescribir si existe
    })

  if (error) throw error

  // Obtener URL pública
  const { data: urlData } = supabase.storage
    .from('propiedades')
    .getPublicUrl(path)

  return urlData.publicUrl
}
```

---

## Paso 6: Guardar la URL en la tabla `fotografias`

Una vez subida la imagen, insertar el registro en BD:

```javascript
async function registrarFotografia(idInmueble, urlFoto, esPortada = false, orden = 1) {
  const { data, error } = await supabase
    .from('fotografias')
    .insert([{
      id_inmueble: idInmueble,
      url_foto: urlFoto,
      es_portada: esPortada,
      orden: orden,
      tipo_media: 'foto'
    }])
    .select()
    .single()

  if (error) throw error
  return data
}
```

---

## Paso 7: Endpoint de subida (ejemplo completo)

Crear un endpoint que reciba las imágenes via multipart/form-data:

```javascript
// backend/src/modules/fotografias/upload.routes.js
import express from 'express'
import multer from 'multer'
import { supabase } from '../../config/supabase.js'
import { verificarToken } from '../../middleware/auth.js'

const router = express.Router()
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Solo se permiten imágenes'), false)
  }
})

// POST /api/fotografias/upload/:id_inmueble
router.post('/upload/:id_inmueble', verificarToken, upload.array('fotos', 10), async (req, res) => {
  try {
    const { id_inmueble } = req.params
    const archivos = req.files

    if (!archivos || archivos.length === 0) {
      return res.status(400).json({ error: 'No se enviaron imágenes' })
    }

    // Verificar que el usuario es dueño o admin
    const { data: inmueble } = await supabase
      .from('inmuebles')
      .select('id_usuario')
      .eq('id_inmueble', id_inmueble)
      .single()

    if (!inmueble) return res.status(404).json({ error: 'Inmueble no encontrado' })
    if (inmueble.id_usuario !== req.usuario.id_usuario && req.usuario.rol !== 'admin') {
      return res.status(403).json({ error: 'No tienes permisos' })
    }

    // Contar fotos existentes para el orden
    const { data: existentes } = await supabase
      .from('fotografias')
      .select('id_foto')
      .eq('id_inmueble', id_inmueble)

    let orden = (existentes?.length || 0) + 1
    const resultados = []

    for (const archivo of archivos) {
      const extension = archivo.originalname.split('.').pop()
      const nombreArchivo = `foto_${Date.now()}_${orden}.${extension}`
      const path = `${id_inmueble}/${nombreArchivo}`

      // Subir a Storage
      const { error: uploadError } = await supabase.storage
        .from('propiedades')
        .upload(path, archivo.buffer, {
          contentType: archivo.mimetype,
          upsert: false
        })

      if (uploadError) {
        console.error('Error upload:', uploadError)
        continue
      }

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('propiedades')
        .getPublicUrl(path)

      // Registrar en BD
      const esPortada = orden === 1 && (!existentes || existentes.length === 0)
      const { data: foto, error: dbError } = await supabase
        .from('fotografias')
        .insert([{
          id_inmueble: parseInt(id_inmueble),
          url_foto: urlData.publicUrl,
          es_portada: esPortada,
          orden: orden,
          tipo_media: 'foto'
        }])
        .select()
        .single()

      if (!dbError) resultados.push(foto)
      orden++
    }

    res.status(201).json({
      mensaje: `${resultados.length} imagen(es) subida(s)`,
      fotografias: resultados
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
```

---

## Paso 8: Instalar multer en el backend

```bash
cd backend
npm install multer
```

---

## Paso 9: Registrar la ruta en server.js

```javascript
import uploadRoutes from './modules/fotografias/upload.routes.js'

// Agregar junto a las demás rutas
app.use('/api/fotografias', uploadRoutes)
```

---

## Paso 10: Probar la subida (con Postman o curl)

```bash
curl -X POST http://localhost:3001/api/fotografias/upload/7 \
  -H "Authorization: Bearer <tu_token_jwt>" \
  -F "fotos=@/ruta/a/foto1.jpg" \
  -F "fotos=@/ruta/a/foto2.jpg"
```

Respuesta esperada:
```json
{
  "mensaje": "2 imagen(es) subida(s)",
  "fotografias": [
    { "id_foto": 1, "url_foto": "https://...supabase.co/.../foto_1.jpg", "es_portada": true },
    { "id_foto": 2, "url_foto": "https://...supabase.co/.../foto_2.jpg", "es_portada": false }
  ]
}
```

---

## Paso 11: Eliminar imágenes

```javascript
// DELETE /api/fotografias/:id_foto
router.delete('/:id_foto', verificarToken, async (req, res) => {
  const { id_foto } = req.params

  // Obtener la foto para saber el path
  const { data: foto } = await supabase
    .from('fotografias')
    .select('*')
    .eq('id_foto', id_foto)
    .single()

  if (!foto) return res.status(404).json({ error: 'Foto no encontrada' })

  // Extraer path del URL
  const url = new URL(foto.url_foto)
  const path = url.pathname.split('/storage/v1/object/public/propiedades/')[1]

  if (path) {
    await supabase.storage.from('propiedades').remove([path])
  }

  await supabase.from('fotografias').delete().eq('id_foto', id_foto)

  res.json({ mensaje: 'Foto eliminada' })
})
```

---

## Resumen

| Paso | Qué se hace | Dónde |
|------|------------|-------|
| 1 | Crear bucket `propiedades` | Supabase Dashboard |
| 2 | Políticas de acceso | Supabase Dashboard |
| 3-4 | Entender estructura y URLs | Referencia |
| 5-7 | Código de subida | Backend Node.js |
| 8 | Instalar multer | Terminal |
| 9 | Registrar ruta | server.js |
| 10 | Probar | Postman/curl |
| 11 | Eliminar fotos | Backend Node.js |

---

## Notas

- El bucket debe ser **público** porque las fotos se muestran en el sitio a cualquier visitante.
- El límite de 5MB por archivo es suficiente para fotos de propiedades optimizadas.
- Se permiten máximo 10 fotos por request (ajustable en `upload.array('fotos', 10)`).
- La primera foto subida a un inmueble sin fotos se marca automáticamente como portada.
- Para cambiar la portada: actualizar `es_portada` en la tabla `fotografias`.
