// Fechas locales en formato YYYY-MM-DD (sin pasar por UTC para no saltar de día).
export function aISO(d) {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${dia}`
}

export const hoyISO = () => aISO(new Date())

export function sumarDias(iso, n) {
  const [y, m, d] = iso.split('-').map(Number)
  return aISO(new Date(y, m - 1, d + n))
}

export function formatoFecha(iso) {
  const [y, m, d] = iso.split('-')
  return `${d}-${m}-${y}`
}
