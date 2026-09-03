/**
 * O estado sincronizado é guardado como registos independentes:
 * uma entrada por campo, cada uma com o instante em que foi escrita.
 * Ao juntar dois dispositivos, ganha o mais recente CAMPO A CAMPO —
 * duas pessoas a mexer ao mesmo tempo em coisas diferentes não se pisam.
 */

import { CATEGORIAS_INICIAIS, ESTADO_INICIAL, LEGADO_CATEGORIAS } from '../estado.js'

export const CAMPOS_SIMPLES = [
  'casa.saldo',
  'casa.saldoDesde',
  'casa.taxaAnual',
  'casa.ganhoMes',
  'casa.ganhoTotal',
  'casa.objetivo',
  'carro.valor',
  'carro.retorno',
  'carro.ganho3Meses',
  'carro.objetivo',
  'mes.atual',
  'daniel.contaCorrente',
  'camila.contaCorrente',
]

export const PESSOAS = ['daniel', 'camila']
export const LISTAS = ['rendimentos', 'despesas']

const CAMPOS_RENDIMENTO = {
  descricao: 'texto',
  valor: 'numero',
  confirmado: 'bool',
  recorrente: 'bool',
}
const CAMPOS_DESPESA = {
  descricao: 'texto',
  valor: 'numero',
  categoria: 'texto',
  confirmado: 'bool',
  recorrente: 'bool',
}
const CAMPOS_CATEGORIA = { nome: 'texto', cor: 'texto' }

/** Cada coleção é uma lista de itens com id próprio. */
export const COLECOES = [
  ...PESSOAS.flatMap((pessoa) => [
    { prefixo: `${pessoa}.rendimentos`, destino: [pessoa, 'rendimentos'], campos: CAMPOS_RENDIMENTO },
    { prefixo: `${pessoa}.despesas`, destino: [pessoa, 'despesas'], campos: CAMPOS_DESPESA },
  ]),
  { prefixo: 'categorias', destino: ['categorias'], campos: CAMPOS_CATEGORIA },
]

const EXISTE = '@existe'
const ORDEM = '@ordem'

const clonar = (v) => JSON.parse(JSON.stringify(v))
const iguais = (a, b) => JSON.stringify(a) === JSON.stringify(b)

const emCaminho = (estado, destino) =>
  destino.length === 1 ? estado[destino[0]] : estado[destino[0]][destino[1]]

function converter(valor, tipo, omissao) {
  if (valor === undefined || valor === null) return omissao
  if (tipo === 'numero') {
    const n = Number(valor)
    return Number.isFinite(n) ? n : 0
  }
  if (tipo === 'bool') return Boolean(valor)
  return String(valor)
}

const OMISSAO = { numero: 0, texto: '', bool: false }

/** Estado da interface -> mapa plano de valores. */
export function achatar(estado) {
  const valores = {}

  for (const campo of CAMPOS_SIMPLES) {
    const [grupo, chave] = campo.split('.')
    valores[campo] = estado[grupo][chave]
  }

  for (const colecao of COLECOES) {
    emCaminho(estado, colecao.destino).forEach((item, indice) => {
      const base = `${colecao.prefixo}.${item.id}`
      valores[`${base}.${EXISTE}`] = true
      valores[`${base}.${ORDEM}`] = indice
      for (const campo of Object.keys(colecao.campos)) {
        valores[`${base}.${campo}`] = item[campo]
      }
    })
  }

  return valores
}

/**
 * Carimba nos registos só os campos que mudaram. Um item removido não
 * desaparece: fica marcado como inexistente, senão outro dispositivo
 * que ainda o tivesse voltava a ressuscitá-lo na fusão seguinte.
 */
export function estampar(registos, valores, agora) {
  const novos = { ...registos }

  for (const [chave, valor] of Object.entries(valores)) {
    if (!novos[chave] || !iguais(novos[chave].v, valor)) {
      novos[chave] = { v: valor, t: agora }
    }
  }

  for (const [chave, registo] of Object.entries(registos)) {
    if (chave.endsWith(`.${EXISTE}`) && registo.v === true && !(chave in valores)) {
      novos[chave] = { v: false, t: agora }
    }
  }

  return novos
}

/** Junta dois conjuntos de registos: por campo, vence o carimbo maior. */
export function fundir(a, b) {
  const resultado = { ...a }

  for (const [chave, registo] of Object.entries(b)) {
    const atual = resultado[chave]
    if (!atual || registo.t > atual.t) {
      resultado[chave] = registo
    } else if (registo.t === atual.t && !iguais(registo.v, atual.v)) {
      // Empate exato: escolhe-se sempre o mesmo lado para os dispositivos convergirem.
      const x = JSON.stringify(atual.v)
      const y = JSON.stringify(registo.v)
      if (y > x) resultado[chave] = registo
    }
  }

  return resultado
}

/** Registos -> estado da interface. */
export function reconstruir(registos) {
  const estado = {
    casa: clonar(ESTADO_INICIAL.casa),
    carro: clonar(ESTADO_INICIAL.carro),
    mes: clonar(ESTADO_INICIAL.mes),
    categorias: [],
    daniel: { contaCorrente: 0, rendimentos: [], despesas: [] },
    camila: { contaCorrente: 0, rendimentos: [], despesas: [] },
  }

  for (const campo of CAMPOS_SIMPLES) {
    const registo = registos[campo]
    if (!registo) continue
    const [grupo, chave] = campo.split('.')
    const valor = Number(registo.v)
    estado[grupo][chave] = Number.isFinite(valor) ? valor : 0
  }

  const porColecao = new Map(COLECOES.map((c) => [c.prefixo, new Map()]))

  for (const [chave, registo] of Object.entries(registos)) {
    const colecao = COLECOES.find((c) => chave.startsWith(`${c.prefixo}.`))
    if (!colecao) continue
    const resto = chave.slice(colecao.prefixo.length + 1).split('.')
    if (resto.length !== 2) continue
    const [id, campo] = resto

    const itens = porColecao.get(colecao.prefixo)
    if (!itens.has(id)) itens.set(id, {})
    itens.get(id)[campo] = registo.v
  }

  for (const colecao of COLECOES) {
    const lista = []
    for (const [id, campos] of porColecao.get(colecao.prefixo)) {
      if (campos[EXISTE] !== true) continue
      const item = { id, ordem: Number(campos[ORDEM]) || 0 }
      for (const [campo, tipo] of Object.entries(colecao.campos)) {
        item[campo] = converter(campos[campo], tipo, OMISSAO[tipo])
      }
      lista.push(item)
    }
    lista.sort((a, b) => a.ordem - b.ordem || a.id.localeCompare(b.id))

    const semOrdem = lista.map(({ ordem, ...item }) => item)
    if (colecao.destino.length === 1) estado[colecao.destino[0]] = semOrdem
    else estado[colecao.destino[0]][colecao.destino[1]] = semOrdem
  }

  if (estado.categorias.length === 0) estado.categorias = clonar(CATEGORIAS_INICIAIS)

  // Versões anteriores guardavam o nome da categoria dentro da despesa.
  const ids = new Set(estado.categorias.map((c) => c.id))
  const reserva = estado.categorias[estado.categorias.length - 1].id
  for (const pessoa of PESSOAS) {
    for (const despesa of estado[pessoa].despesas) {
      if (ids.has(despesa.categoria)) continue
      despesa.categoria = LEGADO_CATEGORIAS[despesa.categoria] || reserva
    }
  }

  return estado
}

export const registosIniciais = () => estampar({}, achatar(ESTADO_INICIAL), 0)
