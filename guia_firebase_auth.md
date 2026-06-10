# Guía: Configurar Firebase para Recuperación de Contraseña e Inicio con Google

## Paso 1: Crear proyecto en Firebase

1. Ir a [https://console.firebase.google.com](https://console.firebase.google.com)
2. Clic en "Agregar proyecto"
3. Nombre: `sonogroup-inmobiliaria`
4. Desactivar Google Analytics (no es necesario para auth)
5. Clic en "Crear proyecto"

---

## Paso 2: Registrar la app web

1. En la pantalla principal del proyecto, clic en el ícono de web `</>`
2. Nombre de la app: `sonogroup-web`
3. NO marcar Firebase Hosting
4. Clic en "Registrar app"
5. Firebase te mostrará un bloque de configuración como este:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "sonogroup-inmobiliaria.firebaseapp.com",
  projectId: "sonogroup-inmobiliaria",
  storageBucket: "sonogroup-inmobiliaria.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

6. **Copia estos datos** — los necesitarás en el paso 5

---

## Paso 3: Habilitar métodos de autenticación

1. En el menú lateral de Firebase, ir a **Build → Authentication**
2. Clic en **"Comenzar"** (si es la primera vez)
3. Ir a la pestaña **"Sign-in method"**

### Habilitar Email/Password (para recuperación de contraseña):
4. Clic en **"Correo electrónico/Contraseña"**
5. Activar el primer toggle "Correo electrónico/Contraseña"
6. **NO** activar "Enlace de correo electrónico (inicio de sesión sin contraseña)"
7. Guardar

### Habilitar Google:
8. Clic en **"Google"**
9. Activar el toggle
10. Seleccionar un "Correo electrónico de asistencia del proyecto" (tu correo)
11. Guardar

---

## Paso 4: Configurar dominio autorizado

1. Seguir en **Authentication → Settings → Authorized domains**
2. Verificar que `localhost` esté en la lista (para desarrollo)
3. Cuando tengas dominio de producción, agregarlo aquí (ej: `sonogroup.com`)

---

## Paso 5: Instalar Firebase en el frontend

Ejecutar en la carpeta `frontend/`:

```bash
npm install firebase
```

---

## Paso 6: Crear archivo de configuración Firebase

Crear `frontend/src/config/firebase.js`:

```javascript
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
```

---

## Paso 7: Agregar variables de entorno

Agregar al archivo `frontend/.env` (crear si no existe):

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=sonogroup-inmobiliaria.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=sonogroup-inmobiliaria
VITE_FIREBASE_STORAGE_BUCKET=sonogroup-inmobiliaria.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

**Reemplazar con los valores reales del paso 2.**

---

## Paso 8: Personalizar el email de recuperación (opcional pero recomendado)

1. En Firebase Console → Authentication → Templates
2. Clic en **"Restablecimiento de contraseña"**
3. Personalizar:
   - Asunto: `Recupera tu contraseña — SONOGROUP S.A.S`
   - Remitente: Cambiar el nombre a `SONOGROUP S.A.S`
   - Cuerpo: Personalizar el texto si quieres
4. Cambiar idioma a **Español** en la configuración de templates

---

## Paso 9: Configurar la URL de acción (Action URL)

1. En Authentication → Templates → Restablecimiento de contraseña
2. Clic en el ícono de editar (lápiz)
3. En "URL de acción personalizada", poner:
   - Desarrollo: `http://localhost:5173/reset-password`
   - Producción: `https://tudominio.com/reset-password`

Esto determina a dónde llega el usuario cuando hace clic en el enlace del email.

---

## Resumen de lo que ya está listo para implementar

Con esta configuración completada, en el código tendrás disponible:

### Para recuperación de contraseña:
```javascript
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../config/firebase'

// Enviar email de recuperación
await sendPasswordResetEmail(auth, email)
```

### Para inicio de sesión con Google:
```javascript
import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '../config/firebase'

// Login con Google popup
const result = await signInWithPopup(auth, googleProvider)
const user = result.user
// user.email, user.displayName, user.photoURL disponibles
```

---

## Notas importantes

- Firebase Auth es solo para autenticación del lado del cliente. Tu backend sigue manejando JWT y la BD de usuarios en Supabase.
- El flujo será: Firebase autentica → frontend recibe token → frontend llama a tu backend con los datos del usuario → backend crea/verifica en BD → backend devuelve tu JWT propio.
- La recuperación de contraseña con Firebase solo funciona si el usuario se registró con email/password en Firebase. Si tu sistema actual guarda passwords en Supabase con bcrypt, necesitarás decidir si migras la autenticación completa a Firebase o solo usas Firebase para Google y mantienes el reset propio.

---

## Decisión pendiente

Antes de implementar, define cuál de estas opciones prefieres:

**Opción A — Firebase solo para Google:**
- Mantener tu sistema actual de login con email/password (bcrypt + JWT en backend)
- Mantener tu endpoint actual de reset password (`/api/auth/password-reset`)
- Usar Firebase SOLO para el botón "Iniciar con Google"
- Menos cambios, menos riesgo

**Opción B — Firebase para todo auth:**
- Migrar autenticación completa a Firebase (login, registro, reset)
- Tu backend solo verifica Firebase ID tokens en vez de manejar passwords
- Más trabajo inicial, pero simplificas el backend (no más bcrypt, no más tokens de reset)
- Todos los emails de verificación/reset los maneja Firebase automáticamente

Recomendación: **Opción A** para producción rápida. Agregas Google sign-in sin romper nada existente.
