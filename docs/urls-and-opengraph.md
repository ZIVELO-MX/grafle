# URLs y OpenGraph

## URL canónica (`VITE_APP_URL`)

Todos los lugares que necesitan la URL de la app (OG tags, share text, workbox cache) leen de una sola fuente: `VITE_APP_URL`.

### Resolución automática en `vite.config.ts`

`vite.config.ts` calcula `appUrl` con la siguiente prioridad:

| Prioridad | Fuente | Cuándo aplica |
|---|---|---|
| 1 | `VITE_APP_URL` en archivos `.env` | Valor explícito — máxima prioridad |
| 2 | `VERCEL_PROJECT_PRODUCTION_URL` | Injected por Vercel — alias estable de producción |
| 3 | `VERCEL_URL` | Injected por Vercel — URL única por deployment (preview builds) |
| 4 | `http://localhost:5173` | Fallback local cuando ninguno está disponible |

**¿Cómo lo usa Vercel?**

Vercel inyecta automáticamente estas variables de entorno en cada build:

- `VERCEL_URL` — hostname del deployment actual (ej. `grafle-abc123.vercel.app`). Cambia con cada deploy.
- `VERCEL_PROJECT_PRODUCTION_URL` — alias de producción del proyecto (ej. `grafle.vercel.app`). Estable.
- `VERCEL_ENV` — `production`, `preview`, o `development`.

No necesitan el prefijo `VITE_` porque se leen en `vite.config.ts` (Node.js), no en el cliente.

**Para cambiar el dominio (cuando salga el dominio final):**

Opción A — cambiar `.env.production` y committearlo:
```
VITE_APP_URL=https://grafle.com
```

Opción B — setear `VITE_APP_URL` en el dashboard de Vercel (Settings → Environment Variables). Toma precedencia sobre `.env.production`.

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
