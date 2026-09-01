/**
 * O estado sincronizado é guardado como registos independentes:
 * uma entrada por campo, cada uma com o instante em que foi escrita.
 * Ao juntar dois dispositivos, ganha o mais recente CAMPO A CAMPO —
 * duas pessoas a mexer ao mesmo tempo em coisas diferentes não se pisam.
 */

import { ESTADO_INICIAL, NOMES_CATEGORIAS } from '../estado.js'

export const CAMPOS_SIMPLES = [
  'casa.saldo',
  'casa.taxaAnual',
  'casa.ganhoMes',
  'casa.ganhoTotal',
  'casa.objetivo',
  'carro.valor',
  'carro.retorno',
  'carro.ganho3Meses',
  'carro.objetivo',
  'daniel.contaCorrente',
  'camila.contaCorrente',
]

export const PESSOAS = ['daniel', 'camila']
export const LISTAS = ['rendimentos', 'despesas']

const EXISTE = '@existe'
const ORDEM = '@ordem'

const clonar = (v) => JSON.parse(JSON.stringify(v))
const iguais = (a, b) => JSON.stringify(a) === JSON.stringify(b)

/** Estado da interface -> mapa plano de valores. */
export function achatar(estado) {
  const valores = {}

  for (const campo of CAMPOS_SIMPLES) {
    const [grupo, chave] = campo.split('.')
    valores[campo] = estado[grupo][chave]
  }

  for (const pessoa of PESSOAS) {
    for (const lista of LISTAS) {
      estado[pessoa][lista].forEach((item, indice) => {
        const base = `${pessoa}.${lista}.${item.id}`
        valores[`${base}.${EXISTE}`] = true
        valores[`${base}.${ORDEM}`] = indice
        valores[`${base}.descricao`] = item.descricao
        valores[`${base}.valor`] = item.valor
        if (lista === 'despesas') valores[`${base}.categoria`] = item.categoria
      })
    }
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

  const itens = new Map()
  for (const [chave, registo] of Object.entries(registos)) {
    const partes = chave.split('.')
    if (partes.length !== 4) continue
    const [pessoa, lista, id, campo] = partes
    if (!PESSOAS.includes(pessoa) || !LISTAS.includes(lista)) continue

    const caminho = `${pessoa}.${lista}.${id}`
    if (!itens.has(caminho)) itens.set(caminho, { pessoa, lista, id, campos: {} })
    itens.get(caminho).campos[campo] = registo.v
  }

  for (const { pessoa, lista, id, campos } of itens.values()) {
    if (campos[EXISTE] !== true) continue
    const item = {
      id,
      descricao: String(campos.descricao ?? ''),
      valor: Number(campos.valor) || 0,
      ordem: Number(campos[ORDEM]) || 0,
    }
    if (lista === 'despesas') {
      item.categoria = NOMES_CATEGORIAS.includes(campos.categoria) ? campos.categoria : 'Outro'
    }
    estado[pessoa][lista].push(item)
  }

  for (const pessoa of PESSOAS) {
    for (const lista of LISTAS) {
      estado[pessoa][lista].sort((a, b) => a.ordem - b.ordem || a.id.localeCompare(b.id))
      estado[pessoa][lista] = estado[pessoa][lista].map(({ ordem, ...item }) => item)
    }
  }

  return estado
}

export const registosIniciais = () => estampar({}, achatar(ESTADO_INICIAL), 0)
