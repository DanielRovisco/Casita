import { novoId } from './format.js'

export const CHAVE = 'casita-v2'
export const CHAVE_ANTIGA = 'orcamento-mensal-v1'

export const CATEGORIAS_INICIAIS = [
  { id: 'poupanca', nome: 'Poupança', cor: '#3B82F6' },
  { id: 'essencial', nome: 'Essencial', cor: '#10B981' },
  { id: 'lazer', nome: 'Lazer', cor: '#F59E0B' },
  { id: 'outro', nome: 'Outro', cor: '#6B7280' },
]

/** Antes a despesa guardava o nome da categoria em vez do id. */
export const LEGADO_CATEGORIAS = {
  'Poupança': 'poupanca',
  Essencial: 'essencial',
  Lazer: 'lazer',
  Outro: 'outro',
}

/**
 * Cores para categorias novas: a paleta categórica validada para fundo
 * escuro (ΔE adjacente >= 8 em daltonismo), mais o cinzento do "Outro".
 */
export const CORES_CATEGORIA = [
  '#3987e5',
  '#d95926',
  '#199e70',
  '#c98500',
  '#d55181',
  '#9085e9',
  '#e66767',
  '#008300',
  '#6B7280',
]

export const COR_CASA = '#3B82F6'
export const COR_CARRO = '#06B6D4'
export const VERDE = '#10B981'
export const VERMELHO = '#EF4444'

export const ABAS = [
  { id: 'dashboard', nome: 'Dashboard' },
  { id: 'casa', nome: 'Casa' },
  { id: 'carro', nome: 'Carro' },
  { id: 'daniel', nome: 'Daniel' },
  { id: 'camila', nome: 'Camila' },
]

function orcamentoVazio() {
  return { contaCorrente: 0, rendimentos: [], despesas: [] }
}

function orcamentoExemplo() {
  return {
    contaCorrente: 0,
    rendimentos: [
      { id: 'r1', descricao: 'Ordenado', valor: 850, confirmado: false, recorrente: true },
    ],
    despesas: [
      { id: 'd1', descricao: 'Poupança casa', valor: 500, categoria: 'poupanca', confirmado: false, recorrente: true },
      { id: 'd2', descricao: 'Poupança carro', valor: 100, categoria: 'poupanca', confirmado: false, recorrente: true },
      { id: 'd3', descricao: 'Alimentação', valor: 150, categoria: 'essencial', confirmado: false, recorrente: true },
    ],
  }
}

export const ESTADO_INICIAL = {
  versao: 2,
  categorias: CATEGORIAS_INICIAIS,
  aba: 'dashboard',
  atualizado: 0,
  // Mês a que o orçamento diz respeito, como AAAAMM. 0 = ainda por definir.
  mes: { atual: 0 },
  casa: {
    saldo: 27660.58,
    saldoDesde: 0,
    taxaAnual: 2.4,
    ganhoMes: 54.53,
    ganhoTotal: 475.21,
    objetivo: 25000,
  },
  carro: {
    valor: 3519.12,
    retorno: 6.2,
    ganho3Meses: 103.23,
    objetivo: 0,
  },
  daniel: orcamentoExemplo(),
  camila: orcamentoVazio(),
}

const limparId = (id) => {
  const limpo = String(id ?? '').replace(/\./g, '_')
  return limpo || novoId()
}

const num = (v, fallback = 0) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function sanearOrcamento(dados, fallback) {
  if (!dados || typeof dados !== 'object') return fallback
  return {
    contaCorrente: num(dados.contaCorrente),
    rendimentos: Array.isArray(dados.rendimentos)
      ? dados.rendimentos.map((r) => ({
          id: limparId(r?.id),
          descricao: String(r?.descricao ?? ''),
          valor: num(r?.valor),
          confirmado: Boolean(r?.confirmado),
          recorrente: Boolean(r?.recorrente),
        }))
      : fallback.rendimentos,
    despesas: Array.isArray(dados.despesas)
      ? dados.despesas.map((d) => ({
          id: limparId(d?.id),
          descricao: String(d?.descricao ?? ''),
          valor: num(d?.valor),
          categoria: String(d?.categoria ?? 'outro'),
          confirmado: Boolean(d?.confirmado),
          recorrente: Boolean(d?.recorrente),
        }))
      : fallback.despesas,
  }
}

export function carregarEstado() {
  const inicial = ESTADO_INICIAL
  try {
    const guardado = localStorage.getItem(CHAVE)
    if (guardado) {
      const d = JSON.parse(guardado)
      return {
        versao: 2,
        aba: ABAS.some((a) => a.id === d?.aba) ? d.aba : 'dashboard',
        atualizado: num(d?.atualizado),
        mes: { atual: num(d?.mes?.atual) },
        casa: {
          saldo: num(d?.casa?.saldo, inicial.casa.saldo),
          saldoDesde: num(d?.casa?.saldoDesde, inicial.casa.saldoDesde),
          taxaAnual: num(d?.casa?.taxaAnual, inicial.casa.taxaAnual),
          ganhoMes: num(d?.casa?.ganhoMes, inicial.casa.ganhoMes),
          ganhoTotal: num(d?.casa?.ganhoTotal, inicial.casa.ganhoTotal),
          objetivo: num(d?.casa?.objetivo, inicial.casa.objetivo),
        },
        carro: {
          valor: num(d?.carro?.valor, inicial.carro.valor),
          retorno: num(d?.carro?.retorno, inicial.carro.retorno),
          ganho3Meses: num(d?.carro?.ganho3Meses, inicial.carro.ganho3Meses),
          objetivo: num(d?.carro?.objetivo, inicial.carro.objetivo),
        },
        daniel: sanearOrcamento(d?.daniel, inicial.daniel),
        camila: sanearOrcamento(d?.camila, inicial.camila),
      }
    }

    // Migração: o orçamento único da versão anterior passa a ser o do Daniel.
    const antigo = localStorage.getItem(CHAVE_ANTIGA)
    if (antigo) {
      return { ...inicial, daniel: sanearOrcamento(JSON.parse(antigo), inicial.daniel) }
    }
  } catch {
    // dados corrompidos ou localStorage indisponível — arranca com os valores iniciais
  }
  return inicial
}

