import { NOMES_CATEGORIAS } from './estado.js'

export const juroDiario = (casa) => (casa.saldo * (casa.taxaAnual / 100)) / 365
export const juroMensal = (casa) => (casa.saldo * (casa.taxaAnual / 100)) / 12
export const juroAnual = (casa) => casa.saldo * (casa.taxaAnual / 100)

export const patrimonioTotal = (estado) => estado.casa.saldo + estado.carro.valor

export function progresso(valor, objetivo) {
  if (!objetivo || objetivo <= 0) return null
  return (valor / objetivo) * 100
}

export function totaisOrcamento(orcamento) {
  const rendimentos = orcamento.rendimentos.reduce((s, r) => s + (Number(r.valor) || 0), 0)
  const despesas = orcamento.despesas.reduce((s, d) => s + (Number(d.valor) || 0), 0)

  const porCategoria = Object.fromEntries(NOMES_CATEGORIAS.map((n) => [n, 0]))
  for (const d of orcamento.despesas) {
    const cat = NOMES_CATEGORIAS.includes(d.categoria) ? d.categoria : 'Outro'
    porCategoria[cat] += Number(d.valor) || 0
  }

  const sobra = rendimentos - despesas
  return {
    rendimentos,
    despesas,
    porCategoria,
    sobra,
    estimativa: orcamento.contaCorrente + sobra,
    taxaPoupanca: rendimentos > 0 ? (sobra / rendimentos) * 100 : 0,
  }
}
