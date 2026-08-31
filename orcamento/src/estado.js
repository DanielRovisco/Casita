import { novoId } from './format.js'

export const CHAVE = 'casita-v2'
export const CHAVE_ANTIGA = 'orcamento-mensal-v1'

export const CATEGORIAS = {
  Poupança: '#3B82F6',
  Essencial: '#10B981',
  Lazer: '#F59E0B',
  Outro: '#6B7280',
}

export const NOMES_CATEGORIAS = Object.keys(CATEGORIAS)

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
    rendimentos: [{ id: novoId(), descricao: 'Ordenado', valor: 850 }],
    despesas: [
      { id: novoId(), descricao: 'Poupança casa', valor: 500, categoria: 'Poupança' },
      { id: novoId(), descricao: 'Poupança carro', valor: 100, categoria: 'Poupança' },
      { id: novoId(), descricao: 'Alimentação', valor: 150, categoria: 'Essencial' },
    ],
  }
}

export const ESTADO_INICIAL = {
  versao: 2,
  aba: 'dashboard',
  casa: {
    saldo: 27660.58,
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
          id: r?.id || novoId(),
          descricao: String(r?.descricao ?? ''),
          valor: num(r?.valor),
        }))
      : fallback.rendimentos,
    despesas: Array.isArray(dados.despesas)
      ? dados.despesas.map((d) => ({
          id: d?.id || novoId(),
          descricao: String(d?.descricao ?? ''),
          valor: num(d?.valor),
          categoria: NOMES_CATEGORIAS.includes(d?.categoria) ? d.categoria : 'Outro',
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
        casa: {
          saldo: num(d?.casa?.saldo, inicial.casa.saldo),
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

export function guardarEstado(estado) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(estado))
  } catch {
    // localStorage indisponível (modo privado, quota cheia) — segue sem guardar
  }
}
