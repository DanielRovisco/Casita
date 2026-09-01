import { FIREBASE, temFirebaseNoCodigo } from '../firebase.js'

export const CHAVE_CONFIG = 'casita-sync'

const VAZIA = { projectId: '', apiKey: '', codigo: '' }

/** A ligação no código manda sempre — evita cópias antigas em dispositivos. */
const comLigacaoDoCodigo = (c) =>
  temFirebaseNoCodigo ? { ...c, projectId: FIREBASE.projectId, apiKey: FIREBASE.apiKey } : c

export const CONFIG_VAZIA = comLigacaoDoCodigo(VAZIA)

export const configCompleta = (c) =>
  Boolean(c && c.projectId.trim() && c.apiKey.trim() && c.codigo.trim())

/** Com a ligação no código, só falta o código de acesso. */
export const faltaSoOCodigo = temFirebaseNoCodigo

export function carregarConfig() {
  try {
    const guardado = localStorage.getItem(CHAVE_CONFIG)
    if (!guardado) return CONFIG_VAZIA
    const c = JSON.parse(guardado)
    return comLigacaoDoCodigo({
      projectId: String(c?.projectId ?? '').trim(),
      apiKey: String(c?.apiKey ?? '').trim(),
      codigo: String(c?.codigo ?? ''),
    })
  } catch {
    return CONFIG_VAZIA
  }
}

export function guardarConfig(config) {
  try {
    localStorage.setItem(CHAVE_CONFIG, JSON.stringify(config))
  } catch {
    // localStorage indisponível — a configuração não fica memorizada
  }
}

export function apagarConfig() {
  try {
    localStorage.removeItem(CHAVE_CONFIG)
  } catch {
    // nada a fazer
  }
}
