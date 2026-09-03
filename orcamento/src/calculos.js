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

/** Dias inteiros que faltam até ao último dia deste mês. */
export function diasAteFimDoMes(agora = Date.now()) {
  const d = new Date(agora)
  const ultimo = new Date(d.getFullYear(), d.getMonth() + 1, 0)
  return Math.max(0, Math.round((inicioDoDia(ultimo) - inicioDoDia(agora)) / DIA_MS))
}

export function diasDoMes(agora = Date.now()) {
  const d = new Date(agora)
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
}

/** Casa no fim do mês: juros certos, é só deixar correr os dias que faltam. */
export const casaFimDoMes = (casa, agora = Date.now()) =>
  saldoCasa(casa, agora) * Math.pow(fatorDiario(casa.taxaAnual), diasAteFimDoMes(agora))

/** Carro no fim do mês: a média dos últimos meses, na parte do mês que falta. */
export const carroFimDoMes = (carro, agora = Date.now()) =>
  carro.valor + (carro.ganho3Meses / 3) * (diasAteFimDoMes(agora) / diasDoMes(agora))

export const patrimonioTotal = (estado, agora = Date.now()) =>
  saldoCasa(estado.casa, agora) + estado.carro.valor

export function progresso(valor, objetivo) {
  if (!objetivo || objetivo <= 0) return null
  return (valor / objetivo) * 100
}

const soma = (itens, filtro = () => true) =>
  itens.reduce((total, i) => total + (filtro(i) ? Number(i.valor) || 0 : 0), 0)

const confirmado = (i) => Boolean(i.confirmado)

export function totaisOrcamento(orcamento, categorias = []) {
  const rendimentos = soma(orcamento.rendimentos)
  const despesas = soma(orcamento.despesas)
  const rendimentosRecebidos = soma(orcamento.rendimentos, confirmado)
  const despesasPagas = soma(orcamento.despesas, confirmado)

  const porCategoria = categorias.map((categoria) => {
    const daCategoria = orcamento.despesas.filter((d) => d.categoria === categoria.id)
    return {
      ...categoria,
      total: soma(daCategoria),
      pago: soma(daCategoria, confirmado),
      quantidade: daCategoria.length,
      fatia: despesas > 0 ? (soma(daCategoria) / despesas) * 100 : 0,
    }
  })

  const sobra = rendimentos - despesas
  return {
    rendimentos,
    despesas,
    rendimentosRecebidos,
    despesasPagas,
    porCategoria,
    sobra,
    estimativa: orcamento.contaCorrente + sobra,
    // O que já aconteceu de facto: conta corrente + recebido − pago.
    realAteAgora: orcamento.contaCorrente + rendimentosRecebidos - despesasPagas,
    taxaPoupanca: rendimentos > 0 ? (sobra / rendimentos) * 100 : 0,
  }
}
