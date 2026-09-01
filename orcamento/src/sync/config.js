export const CHAVE_CONFIG = 'casita-sync'

export const CONFIG_VAZIA = { projectId: '', apiKey: '', codigo: '' }

export const configCompleta = (c) =>
  Boolean(c && c.projectId.trim() && c.apiKey.trim() && c.codigo.trim())

export function carregarConfig() {
  try {
    const guardado = localStorage.getItem(CHAVE_CONFIG)
    if (!guardado) return CONFIG_VAZIA
    const c = JSON.parse(guardado)
    return {
      projectId: String(c?.projectId ?? '').trim(),
      apiKey: String(c?.apiKey ?? '').trim(),
      codigo: String(c?.codigo ?? ''),
    }
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
