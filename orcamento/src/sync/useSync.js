import { useCallback, useEffect, useRef, useState } from 'react'
import { cifrar, decifrar, idDoEspaco, temCripto } from './cripto.js'
import { ConflitoDeEscrita, escreverRemoto, lerRemoto } from './firestore.js'
import { fundir } from './registos.js'
import { jaViuEspaco, marcarEspacoVisto } from './armazenamento.js'
import {
  CONFIG_VAZIA,
  apagarConfig,
  carregarConfig,
  configCompleta,
  guardarConfig,
} from './config.js'

const ATRASO_ENVIO = 1200 // agrupa escritas seguidas
const INTERVALO_LEITURA = 15000 // procura alterações do outro dispositivo
const TENTATIVAS = 4 // voltas em caso de conflito de escrita

const iguais = (a, b) => JSON.stringify(a) === JSON.stringify(b)

/**
 * Sincroniza os registos campo a campo. Cada volta lê o remoto, funde com
 * o local (vence o carimbo mais recente por campo) e só escreve se a versão
 * do documento não tiver mudado entretanto — se mudou, repete com o que há
 * de novo. Nenhuma escrita apaga a do outro.
 */
export function useSync({ registos, aplicarRemoto, aoSincronizar }) {
  const [config, setConfig] = useState(carregarConfig)
  const [situacao, setSituacao] = useState('desligado')
  const [erro, setErro] = useState('')
  const [ultimaSync, setUltimaSync] = useState(null)
  const [espaco, setEspaco] = useState('')
  const [espacoNovo, setEspacoNovo] = useState(false)

  const registosRef = useRef(registos)
  registosRef.current = registos

  const emCursoRef = useRef(false)
  const pendenteRef = useRef(false)
  const temporizadorRef = useRef(null)

  const ligado = configCompleta(config) && temCripto()

  const sincronizar = useCallback(async () => {
    if (!ligado) return
    if (emCursoRef.current) {
      pendenteRef.current = true
      return
    }

    emCursoRef.current = true
    setSituacao('a-sincronizar')

    try {
      const id = await idDoEspaco(config.codigo)
      setEspaco(id.slice(1, 7))

      for (let tentativa = 0; tentativa < TENTATIVAS; tentativa++) {
        const remoto = await lerRemoto(config, id)
        setEspacoNovo(!remoto)

        const locais = registosRef.current
        const remotos = remoto ? await decifrar(config.codigo, remoto.conteudo) : {}

        // Dispositivo novo neste espaço: adota o que lá está em vez de
        // fundir, senão os valores de arranque apareciam como itens a mais.
        const primeiraVez = Boolean(remoto) && !jaViuEspaco(id)
        const juntos = primeiraVez ? remotos : fundir(locais, remotos)

        if (!iguais(juntos, locais)) aplicarRemoto(juntos)

        if (iguais(juntos, remotos)) {
          marcarEspacoVisto(id)
          break
        }

        try {
          const conteudo = await cifrar(config.codigo, juntos)
          await escreverRemoto(config, id, conteudo, Date.now(), remoto ? remoto.versao : null)
          marcarEspacoVisto(id)
          break
        } catch (e) {
          // Outro dispositivo escreveu primeiro: lê outra vez e funde com o novo.
          if (!(e instanceof ConflitoDeEscrita) || tentativa === TENTATIVAS - 1) throw e
        }
      }

      setErro('')
      setSituacao('ok')
      setUltimaSync(Date.now())
      if (aoSincronizar) aoSincronizar()
    } catch (e) {
      setErro(mensagemDeErro(e))
      setSituacao('erro')
    } finally {
      emCursoRef.current = false
      if (pendenteRef.current) {
        pendenteRef.current = false
        setTimeout(sincronizar, 150)
      }
    }
  }, [config, ligado, aplicarRemoto, aoSincronizar])

  // Ligação inicial e mudanças de configuração.
  useEffect(() => {
    if (!ligado) {
      setSituacao(configCompleta(config) && !temCripto() ? 'sem-cripto' : 'desligado')
      return
    }
    sincronizar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ligado, config.projectId, config.apiKey, config.codigo])

  // Alterações locais, agrupadas.
  useEffect(() => {
    if (!ligado) return undefined
    clearTimeout(temporizadorRef.current)
    temporizadorRef.current = setTimeout(sincronizar, ATRASO_ENVIO)
    return () => clearTimeout(temporizadorRef.current)
  }, [registos, ligado, sincronizar])

  // Alterações do outro dispositivo.
  useEffect(() => {
    if (!ligado) return undefined

    const relogio = setInterval(sincronizar, INTERVALO_LEITURA)
    const aoVoltar = () => {
      if (document.visibilityState === 'visible') sincronizar()
    }
    document.addEventListener('visibilitychange', aoVoltar)
    window.addEventListener('online', aoVoltar)

    return () => {
      clearInterval(relogio)
      document.removeEventListener('visibilitychange', aoVoltar)
      window.removeEventListener('online', aoVoltar)
    }
  }, [ligado, sincronizar])

  const gravarConfig = useCallback((nova) => {
    const limpa = {
      projectId: nova.projectId.trim(),
      apiKey: nova.apiKey.trim(),
      codigo: nova.codigo.trim(),
    }
    guardarConfig(limpa)
    setConfig(limpa)
    setErro('')
  }, [])

  const desligar = useCallback(() => {
    clearTimeout(temporizadorRef.current)
    apagarConfig()
    setConfig(CONFIG_VAZIA)
    setErro('')
    setSituacao('desligado')
    setUltimaSync(null)
    setEspaco('')
    setEspacoNovo(false)
  }, [])

  return {
    config,
    gravarConfig,
    desligar,
    situacao,
    erro,
    ultimaSync,
    ligado,
    espaco,
    espacoNovo,
    sincronizarAgora: sincronizar,
  }
}

function mensagemDeErro(e) {
  const texto = String(e?.message || e)
  if (e?.name === 'OperationError' || /operation-specific reason|decrypt/i.test(texto)) {
    return 'Código de acesso errado — os dados na nuvem foram guardados com outro código.'
  }
  if (/Failed to fetch|NetworkError|Load failed/i.test(texto)) {
    return 'Sem ligação ao Firestore. As alterações ficam guardadas e seguem quando houver rede.'
  }
  if (/API key not valid|API_KEY/i.test(texto)) return 'API key inválida.'
  if (/PERMISSION_DENIED|Missing or insufficient permissions/i.test(texto)) {
    return 'O Firestore recusou o acesso — falta publicar as regras de segurança (as regras por omissão bloqueiam tudo).'
  }
  if (/NOT_FOUND|does not exist/i.test(texto)) {
    return 'Projeto ou base de dados não encontrada. Confirma o Project ID e cria a base Firestore.'
  }
  return texto
}
