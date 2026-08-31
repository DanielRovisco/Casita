import { useEffect, useRef, useState } from 'react'
import { formatarNumero, parseValor } from './format.js'

/** Valor grande/pequeno que vira input ao clicar. */
export function ValorEditavel({
  valor,
  onChange,
  formatar,
  sufixo = '',
  className = '',
  ariaLabel,
}) {
  const [aEditar, setAEditar] = useState(false)
  const [rascunho, setRascunho] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (aEditar && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [aEditar])

  function abrir() {
    setRascunho(valor === 0 ? '' : formatarNumero(valor))
    setAEditar(true)
  }

  function terminar() {
    onChange(parseValor(rascunho))
    setAEditar(false)
  }

  if (aEditar) {
    return (
      <input
        ref={inputRef}
        className={`campo campo--valor ${className}`}
        type="text"
        inputMode="decimal"
        aria-label={ariaLabel}
        value={rascunho}
        onChange={(e) => setRascunho(e.target.value)}
        onBlur={terminar}
        onKeyDown={(e) => {
          if (e.key === 'Enter') terminar()
          if (e.key === 'Escape') setAEditar(false)
        }}
      />
    )
  }

  return (
    <span
      className={`editavel ${className}`}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onClick={abrir}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          abrir()
        }
      }}
    >
      {formatar(valor)}
      {sufixo}
    </span>
  )
}

/** Input de valor sempre visível (linhas de listas). */
export function ValorInput({ valor, onChange, ariaLabel }) {
  const [rascunho, setRascunho] = useState(null)

  return (
    <input
      className="campo campo--valor"
      type="text"
      inputMode="decimal"
      aria-label={ariaLabel}
      value={rascunho ?? formatarNumero(valor)}
      onChange={(e) => {
        setRascunho(e.target.value)
        onChange(parseValor(e.target.value))
      }}
      onFocus={(e) => {
        setRascunho(valor === 0 ? '' : formatarNumero(valor))
        requestAnimationFrame(() => e.target.select())
      }}
      onBlur={() => setRascunho(null)}
    />
  )
}

/** Linha "label ....... valor" com o valor editável. */
export function LinhaEditavel({ label, valor, onChange, formatar, sufixo, cor }) {
  return (
    <div className="linha-dados">
      <span className="linha-dados__label">{label}</span>
      <span className="linha-dados__valor" style={cor ? { color: cor } : undefined}>
        <ValorEditavel
          valor={valor}
          onChange={onChange}
          formatar={formatar}
          sufixo={sufixo}
          ariaLabel={label}
        />
      </span>
    </div>
  )
}

/** Linha só de leitura (valores calculados). */
export function LinhaCalculada({ label, valor, cor, nota }) {
  return (
    <div className="linha-dados">
      <span className="linha-dados__label">
        {label}
        {nota && <span className="linha-dados__nota"> {nota}</span>}
      </span>
      <span className="linha-dados__valor" style={cor ? { color: cor } : undefined}>
        {valor}
      </span>
    </div>
  )
}

export function Barra({ percentagem, cor }) {
  const largura = Math.max(0, Math.min(100, Number.isFinite(percentagem) ? percentagem : 0))
  return (
    <div className="barra">
      <div className="barra__fill" style={{ width: `${largura}%`, background: cor }} />
    </div>
  )
}
