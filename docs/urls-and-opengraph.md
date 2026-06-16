# URLs y OpenGraph

## URL canónica (`VITE_APP_URL`)

Todos los lugares que necesitan la URL de la app (OG tags, share text, workbox cache) leen de una sola fuente: `VITE_APP_URL`.

### Resolución automática en `vite.config.ts`

`vite.config.ts` calcula `appUrl` con la siguiente prioridad:

| Prioridad | Fuente | Cuándo aplica |
|---|---|---|
| 1 | `VITE_APP_URL` | Override explícito — setear en Vercel dashboard, **no** en `.env.production` |
| 2 | `VERCEL_PROJECT_PRODUCTION_URL` | Solo en `VERCEL_ENV === 'production'` — alias estable del proyecto |
| 3 | `VERCEL_URL` | Preview deploys y production deploys cuando no hay alias configurado |
| 4 | `http://localhost:5173` | Fallback local |

**Por qué NO poner `VITE_APP_URL` en `.env.production`:**

`VERCEL_PROJECT_PRODUCTION_URL` está disponible en **todos** los environments de Vercel (producción Y preview). Si pones `VITE_APP_URL` en `.env.production`, ese archivo se incluye en el build y pisa el `VERCEL_URL` del preview deploy — todos los previews reportan la URL de producción en el share text. La variable se leyó como `grafle.vercel.app` aunque el preview era `grafle-git-feature-opengraph-...vercel.app`.

La solución: `VERCEL_PROJECT_PRODUCTION_URL` solo se usa cuando `VERCEL_ENV === 'production'`. Para previews siempre cae a `VERCEL_URL`.

**Variables que inyecta Vercel en cada build:**

- `VERCEL_URL` — hostname del deployment actual. Único por deploy, nunca es un alias.
- `VERCEL_PROJECT_PRODUCTION_URL` — alias estable del proyecto. Disponible en todos los envs.
- `VERCEL_ENV` — `production`, `preview`, o `development`.

No necesitan prefijo `VITE_` porque se leen en `vite.config.ts` (Node.js), no en el cliente.

**Para cambiar el dominio (cuando salga el dominio final):**

Setear `VITE_APP_URL` en Vercel dashboard → Settings → Environment Variables, scoped a **Production only**:
```
VITE_APP_URL = https://grafle.com
```

Los preview deploys seguirán usando su `VERCEL_URL` automáticamente.

### Cómo llega al código

- **`index.html`** — el plugin `html-env-inject` en `vite.config.ts` reemplaza `%VITE_APP_URL%` en el HTML en build/serve time.
- **`src/lib/sharing.ts`** — usa `import.meta.env.VITE_APP_URL` (inyectado vía `define` en `vite.config.ts`).
- **`src/vite-env.d.ts`** — declara el tipo para TypeScript.

---

## OpenGraph y Twitter Cards

Los meta tags están en `index.html` y usan `%VITE_APP_URL%`:

```html
<!-- OpenGraph -->
<meta property="og:type"        content="website" />
<meta property="og:site_name"   content="Grafle" />
<meta property="og:title"       content="Grafle — Daily Graph Puzzle" />
<meta property="og:description" content="Connect every edge. Or prove it can't be done." />
<meta property="og:url"         content="%VITE_APP_URL%" />
<meta property="og:image"       content="%VITE_APP_URL%/og-image.png" />

<!-- Twitter / X Card -->
<meta name="twitter:card"       content="summary_large_image" />
<meta name="twitter:image"      content="%VITE_APP_URL%/og-image.png" />
```

### OG Image (`public/og-image.svg` → `og-image.png`)

La imagen actual es un SVG placeholder en `public/og-image.svg` (1200×630). **La mayoría de plataformas sociales (Facebook, Twitter/X, WhatsApp, iMessage) no soportan SVG como OG image — requieren PNG o JPEG.**

**Para generar la versión PNG:**

```bash
# Con Inkscape (CLI):
inkscape public/og-image.svg --export-filename=public/og-image.png --export-width=1200

# Con sharp (Node.js):
npx sharp -i public/og-image.svg -o public/og-image.png resize 1200 630
```

Hasta que exista `og-image.png`, el og:image tag apuntará a un 404. El SVG fuente sirve como referencia de diseño.

---

## Auditoría de links (estado actual)

| Archivo | URL | Estado |
|---|---|---|
| `index.html` | `%VITE_APP_URL%` en OG tags | ✅ Dinámico |
| `src/lib/sharing.ts` | `import.meta.env.VITE_APP_URL` | ✅ Dinámico |
| `vite.config.ts` | workbox urlPattern desde `appUrl` | ✅ Dinámico |
| `src/components/modals/MenuDrawer.tsx` | `https://grafle.com/blog`, `/donate` | ⚠️ Hardcoded — páginas futuras, no existen aún |

Los links de MenuDrawer (`/blog`, `/donate`) apuntan al dominio final `grafle.com` porque son páginas de contenido que vivirán ahí independientemente del deploy actual. Cuando esas páginas existan, no necesitarán cambio de código.
