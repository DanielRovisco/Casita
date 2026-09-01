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
  }
}

export async function escreverRemoto(config, id, conteudo, atualizado) {
  const resposta = await fetch(url(config, id), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        conteudo: { stringValue: conteudo },
        atualizado: { integerValue: String(atualizado) },
      },
    }),
  })
  if (!resposta.ok) throw await erroDe(resposta)
}
