import { useCallback, useEffect, useRef, useState } from 'react'
import { cifrar, decifrar, idDoEspaco, temCripto } from './cripto.js'
import { escreverRemoto, lerRemoto } from './firestore.js'
import { carregarConfig, configCompleta, guardarConfig, apagarConfig, CONFIG_VAZIA } from './config.js'

const ATRASO_ENVIO = 1200 // espera a que pares de escrever antes de enviar
const INTERVALO_LEITURA = 20000 // procura alterações de outros dispositivos

/**
 * Mantém o estado igual em todos os dispositivos que usem o mesmo código.
 * O que vence é sempre a versão com o carimbo `atualizado` mais recente.
 */
export function useSync({ estado, aplicarRemoto, partes }) {
  const [config, setConfig] = useState(carregarConfig)
  const [situacao, setSituacao] = useState('desligado')
  const [erro, setErro] = useState('')
  const [ultimaSync, setUltimaSync] = useState(null)
  const [espaco, setEspaco] = useState('')
  const [espacoNovo, setEspacoNovo] = useState(false)

  const estadoRef = useRef(estado)
  estadoRef.current = estado

  const enviadoRef = useRef(0)
  const temporizadorRef = useRef(null)
  const ligado = configCompleta(config) && temCripto()

  const dadosDe = useCallback(
    (fonte) => Object.fromEntries(partes.map((p) => [p, fonte[p]])),
    [partes]
  )

  const puxar = useCallback(
    async ({ silencioso = false } = {}) => {
      if (!ligado) return
      if (!silencioso) setSituacao('a-sincronizar')
      try {
        const id = await idDoEspaco(config.codigo)
        setEspaco(id.slice(1, 7))
        const remoto = await lerRemoto(config, id)
        const local = estadoRef.current
        setEspacoNovo(!remoto)

        if (remoto && remoto.atualizado > (local.atualizado || 0)) {
          const dados = await decifrar(config.codigo, remoto.conteudo)
          aplicarRemoto({ ...dadosDe(dados), atualizado: remoto.atualizado })
          enviadoRef.current = remoto.atualizado
        } else if (!remoto || remoto.atualizado < (local.atualizado || 0)) {
          const carimbo = local.atualizado || Date.now()
          const conteudo = await cifrar(config.codigo, dadosDe(local))
          await escreverRemoto(config, id, conteudo, carimbo)
          enviadoRef.current = carimbo
        } else {
          enviadoRef.current = remoto.atualizado
        }

        setErro('')
        setSituacao('ok')
        setUltimaSync(Date.now())
      } catch (e) {
        setErro(mensagemDeErro(e))
        setSituacao('erro')
      }
    },
    [config, ligado, aplicarRemoto, dadosDe]
  )

  const empurrar = useCallback(async () => {
    if (!ligado) return
    const local = estadoRef.current
    const carimbo = local.atualizado || Date.now()
    setSituacao('a-sincronizar')
    try {
      const id = await idDoEspaco(config.codigo)
      const conteudo = await cifrar(config.codigo, dadosDe(local))
      await escreverRemoto(config, id, conteudo, carimbo)
      enviadoRef.current = carimbo
      setErro('')
      setSituacao('ok')
      setUltimaSync(Date.now())
    } catch (e) {
      setErro(mensagemDeErro(e))
      setSituacao('erro')
    }
  }, [config, ligado, dadosDe])

  // Primeira ligação e mudanças de configuração.
  useEffect(() => {
    if (!ligado) {
      setSituacao(configCompleta(config) && !temCripto() ? 'sem-cripto' : 'desligado')
      return
    }
    puxar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ligado, config.projectId, config.apiKey, config.codigo])

  // Envia as alterações locais, agrupadas.
  useEffect(() => {
    if (!ligado) return undefined
    const carimbo = estado.atualizado || 0
    if (carimbo <= enviadoRef.current) return undefined

    clearTimeout(temporizadorRef.current)
    temporizadorRef.current = setTimeout(empurrar, ATRASO_ENVIO)
    return () => clearTimeout(temporizadorRef.current)
  }, [estado.atualizado, ligado, empurrar])

  // Procura alterações de outros dispositivos.
  useEffect(() => {
    if (!ligado) return undefined

    const relogio = setInterval(() => puxar({ silencioso: true }), INTERVALO_LEITURA)
    const aoVoltar = () => {
      if (document.visibilityState === 'visible') puxar({ silencioso: true })
    }
    document.addEventListener('visibilitychange', aoVoltar)
    window.addEventListener('online', aoVoltar)

    return () => {
      clearInterval(relogio)
      document.removeEventListener('visibilitychange', aoVoltar)
      window.removeEventListener('online', aoVoltar)
    }
  }, [ligado, puxar])

  const gravarConfig = useCallback((nova) => {
    const limpa = {
      projectId: nova.projectId.trim(),
      apiKey: nova.apiKey.trim(),
      codigo: nova.codigo.trim(),
    }
    enviadoRef.current = 0
    guardarConfig(limpa)
    setConfig(limpa)
    setErro('')
  }, [])

  const desligar = useCallback(() => {
    clearTimeout(temporizadorRef.current)
    enviadoRef.current = 0
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
    sincronizarAgora: puxar,
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
    return 'O Firestore recusou o acesso — falta publicar as regras de segurança.'
  }
  if (/NOT_FOUND|does not exist/i.test(texto)) {
    return 'Projeto ou base de dados não encontrada. Confirma o Project ID e cria a base Firestore.'
  }
  return texto
}
