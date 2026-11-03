import { fmt } from '../lib/nutricion'

// Indicador circular de progreso; muestra ✓ al alcanzar la meta.
export default function Anillo({ titulo, actual, meta, color }) {
  const r = 34
  const circ = 2 * Math.PI * r
  const pct = meta > 0 ? (actual / meta) * 100 : 0
  const completo = pct >= 100
  const offset = circ * (1 - Math.min(pct, 100) / 100)

  return (
    <div className="anillo" style={{ '--color': color }}>
      <div className="anillo-titulo">{titulo}</div>
      <svg viewBox="0 0 80 80" width="88" height="88" aria-hidden="true">
        <circle cx="40" cy="40" r={r} className="anillo-pista" />
        <circle
          cx="40"
          cy="40"
          r={r}
          className="anillo-valor"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform="rotate(-90 40 40)"
        />
        {completo ? (
          <path d="M28 41 l8 8 l16 -18" className="anillo-check" />
        ) : (
          <text x="40" y="44" textAnchor="middle" className="anillo-texto">
            {fmt(pct, pct < 100 ? 1 : 0)}%
          </text>
        )}
      </svg>
      <div className="anillo-cifras">
        {Math.round(actual)}/{Math.round(meta)}
      </div>
    </div>
  )
}

export function PanelAnillos({ totales, metas }) {
  if (!metas) return null
  return (
    <div className="panel-anillos">
      <Anillo titulo="Calorías" actual={totales.kcal} meta={metas.calorias} color="var(--morado)" />
      <Anillo titulo="Proteínas" actual={totales.proteina} meta={metas.proteina} color="var(--verde)" />
      <Anillo titulo="Carbohidratos" actual={totales.carbohidratos} meta={metas.carbohidratos} color="var(--azul)" />
      <Anillo titulo="Grasas" actual={totales.grasa} meta={metas.grasa} color="var(--rojo)" />
    </div>
  )
}
