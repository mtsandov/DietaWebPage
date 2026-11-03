import Modal from './Modal'

const NIVELES = {
  hombre: [
    { rango: '6–9 %', valor: 8, desc: 'Abdominales muy marcados, venas visibles' },
    { rango: '10–13 %', valor: 12, desc: 'Abdominales visibles, buena definición' },
    { rango: '14–17 %', valor: 15, desc: 'Contorno del abdomen apenas visible' },
    { rango: '18–22 %', valor: 20, desc: 'Sin definición, ligera grasa en la cintura' },
    { rango: '23–28 %', valor: 25, desc: 'Grasa abdominal evidente' },
    { rango: '29 %+', valor: 32, desc: 'Acumulación notable en abdomen y cintura' },
  ],
  mujer: [
    { rango: '14–17 %', valor: 16, desc: 'Muy definida, abdominales visibles' },
    { rango: '18–21 %', valor: 20, desc: 'Atlética, abdomen plano con algo de definición' },
    { rango: '22–25 %', valor: 24, desc: 'En forma, curvas suaves' },
    { rango: '26–30 %', valor: 28, desc: 'Sin definición muscular, algo de grasa en caderas' },
    { rango: '31–35 %', valor: 33, desc: 'Grasa evidente en abdomen, caderas y muslos' },
    { rango: '36 %+', valor: 38, desc: 'Acumulación notable' },
  ],
}

// Silueta esquemática: la cintura se ensancha y la definición desaparece con cada nivel.
function Silueta({ nivel, mujer }) {
  const cx = 50
  const hombros = mujer ? 28 + nivel : 34 + nivel
  const cintura = (mujer ? 17 : 22) + nivel * 4
  const cadera = (mujer ? 30 : 24) + nivel * 3.5
  const panza = nivel * 2.5
  const d = `M ${cx - hombros} 24 Q ${cx} 16 ${cx + hombros} 24
    L ${cx + cintura} 70 Q ${cx + cintura + panza} 86 ${cx + cadera} 106
    L ${cx - cadera} 106 Q ${cx - cintura - panza} 86 ${cx - cintura} 70 Z`
  return (
    <svg viewBox="0 0 100 110" width="70" height="78" aria-hidden="true">
      <circle cx={cx} cy="9" r="8" className="silueta" />
      <path d={d} className="silueta" />
      {nivel <= 1 && (
        <g className="silueta-linea">
          <line x1={cx} y1="44" x2={cx} y2="96" />
          <line x1={cx - 8} y1="56" x2={cx + 8} y2="56" />
          <line x1={cx - 8} y1="68" x2={cx + 8} y2="68" />
          <line x1={cx - 8} y1="80" x2={cx + 8} y2="80" />
        </g>
      )}
      {nivel === 2 && (
        <g className="silueta-linea tenue">
          <line x1={cx} y1="48" x2={cx} y2="92" />
        </g>
      )}
    </svg>
  )
}

export default function GrasaVisual({ genero, actual, onElegir, onClose }) {
  const mujer = genero === 'mujer'
  const niveles = NIVELES[mujer ? 'mujer' : 'hombre']
  return (
    <Modal titulo="Estimación visual de grasa corporal" onClose={onClose} ancho={720}>
      <p className="ayuda">Elige la imagen que más se parezca a tu abdomen. Es una estimación orientativa.</p>
      <div className="grasa-grid">
        {niveles.map((n, i) => (
          <button
            type="button"
            key={n.rango}
            className={`grasa-opcion ${Number(actual) === n.valor ? 'activa' : ''}`}
            onClick={() => {
              onElegir(n.valor)
              onClose()
            }}
          >
            <Silueta nivel={i} mujer={mujer} />
            <b>{n.rango}</b>
            <small>{n.desc}</small>
          </button>
        ))}
      </div>
    </Modal>
  )
}
