# Registro de cambios

Todos los cambios relevantes de la app se anotan aquí, empezando por los más recientes.
Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

Cada entrada indica si requiere ejecutar un script en Supabase (SQL Editor) antes de publicarla.

## [1.1.0] - 2026-11-04

### Añadido
- Indicador de consumo de agua en el Diario: meta diaria calculada como el mayor entre 1 ml por kcal objetivo y 35 ml por kg de peso, vaso con porcentaje, barra de progreso y vasos restantes.
- Botones rápidos «+ 1 vaso» y «+ Botella 500 ml», y botón «Registrar agua» para ingresar la cantidad en vasos, ml o litros (tamaño de vaso configurable).
- Lista de tomas del día con hora y opción para borrarlas.

### Base de datos
- Requiere `supabase/005_registro_agua.sql` (tabla `registro_agua` con RLS y permisos).

## [1.0.0] - 2026-11-03

### Añadido
- Inicio de sesión y registro con Supabase Auth.
- Perfil y calculadora: TMB con Katch-McArdle, Mifflin-St Jeor o Harris-Benedict revisada; nivel de actividad; objetivo con déficit o excedente; IMC, masa magra e índice de masa magra; macros en g/kg; estimación visual de grasa corporal.
- Diario por fecha con comidas editables, alimentos en gramos, totales, reparto energético y anillos de progreso; exportación a PDF.
- Catálogo de alimentos globales y propios.
- Menús reutilizables: guardar una comida como menú y cargarlo en cualquier día.
- Despliegue automático en GitHub Pages con cada push a `main`.

### Base de datos
- `supabase/002_perfil_metas.sql`: columnas extra del perfil, políticas con `WITH CHECK` e índices.
- `supabase/003_alimentos_globales.sql`: catálogo base de alimentos (opcional).
- `supabase/004_permisos.sql`: permisos de tabla para usuarios con sesión.
