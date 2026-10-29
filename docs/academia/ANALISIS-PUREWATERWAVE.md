# Análisis del repositorio `pure-water-wave` (purewaterwave.org)

Fecha: 2026-10-27. Fuente: rama `main` del repo `miladr100/pure-water-wave`
(la rama `development` es una versión anterior, sólo con donaciones; no la
usamos como referencia).

## 1. Qué es

Un único proyecto Next.js que sirve dos cosas:

1. **El sitio público de donaciones** (`/`): una landing larga en portugués,
   con pagos por MercadoPago (Pix y tarjeta), newsletter, WhatsApp flotante,
   testimonios y galería.
2. **La "Biblioteca Água Pura"** (`/biblioteca/**`): un área privada para
   pastores y el equipo HJ, con libros en PDF (lector propio con búsqueda),
   materiales de apoyo, vídeos de YouTube, herramientas (HJ Journal, meditación
   HDH, manual de vídeos del Kit 1, índice del Principio Divino, Juramento de la
   Familia) y un chat de IA sobre los libros. Es una PWA instalable.

No existe un panel de administración: la única "admin" es un redirect de
`/painel` a `/biblioteca`. Los usuarios se crean con un formulario de registro
protegido por un secreto compartido (`verdadeirospais`) y los contenidos
(PDFs, vídeos, herramientas) están **en el código**, no en una base de datos.

## 2. Stack

| Capa | Elección | Notas |
|---|---|---|
| Framework | Next.js 16 (App Router, Turbopack), React 19, TypeScript strict | `src/app` para rutas, `src/components` para UI |
| Estilos | Tailwind 4 (`@theme inline` en `globals.css`), `tw-animate-css` | tokens de color en **oklch**, radios y sombras como variables |
| UI kit | shadcn/ui sobre Radix (`src/components/ui`, 43 primitivas), `lucide-react`, `sonner` para toasts, `cmdk`, `vaul`, `embla` | copia literal de shadcn; `cn()` = `clsx` + `tailwind-merge` |
| Datos | **MongoDB** con mongoose 8 | `src/lib/mongodb.ts` cachea la conexión en `global` (patrón serverless); modelos en `src/models` |
| Auth | Propia: JWT HS256 con `jose` en cookie httpOnly `pww_session` (7 días), bcryptjs (12 rounds) | `src/lib/auth.ts`, `src/middleware.ts` protege `/biblioteca`, `/painel` y `/api/biblioteca` |
| Email | Resend + `@react-email/components` | plantillas en `src/app/emails/*.tsx`, logo adjunto como `cid:` |
| Pagos | MercadoPago SDK | checkout, webhook, cron cada 15 min (`vercel.json`) para remarketing |
| PDF | react-pdf / pdfjs-dist | worker copiado a `public/` en `next.config.ts`; índices de búsqueda pregenerados en `content/search-index` |
| PWA | serwist (`src/app/sw.ts`, `manifest.ts`) | iconos generados por script |
| IA | OpenAI (`OPENAI_API_KEY`) | `/api/biblioteca/ask` |
| Deploy | Vercel | `vercel.json` sólo define el cron |

Variables de entorno usadas: `MONGODB_URI`, `AUTH_SECRET`, `RESEND_API_KEY`,
`MERCADOPAGO_ACCESS_TOKEN`, `NEXT_PUBLIC_APP_URL`, `CRON_SECRET`,
`OPENAI_API_KEY`, `OPENAI_MODEL`. No hay `.env.example` en el repo.

## 3. Cómo se organiza el código

