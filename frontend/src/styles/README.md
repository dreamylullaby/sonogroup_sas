# Convención de estilos

Todos los archivos CSS viven en `src/styles/`. Ningún archivo `.css` debe colocarse junto a un `.jsx`.

## Estructura

```
styles/
├── global/          ← Estilos base (variables, resets, layout)
│   ├── index.css
│   └── App.css
├── components/      ← Estilos de componentes reutilizables
│   ├── Navbar.css
│   ├── Footer.css
│   ├── PropertyCard.css
│   ├── PropertyFilters.css
│   ├── UserModal.css
│   └── Toast.css
├── pages/           ← Estilos específicos de cada página
│   ├── Home.css
│   ├── Login.css
│   ├── ...
│   └── admin/
│       └── AdminDashboard.css
└── utils/           ← Variables compartidas, mixins (si aplica)
```

## Cómo importar

Desde un componente o página, usar path relativo a `styles/`:

```jsx
// Componente en components/layout/Navbar.jsx
import '../../styles/components/Navbar.css'

// Página en pages/public/Home.jsx
import '../../styles/pages/Home.css'

// App.jsx (raíz de src/)
import './styles/global/App.css'
```
