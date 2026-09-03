/**
 * Anel de proporções. Só para parte-do-todo à vista de olho: os valores
 * exatos vivem na lista ao lado, que é quem responde a "quanto foi isto".
 * Com mais de 6 fatias as mais pequenas juntam-se numa só, porque a partir
 * daí as cores adjacentes deixam de se distinguir.
 */

const RAIO = 45
const ESPESSURA = 14
const PERIMETRO = 2 * Math.PI * RAIO
const FOLGA = 2 // separador da cor do cartão entre fatias
const MAX_FATIAS = 6
const COR_RESTO = '#4B5563'

export function agruparFatias(itens, maximo = MAX_FATIAS) {
  const comValor = itens.filter((i) => i.total > 0).sort((a, b) => b.total - a.total)
  if (comValor.length <= maximo) return comValor

  const principais = comValor.slice(0, maximo - 1)
  const resto = comValor.slice(maximo - 1)
  return [
    ...principais,
    {
      id: '@resto',
      nome: `Outras ${resto.length}`,
      cor: COR_RESTO,
      total: resto.reduce((s, i) => s + i.total, 0),
    },
  ]
}

export default function Donut({ itens, titulo }) {
  const fatias = agruparFatias(itens)
  const total = fatias.reduce((s, f) => s + f.total, 0)

  if (total <= 0) {
    return (
      <svg className="donut" viewBox="0 0 120 120" role="img" aria-label="Sem despesas">
        <circle cx="60" cy="60" r={RAIO} className="donut__vazio" strokeWidth={ESPESSURA} />
      </svg>
    )
  }

  let acumulado = 0

  return (
    <svg
      className="donut"
      viewBox="0 0 120 120"
      role="img"
      aria-label={titulo || 'Despesas por categoria'}
    >
      {fatias.map((fatia) => {
        const comprimento = (fatia.total / total) * PERIMETRO
        const inicio = acumulado
        acumulado += comprimento
        // Uma fatia mais pequena que a folga ficaria invisível.
        const visivel = Math.max(comprimento - FOLGA, 0.5)

        return (
          <circle
            key={fatia.id}
            cx="60"
            cy="60"
            r={RAIO}
            fill="none"
            stroke={fatia.cor}
            strokeWidth={ESPESSURA}
            strokeDasharray={`${visivel} ${PERIMETRO - visivel}`}
            strokeDashoffset={-inicio}
            transform="rotate(-90 60 60)"
          >
            <title>{`${fatia.nome}: ${((fatia.total / total) * 100).toFixed(1)}%`}</title>
          </circle>
        )
      })}
    </svg>
  )
}
