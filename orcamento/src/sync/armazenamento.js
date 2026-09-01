import { ABAS, carregarEstado } from '../estado.js'
import { achatar, estampar } from './registos.js'

const CHAVE = 'casita-v3'
const CHAVE_ESPACOS = 'casita-espacos-vistos'

/** Cache local: arranque instantâneo e funcionamento sem rede. */
export function carregarLocal() {
  try {
    const guardado = localStorage.getItem(CHAVE)
    if (guardado) {
      const d = JSON.parse(guardado)
      if (d && typeof d.registos === 'object' && d.registos) {
        return {
          aba: ABAS.some((a) => a.id === d.aba) ? d.aba : 'dashboard',
          registos: sanearRegistos(d.registos),
        }
      }
    }
  } catch {
    // dados corrompidos — cai para a migração
  }

  // Migração das versões anteriores, que guardavam o estado inteiro num bloco.
  const antigo = carregarEstado()
  return {
    aba: antigo.aba,
    registos: estampar({}, achatar(antigo), antigo.atualizado || 0),
  }
}

export function guardarLocal({ aba, registos }) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify({ aba, registos }))
  } catch {
    // localStorage indisponível — segue sem cache
  }
}

function sanearRegistos(registos) {
  const limpos = {}
  for (const [chave, registo] of Object.entries(registos)) {
    if (!registo || typeof registo !== 'object') continue
    const t = Number(registo.t)
    limpos[chave] = { v: registo.v, t: Number.isFinite(t) ? t : 0 }
  }
  return limpos
}

/** Um dispositivo que nunca sincronizou com este espaço adota o que lá está. */
export function jaViuEspaco(espaco) {
  try {
    const lista = JSON.parse(localStorage.getItem(CHAVE_ESPACOS) || '[]')
    return Array.isArray(lista) && lista.includes(espaco)
  } catch {
    return false
  }
}

export function marcarEspacoVisto(espaco) {
  try {
    const lista = JSON.parse(localStorage.getItem(CHAVE_ESPACOS) || '[]')
    const nova = Array.isArray(lista) ? lista : []
    if (!nova.includes(espaco)) nova.push(espaco)
    localStorage.setItem(CHAVE_ESPACOS, JSON.stringify(nova))
  } catch {
    // sem cache, o dispositivo volta a adotar o remoto na próxima ligação
  }
}
