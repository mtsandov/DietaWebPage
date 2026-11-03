import { useState } from 'react'

// Input de gramos que guarda al perder el foco o pulsar Enter.
export default function InputGramos({ valor, onCambio }) {
  const [texto, setTexto] = useState(String(valor))
  const confirmar = () => {
    const g = Number(texto)
    if (g > 0 && g !== Number(valor)) onCambio(g)
    else setTexto(String(valor))
  }
  return (
    <div className="input-sufijo compacto">
      <input
        type="number"
        step="any"
        min="0"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onBlur={confirmar}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      />
      <span>gr</span>
    </div>
  )
}
