# Dieta · Calculadora de macros y registro nutricional

SPA en React + Vite con Supabase (Auth + PostgreSQL con RLS), pensada para desplegarse gratis en GitHub Pages.

## Funciones

- **Perfil / calculadora**: TMB con Katch-McArdle (masa magra), Mifflin-St Jeor (la fórmula de la tabla "Harris y Benedict") o Harris-Benedict revisada; factor de actividad (1,2 · 1,375 · 1,55 · 1,725 · 1,9); objetivo con déficit o excedente en %; IMC, masa magra e índice de masa magra; macros en g/kg (sobre masa magra si se conoce el % de grasa) y carbohidratos como resto de calorías. Incluye estimación visual del % de grasa.
- **Diario**: navegación por fechas, comidas con nombre editable, alimentos en gramos, totales y reparto energético por comida, anillos de progreso contra las metas y exportación a PDF (imprimir).
- **Alimentos**: catálogo global (`user_id` NULL) + alimentos propios (crear, editar, borrar). Los macros se guardan para la "Cantidad" (`total_weight`) indicada.
- **Menús**: plantillas (`menus` / `detalle_menu`) que se crean desde una comida o a mano y se cargan en cualquier día.

## Puesta en marcha

1. En Supabase > SQL Editor ejecuta, en orden:
   - el esquema inicial (ya hecho),
   - `supabase/002_perfil_metas.sql` (columnas extra del perfil, `WITH CHECK` en las políticas e índices),
   - `supabase/003_alimentos_globales.sql` (catálogo base opcional, por 100 g).
2. `.env.local` con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (Project Settings > API).
3. `npm install` y `npm run dev`.

## Despliegue en GitHub Pages

1. Sube el proyecto a un repositorio de GitHub (rama `main`).
2. En el repo: Settings > Secrets and variables > Actions, crea `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
3. Settings > Pages > Source: **GitHub Actions**. Cada push a `main` ejecuta `.github/workflows/deploy.yml`.
4. En Supabase > Authentication > URL Configuration añade la URL de Pages (`https://<usuario>.github.io/<repo>/`) como Site URL / Redirect URL para que funcione el correo de confirmación.
5. Para limitar el acceso al grupo de prueba, crea las cuentas y luego desactiva los registros públicos en Authentication > Sign In / Providers.

La clave `anon` viaja en el bundle por diseño; la privacidad la garantiza RLS.
