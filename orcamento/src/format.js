const euro = new Intl.NumberFormat('pt-PT', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const numero = new Intl.NumberFormat('pt-PT', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const numeroCurto = new Intl.NumberFormat('pt-PT', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const seguro = (v) => (Number.isFinite(v) ? v : 0)

export const formatarEuro = (v) => euro.format(seguro(v))
export const formatarNumero = (v) => numero.format(seguro(v))
export const formatarEuroCurto = (v) => `${numeroCurto.format(seguro(v))} €`
export const formatarPercentagem = (v, casas = 2) =>
  `${new Intl.NumberFormat('pt-PT', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  }).format(seguro(v))}%`

// Aceita "1234,56", "1.234,56" e também "1234.56"
export function parseValor(texto) {
  if (typeof texto === 'number') return Number.isFinite(texto) ? texto : 0
  const limpo = String(texto).replace(/[^\d,.-]/g, '')
  if (limpo === '' || limpo === '-') return 0
  const normalizado = limpo.includes(',')
    ? limpo.replace(/\./g, '').replace(',', '.')
    : limpo
  const n = parseFloat(normalizado)
  return Number.isFinite(n) ? n : 0
}

export function novoId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}
