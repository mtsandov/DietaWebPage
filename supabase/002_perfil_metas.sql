-- Columnas extra del perfil que usa la calculadora.
-- Ejecutar una vez en Supabase > SQL Editor.
ALTER TABLE perfiles
  ADD COLUMN IF NOT EXISTS formula VARCHAR(50) DEFAULT 'katch',
  ADD COLUMN IF NOT EXISTS deficit_pct FLOAT4 DEFAULT 15,
  ADD COLUMN IF NOT EXISTS excedente_pct FLOAT4 DEFAULT 15,
  ADD COLUMN IF NOT EXISTS proteina_gkg FLOAT4 DEFAULT 2,
  ADD COLUMN IF NOT EXISTS grasa_gkg FLOAT4 DEFAULT 0.75;

-- Las políticas FOR ALL ... USING no validan explícitamente las filas nuevas:
-- se reescriben con WITH CHECK para que nadie pueda insertar a nombre de otro.
DROP POLICY IF EXISTS "Usuarios ven y editan su propio perfil" ON perfiles;
CREATE POLICY "Usuarios ven y editan su propio perfil"
ON perfiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Insertar y modificar solo alimentos propios" ON alimentos;
CREATE POLICY "Insertar y modificar solo alimentos propios"
ON alimentos FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Control total sobre registro diario propio" ON registro_diario;
CREATE POLICY "Control total sobre registro diario propio"
ON registro_diario FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Control total sobre menús propios" ON menus;
CREATE POLICY "Control total sobre menús propios"
ON menus FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Índices para las consultas más frecuentes.
CREATE INDEX IF NOT EXISTS registro_diario_user_fecha_idx ON registro_diario (user_id, fecha);
CREATE INDEX IF NOT EXISTS detalle_menu_menu_idx ON detalle_menu (menu_id);
CREATE INDEX IF NOT EXISTS alimentos_user_idx ON alimentos (user_id);
