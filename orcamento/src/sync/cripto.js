/**
 * Cifra o estado no dispositivo antes de sair para a nuvem.
 * A palavra-passe nunca é enviada: dela derivam-se o identificador do
 * espaço (SHA-256) e a chave AES-GCM (PBKDF2). O serviço só vê texto cifrado.
 */

const codificador = new TextEncoder()
const descodificador = new TextDecoder()

const ITERACOES = 250000
const TAM_SALT = 16
const TAM_IV = 12

export const temCripto = () =>
  typeof crypto !== 'undefined' && !!crypto.subtle && typeof crypto.subtle.digest === 'function'

async function sha256Hex(texto) {
  const buf = await crypto.subtle.digest('SHA-256', codificador.encode(texto))
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Identificador do documento — derivado do código, nunca o código em si. */
export async function idDoEspaco(codigo) {
  const hash = await sha256Hex(`casita:espaco:${codigo}`)
  return `e${hash.slice(0, 31)}`
}

async function derivarChave(codigo, salt) {
  const base = await crypto.subtle.importKey('raw', codificador.encode(codigo), 'PBKDF2', false, [
    'deriveKey',
  ])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITERACOES, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

function paraBase64(bytes) {
  let binario = ''
  for (const b of bytes) binario += String.fromCharCode(b)
  return btoa(binario)
}

function deBase64(texto) {
  const binario = atob(texto)
  const bytes = new Uint8Array(binario.length)
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i)
  return bytes
}

export async function cifrar(codigo, objeto) {
  const salt = crypto.getRandomValues(new Uint8Array(TAM_SALT))
  const iv = crypto.getRandomValues(new Uint8Array(TAM_IV))
  const chave = await derivarChave(codigo, salt)
  const cifrado = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      chave,
      codificador.encode(JSON.stringify(objeto))
    )
  )

  const junto = new Uint8Array(salt.length + iv.length + cifrado.length)
  junto.set(salt, 0)
  junto.set(iv, salt.length)
  junto.set(cifrado, salt.length + iv.length)
  return paraBase64(junto)
}

export async function decifrar(codigo, texto) {
  const bytes = deBase64(texto)
  const salt = bytes.slice(0, TAM_SALT)
  const iv = bytes.slice(TAM_SALT, TAM_SALT + TAM_IV)
  const corpo = bytes.slice(TAM_SALT + TAM_IV)
  const chave = await derivarChave(codigo, salt)
  const claro = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, chave, corpo)
  return JSON.parse(descodificador.decode(claro))
}