```
src/
  app/                      rutas (App Router)
    page.tsx                landing (delega en components/home.tsx)
    layout.tsx              fuentes (Fraunces + Plus Jakarta Sans), metadata, PWA, theme-init script
    globals.css             tokens, tema claro/oscuro, utilidades y keyframes
    login/ cadastro/ esqueci-senha/   páginas de auth (server components)
    biblioteca/             área privada; layout.tsx envuelve en LocaleProvider
      page.tsx              dashboard de libros
      ler/[id]              lector PDF
      materiais/ videos/ ferramentas/...
    api/auth/*              login, logout, register, profile, language, change/forgot/reset password
    api/biblioteca/*        pdf, search, ask, feedback, hjournal, hdhreflection
    api/checkout, donations, webhooks/mercadopago, cron
    emails/*.tsx            plantillas react-email
  components/               un archivo por pantalla o pieza; "use client" cuando hace falta
    ui/                     shadcn
  lib/                      lógica sin React: auth, mongodb, password, emails, i18n, datos estáticos (JSON + TS)
  models/                   esquemas mongoose
  hooks/                    use-mobile, use-device-speech
content/                    PDFs e índices de búsqueda (no se sirven estáticos: pasan por /api/biblioteca/pdf)
scripts/                    generadores (previews, índices, iconos) en .mjs
```

### Patrones que se repiten (y que la academia copia)

- **Página = server component fino + componente cliente gordo.** La página hace
  `getSession()`, redirige si no hay sesión y renderiza `<XPage session={...}/>`.
  Toda la interactividad vive en `src/components/*.tsx` con `"use client"`.
- **Rutas API con la misma liturgia:** `try { if (!process.env.MONGODB_URI)
  return 503; validar body; await connectDB(); ... return NextResponse.json }
  catch { console.error(contexto, error); return 500 }`. Errores en portugués
  con un `code` opcional legible por máquina (`USER_NOT_FOUND`, `DATE_IN_USE`).
- **Sesión en el JWT, no en la base:** el payload lleva `userId, login,
  fullName, role, language`; cambiar nombre o idioma reemite el token.
  `requirePastorSession()` es el guard de las rutas privadas.
- **Modelos mongoose con `delete models.X` antes de `model()`** para
  sobrevivir al hot reload, `InferSchemaType` para el tipo, `select: false` en
  la contraseña, `timestamps: true`.
- **i18n por objeto tipado:** `src/lib/i18n/messages.ts` define `AppMessages`
  y tres objetos `pt`, `en`, `es` (pt es la referencia). `LocaleProvider`
  recibe el idioma de la sesión; los componentes usan `useLocale().t`. Las
  cadenas con variables son funciones (`subtitle: (firstName) => ...`).
- **Contenido estático en TS/JSON por idioma** (`library-pdfs.ts`,
  `support-materials.ts`, `video-support-manual-{pt,es}.json`) con fallback a
  pt cuando falta una traducción.
- **Tema oscuro sólo en el área logada** (`theme.ts`), guardado en
  localStorage y aplicado con un script `beforeInteractive` para evitar el
  parpadeo.
- **Validación en el servidor siempre**, aunque el formulario ya valide.
- Comentarios escasos, en portugués, sólo cuando explican un porqué.

## 4. Diseño (lo que hace que "parezca" Pure Water Wave)

### Identidad

- **Tipografía:** `Fraunces` (serif con eje óptico) para títulos, peso 500,
  `letter-spacing: -0.02em`; `Plus Jakarta Sans` para texto. Clase
  `font-display` en todos los h1-h4 y en cifras destacadas.
- **Color:** azul "Água Pura" como primario (`oklch(0.55 0.17 225)`), un
  azul profundo para títulos (`--primary-deep`, `oklch(0.32 0.12 240)`),
  fondos casi blancos con un tinte azul (`--background oklch(0.99 0.005 220)`),
  **coral** cálido (`oklch(0.68 0.18 30)`) para los CTA emocionales (donar) y
  **menta** para acentos ecológicos. Modo oscuro con el mismo tono azul
  (`.dark`).
- **Formas:** `--radius: 1rem`. Botones de acción `rounded-full`; tarjetas
  `rounded-3xl`/`rounded-2xl` con `border-border/60` y sombras suaves
  (`shadow-card`, `shadow-soft`, `shadow-glow` en hover) y un leve
  `-translate-y-0.5`.
- **Gradientes:** `bg-gradient-hero` (azul profundo → celeste), `bg-gradient-wave`
  (fondo de secciones), `bg-gradient-cta`, `bg-gradient-coral`.
- **Movimiento "agua":** Ken Burns en la foto del hero, burbujas que suben,
  dos capas de olas SVG que derivan, `animate-ripple` en el botón de WhatsApp,
  `animate-float`, marquee de países. Todo CSS puro, con posiciones
  precalculadas para que el SSR sea estable.
