/**
 * Ligação ao Firebase, partilhada por todos os dispositivos.
 *
 * Estes dois valores NÃO são segredos: a config web do Firebase é pública
 * por definição e vai à mesma dentro do JavaScript do site. Quem protege os
 * dados é o código de acesso, que fica só nos vossos dispositivos — cifra o
 * conteúdo e decide o nome do documento onde ele é guardado.
 *
 * Preenche uma vez e nunca mais: com isto preenchido, o site passa a pedir
 * apenas o código de acesso. Se ficar vazio, o site pede os três valores.
 */
export const FIREBASE = {
  projectId: 'orcamentos-2069e',
  apiKey: 'AIzaSyBdO7aoRtUzccoItuIv4-XhOcP7izCzgEE',
}

export const temFirebaseNoCodigo = Boolean(FIREBASE.projectId && FIREBASE.apiKey)
