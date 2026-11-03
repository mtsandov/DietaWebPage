-- Catálogo global inicial (user_id NULL = visible para todos).
-- Valores aproximados por 100 g (referencia USDA). Ejecutar en SQL Editor;
-- se puede repetir sin duplicar.
INSERT INTO alimentos (user_id, name, total_weight, protein, carb, fat, calories, comments)
SELECT NULL, v.name, 100, v.protein, v.carb, v.fat, v.calories, 'Catálogo base (por 100 g)'
FROM (VALUES
  ('Pechuga de pollo cruda',        22.5,  0.0,   2.6, 120),
  ('Huevo entero',                  12.6,  0.7,   9.5, 143),
  ('Clara de huevo',                10.9,  0.7,   0.2,  52),
  ('Carne molida 90/10 cruda',      20.0,  0.0,  10.0, 176),
  ('Lomo de cerdo crudo',           21.0,  0.0,   5.9, 143),
  ('Salmón crudo',                  20.4,  0.0,  13.4, 208),
  ('Atún en agua (lata)',           25.5,  0.0,   0.8, 116),
  ('Arroz blanco crudo',             7.1, 80.0,   0.7, 365),
  ('Arroz blanco cocido',            2.7, 28.2,   0.3, 130),
  ('Avena en hojuelas',             13.2, 67.7,   6.5, 379),
  ('Pasta seca',                    13.0, 74.7,   1.5, 371),
  ('Pan integral',                  12.4, 42.7,   3.5, 252),
  ('Tortilla de maíz',               5.7, 44.6,   2.9, 218),
  ('Quinoa cocida',                  4.4, 21.3,   1.9, 120),
  ('Papa cruda',                     2.0, 17.5,   0.1,  77),
  ('Camote / batata cruda',          1.6, 20.1,   0.1,  86),
  ('Lentejas cocidas',               9.0, 20.1,   0.4, 116),
  ('Frijoles negros cocidos',        8.9, 23.7,   0.5, 132),
  ('Garbanzos cocidos',              8.9, 27.4,   2.6, 164),
  ('Plátano / banana',               1.1, 22.8,   0.3,  89),
  ('Manzana',                        0.3, 13.8,   0.2,  52),
  ('Fresas',                         0.7,  7.7,   0.3,  32),
  ('Leche entera',                   3.2,  4.8,   3.3,  61),
  ('Leche descremada',               3.4,  5.0,   0.1,  34),
  ('Yogur griego natural',           9.0,  4.0,   5.0,  97),
  ('Queso cottage',                 11.1,  3.4,   4.3,  98),
  ('Proteína whey (polvo)',         80.0,  8.0,   6.0, 400),
  ('Almendras',                     21.2, 21.6,  49.9, 579),
  ('Maní / cacahuate',              25.8, 16.1,  49.2, 567),
  ('Mantequilla de maní',           25.0, 20.0,  50.0, 588),
  ('Aguacate',                       2.0,  8.5,  14.7, 160),
  ('Aceite de oliva',                0.0,  0.0, 100.0, 884),
  ('Miel',                           0.3, 82.4,   0.0, 304),
  ('Brócoli',                        2.8,  6.6,   0.4,  34),
  ('Espinaca',                       2.9,  3.6,   0.4,  23),
  ('Tomate',                         0.9,  3.9,   0.2,  18)
) AS v(name, protein, carb, fat, calories)
WHERE NOT EXISTS (
  SELECT 1 FROM alimentos a WHERE a.user_id IS NULL AND a.name = v.name
);
