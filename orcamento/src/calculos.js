import { NOMES_CATEGORIAS } from './estado.js'

const DIA_MS = 86400000

const inicioDoDia = (instante) => {
  const d = new Date(instante)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/**
 * Fator de um dia a partir do APY. O banco capitaliza todos os dias, por
 * isso a taxa diária é a raiz 365 do ano, não o ano a dividir por 365.
 */
export const fatorDiario = (taxaAnual) => Math.pow(1 + taxaAnual / 100, 1 / 365)

/** Dias inteiros passados desde o saldo ter sido registado. */
export function diasDesde(desde, agora = Date.now()) {
  if (!desde) return 0
  // Arredonda: com a mudança da hora há dias de 23 e de 25 horas.
  return Math.max(0, Math.round((inicioDoDia(agora) - inicioDoDia(desde)) / DIA_MS))
}

/** Saldo de hoje: o último saldo registado, mais os juros de cada dia desde então. */
export function saldoCasa(casa, agora = Date.now()) {
  const dias = diasDesde(casa.saldoDesde, agora)
  return casa.saldo * Math.pow(fatorDiario(casa.taxaAnual), dias)
}

export const jurosAcumulados = (casa, agora = Date.now()) => saldoCasa(casa, agora) - casa.saldo

export const juroDiario = (casa, agora = Date.now()) =>
  saldoCasa(casa, agora) * (fatorDiario(casa.taxaAnual) - 1)

export const juroMensal = (casa, agora = Date.now()) =>
  saldoCasa(casa, agora) * (Math.pow(fatorDiario(casa.taxaAnual), 30) - 1)

export const juroAnual = (casa, agora = Date.now()) => saldoCasa(casa, agora) * (casa.taxaAnual / 100)

export const patrimonioTotal = (estado, agora = Date.now()) =>
  saldoCasa(estado.casa, agora) + estado.carro.valor

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
