/**
 * Acesso ao Firestore pela REST API — sem SDK, só fetch.
 * Guarda um único documento por espaço, com o conteúdo já cifrado.
 */

const url = (config, id) =>
  `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    config.projectId
  )}/databases/(default)/documents/casita/${encodeURIComponent(id)}?key=${encodeURIComponent(
    config.apiKey
  )}`

async function erroDe(resposta) {
  let detalhe = ''
  try {
    const corpo = await resposta.json()
    detalhe = corpo?.error?.message || ''
  } catch {
    // resposta sem JSON — fica só o código
  }
  return new Error(detalhe || `Erro ${resposta.status} do Firestore`)
}

export async function lerRemoto(config, id) {
  const resposta = await fetch(url(config, id), { cache: 'no-store' })
  if (resposta.status === 404) return null
  if (!resposta.ok) throw await erroDe(resposta)

  const doc = await resposta.json()
  const conteudo = doc?.fields?.conteudo?.stringValue
  if (!conteudo) return null

  return {
    conteudo,
    atualizado: Number(doc?.fields?.atualizado?.integerValue ?? 0) || 0,
    // Carimbo do servidor: serve de condição na escrita seguinte.
    versao: doc?.updateTime || null,
  }
}

export class ConflitoDeEscrita extends Error {
  constructor() {
    super('O documento mudou entretanto')
    this.name = 'ConflitoDeEscrita'
  }
}

/**
 * Escreve com condição: só grava se o documento ainda estiver na versão
 * que lemos. Se outro dispositivo escreveu no entretanto, falha e quem
 * chamou volta a ler e a fundir, em vez de escrever por cima.
 */
export async function escreverRemoto(config, id, conteudo, atualizado, versao) {
  const condicao =
    versao === null
      ? '&currentDocument.exists=false'
      : `&currentDocument.updateTime=${encodeURIComponent(versao)}`

  const resposta = await fetch(url(config, id) + condicao, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        conteudo: { stringValue: conteudo },
        atualizado: { integerValue: String(atualizado) },
      },
    }),
  })
  if (resposta.status === 409 || resposta.status === 412) throw new ConflitoDeEscrita()
  if (!resposta.ok) {
    const erro = await erroDe(resposta)
    if (/FAILED_PRECONDITION|ALREADY_EXISTS|too old|does not match/i.test(erro.message)) {
      throw new ConflitoDeEscrita()
    }
    throw erro
  }
}
