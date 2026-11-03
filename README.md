# Dieta · Calculadora de macros y registro nutricional

SPA en React + Vite con Supabase (Auth + PostgreSQL con RLS), pensada para desplegarse gratis en GitHub Pages.

## Funciones

- **Perfil / calculadora**: TMB con Katch-McArdle (masa magra), Mifflin-St Jeor (la fórmula de la tabla "Harris y Benedict") o Harris-Benedict revisada; factor de actividad (1,2 · 1,375 · 1,55 · 1,725 · 1,9); objetivo con déficit o excedente en %; IMC, masa magra e índice de masa magra; macros en g/kg (sobre masa magra si se conoce el % de grasa) y carbohidratos como resto de calorías. Incluye estimación visual del % de grasa.
- **Diario**: navegación por fechas, comidas con nombre editable, alimentos en gramos, totales y reparto energético por comida, anillos de progreso contra las metas y exportación a PDF (imprimir).
- **Alimentos**: catálogo global (`user_id` NULL) + alimentos propios (crear, editar, borrar). Los macros se guardan para la "Cantidad" (`total_weight`) indicada.
- **Menús**: plantillas (`menus` / `detalle_menu`) que se crean desde una comida o a mano y se cargan en cualquier día.
