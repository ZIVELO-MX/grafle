# Feature Flags

Las feature flags de Grafle se controlan con variables de entorno Vite (`VITE_*`).
No se requiere ninguna librería extra — Vite lee los archivos `.env` de forma nativa.

## Flags disponibles

| Variable | Descripción | Dev default | Prod default |
|---|---|---|---|
| `VITE_ALLOW_FUTURE_PUZZLES` | Permite navegar a puzzles más allá de la fecha de hoy | `true` | `false` |
| `VITE_SKIP_START_SCREEN` | Salta la pantalla de inicio y entra directo al puzzle | `true` | `false` |

## Cómo funciona (manera general)

Vite carga los archivos `.env` en el siguiente orden de prioridad (mayor a menor):

```
.env.[mode].local   ← máxima prioridad, gitignoreado (sobreride personal)
.env.local          ← gitignoreado (override personal)
.env.[mode]         ← por ambiente, committeado al repo
.env                ← base, committeado al repo
```

`[mode]` es `development` cuando corres `vite dev` y `production` cuando corres `vite build`.

### Archivos en el repo

- **`.env.development`** — defaults para desarrollo (ambas flags en `true`)
- **`.env.production`** — defaults para producción (ambas flags en `false`)
- **`.env.example`** — plantilla de referencia con todas las variables disponibles

### Override personal (sin afectar al repo)

Si quieres un valor diferente al default de tu ambiente sin committearlo, crea `.env.local` (ya está en `.gitignore`):

```bash
# .env.local — sobreescribe cualquier .env.[mode], solo en tu máquina
VITE_ALLOW_FUTURE_PUZZLES=false
VITE_SKIP_START_SCREEN=false
```

O para un ambiente específico:

```bash
# .env.development.local — solo aplica en dev, gitignoreado
VITE_SKIP_START_SCREEN=false
```

## Dónde se leen en el código

### `VITE_ALLOW_FUTURE_PUZZLES`

`src/lib/puzzleProvider.ts` — controla hasta qué número de puzzle puede navegar el usuario:

```ts
const ALLOW_FUTURE_PUZZLES = import.meta.env.VITE_ALLOW_FUTURE_PUZZLES === 'true'
```

### `VITE_SKIP_START_SCREEN`

`src/App.tsx` — si es `true`, el juego arranca automáticamente sin mostrar la pantalla de inicio:

```ts
const SKIP_START = import.meta.env.VITE_SKIP_START_SCREEN === 'true'
```