- **Logo:** `public/assets/pwlogo.png` (gota azul), siempre redondo (`BrandLogo`).

### Landing (`home.tsx`, 1.060 líneas)

Header transparente sobre el hero (logo + "Água Pura", nav, Login, "Doar
agora"). Hero a pantalla completa con titular serif grande en blanco e
itálica en la última línea, dos CTA (Pix coral, tarjeta outline) y una tarjeta
flotante de "donación sugerida". Luego: tres pilares de impacto (tarjetas con
icono en burbuja degradada y diálogo con carrusel), sección "Somos uma geração"
con el acrónimo P·U·R·E / Water / Wave y collage de fotos, cifras (+1.200,
+300, +150), presencia internacional (chips de países), testimonios, bloque de
donación con montos, newsletter, CTA final sobre azul profundo y footer.

### Área logada (biblioteca)

- `LibraryHeader`: barra blanca translúcida (`bg-card/80 backdrop-blur`), el
  **logo es el botón de ajustes** (abre un diálogo con nombre, contraseña,
  tema claro/oscuro e idioma), título serif + subtítulo "Bem-vindo(a), Nombre",
  botones outline de navegación (Materiais, Vídeos, Ferramentas), Feedback,
  Sair. En móvil un `Sheet` lateral.
- Páginas con `min-h-screen bg-gradient-to-b from-background via-secondary/30
  to-background`, contenedor `max-w-7xl px-6 py-10`, un h1 serif de 3xl/4xl
  en `text-primary-deep` y un párrafo `text-muted-foreground`, y una grilla de
  tarjetas (`sm:grid-cols-2 xl:grid-cols-3`).
- Tarjeta de vídeo: miniatura 16:9 con degradado azul de respaldo y botón de
  play blanco circular; título serif, subtítulo gris.
- Formularios de auth: tarjeta centrada `max-w-md`, marca serif arriba, campos
  shadcn, botón primario ancho `size="lg"`, enlaces en `text-primary`.

## 5. Lo que había que decidir para la academia

| Tema | Decisión | Por qué |
|---|---|---|
| ¿Base de datos? | **MongoDB, misma que el sitio** (colecciones `academy_*`) | El equipo ya la opera; Neon/Postgres les añadiría una pieza nueva. |
| ¿Admin dentro del sitio? | No existe; la academia trae **su propio panel en `/admin`** con el estilo de la biblioteca | Los educadores son los administradores; no hace falta un CMS aparte como Payload. |
| ¿Dónde vive? | **En este mismo repo**, como rutas nuevas (`/academia`, `/admin`) con sus propios modelos, API y componentes | Comparte base, auth, UI kit y deploy; las colisiones de nombre se resolvieron con prefijos (`academy_`, `/api/academia/auth`, `AcademyUser`). |
| ¿Vídeo? | YouTube por defecto (es lo que ya usan), **Bunny Stream opcional** con el mismo esquema de URLs firmadas de FFPUM | Sin cuentas nuevas la academia ya funciona; cuando quieran vídeos privados, cuatro variables de entorno. |
| ¿Auth? | La misma JWT propia, cookie distinta (`pww_academy_session`), roles `student`/`tutor` (en la interfaz, "educador(a)") | Convive con la biblioteca en el mismo dominio sin mezclar sesiones. |
| ¿Login? | **Uno solo para todo el sitio**, en `/login` (`/login` redirige allí). Pastores (biblioteca, rol pastor) → sólo la biblioteca; HJ Team (biblioteca, rol hjteam, o alumnos de la academia) → academia + biblioteca; educadores (academia, rol `tutor`) → panel + biblioteca | La biblioteca se abre desde el encabezado de la academia y del panel ("Biblioteca") y su logo vuelve a la academia o al panel. Al entrar en la academia también se emite la cookie de la biblioteca (`src/lib/academy/session-bridge.ts`), sin tocar sus roles. |
| ¿Alumnos? | Sin registro público: pastores, HJ Team y educadores los crea un educador en el panel (uno a uno o por CSV) | El sitio ya no tiene `/cadastro`; el secreto `verdadeirospais` desaparece. |
