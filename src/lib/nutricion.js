export const ACTIVIDADES = [
  { value: 'sedentario', label: 'Poco o ningún ejercicio', factor: 1.2 },
  { value: 'ligero', label: 'Ejercicio ligero (1-3 días/semana)', factor: 1.375 },
  { value: 'moderado', label: 'Ejercicio moderado (3-5 días/semana)', factor: 1.55 },
  { value: 'fuerte', label: 'Ejercicio fuerte (6-7 días/semana)', factor: 1.725 },
  { value: 'muy_fuerte', label: 'Muy fuerte (2 veces al día)', factor: 1.9 },
]

export const OBJETIVOS = [
  { value: 'mantener', label: 'Mantener peso' },
  { value: 'perder_grasa', label: 'Perder grasa' },
  { value: 'ganar_musculo', label: 'Ganar musculatura' },
]

export const FORMULAS = [
  { value: 'katch', label: 'Katch-McArdle (usa masa magra)' },
  { value: 'mifflin', label: 'Mifflin-St Jeor (tabla "Harris y Benedict")' },
  { value: 'harris', label: 'Harris-Benedict revisada (1984)' },
]

export const TIPOS_DIETA = [
  { value: 'estandar', label: 'Dieta estándar', proteina: 2, grasa: 0.75 },
  { value: 'alta_proteina', label: 'Alta en proteína', proteina: 2.5, grasa: 0.8 },
  { value: 'baja_carbo', label: 'Baja en carbohidratos', proteina: 2.2, grasa: 1.5 },
  { value: 'personalizada', label: 'Personalizada' },
]

export const KCAL = { proteina: 4, carbohidratos: 4, grasa: 9 }

const num = (v) => (v === null || v === undefined || v === '' ? null : Number(v))

export function calcularMetas(p) {
  const peso = num(p.peso_kg)
  const altura = num(p.altura_cm)
  const edad = num(p.edad)
  const grasa = num(p.grasa_corporal)
  if (!peso || !altura || !edad) return null

  const hombre = p.genero !== 'mujer'
  const alturaM = altura / 100
  const masaMagra = grasa !== null ? peso * (1 - grasa / 100) : null
  const imc = peso / alturaM ** 2
  const ffmi = masaMagra !== null ? masaMagra / alturaM ** 2 : null

  // Katch-McArdle necesita % de grasa; sin él se usa Mifflin-St Jeor.
  let formula = p.formula || 'katch'
  if (formula === 'katch' && masaMagra === null) formula = 'mifflin'

  let tmb
  if (formula === 'katch') {
    tmb = 370 + 21.6 * masaMagra
  } else if (formula === 'harris') {
    tmb = hombre
      ? 88.362 + 13.397 * peso + 4.799 * altura - 5.677 * edad
      : 447.593 + 9.247 * peso + 3.098 * altura - 4.33 * edad
  } else {
    tmb = 10 * peso + 6.25 * altura - 5 * edad + (hombre ? 5 : -161)
  }

  const actividad = ACTIVIDADES.find((a) => a.value === p.indice_actividad) ?? ACTIVIDADES[0]
  const mantenimiento = tmb * actividad.factor

  let ajuste = 0
  if (p.objetivo === 'perder_grasa') ajuste = -(num(p.deficit_pct) ?? 0) / 100
  if (p.objetivo === 'ganar_musculo') ajuste = (num(p.excedente_pct) ?? 0) / 100
  const calorias = mantenimiento * (1 + ajuste)

  // Los g/kg se aplican sobre masa magra cuando se conoce la grasa corporal.
  const baseKg = masaMagra ?? peso
  const proteinaGkg = num(p.proteina_gkg) ?? 2
  const grasaGkg = num(p.grasa_gkg) ?? 0.75
  const proteina = baseKg * proteinaGkg
  const grasaG = baseKg * grasaGkg
  const carbKcal = Math.max(0, calorias - proteina * KCAL.proteina - grasaG * KCAL.grasa)
  const carbohidratos = carbKcal / KCAL.carbohidratos

  // Agua: 1 ml por kcal objetivo (refleja fórmula, actividad y objetivo),
  // con un mínimo de 35 ml por kg para que un déficit no reduzca la hidratación.
  const aguaPorKcal = calorias * 1
  const aguaPorPeso = peso * 35
  const agua = Math.round(Math.max(aguaPorKcal, aguaPorPeso) / 50) * 50

  return {
    formulaUsada: formula,
    imc,
    masaMagra,
    ffmi,
    tmb,
    mantenimiento,
    calorias,
    baseKg,
    baseEsMagra: masaMagra !== null,
    proteina,
    grasa: grasaG,
    carbohidratos,
    proteinaGkg,
    grasaGkg,
    carbGkg: carbohidratos / baseKg,
    agua,
    aguaCriterio: aguaPorKcal >= aguaPorPeso ? 'kcal' : 'peso',
  }
}

// Macros de una porción: los valores del alimento están dados para total_weight gramos.
export function macrosPorcion(alimento, gramos) {
  const base = Number(alimento?.total_weight) || 100
  const f = (Number(gramos) || 0) / base
  return {
    kcal: (Number(alimento?.calories) || 0) * f,
    proteina: (Number(alimento?.protein) || 0) * f,
    carbohidratos: (Number(alimento?.carb) || 0) * f,
    grasa: (Number(alimento?.fat) || 0) * f,
  }
}

export function sumarMacros(lista) {
  return lista.reduce(
    (t, m) => ({
      kcal: t.kcal + m.kcal,
      proteina: t.proteina + m.proteina,
      carbohidratos: t.carbohidratos + m.carbohidratos,
      grasa: t.grasa + m.grasa,
    }),
    { kcal: 0, proteina: 0, carbohidratos: 0, grasa: 0 },
  )
}

// Reparto energético (%) de proteína, carbohidratos y grasa.
export function repartoEnergia(m) {
  const p = m.proteina * KCAL.proteina
  const c = m.carbohidratos * KCAL.carbohidratos
  const g = m.grasa * KCAL.grasa
  const total = p + c + g
  if (!total) return { proteina: 0, carbohidratos: 0, grasa: 0 }
  return { proteina: (p / total) * 100, carbohidratos: (c / total) * 100, grasa: (g / total) * 100 }
}

export const fmt = (n, dec = 2) =>
  (Number(n) || 0).toLocaleString('es-ES', { minimumFractionDigits: dec, maximumFractionDigits: dec })
