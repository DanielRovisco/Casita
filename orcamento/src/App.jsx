import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ABAS } from './estado.js'
import { mesDe } from './calculos.js'
import { useAgora } from './useAgora.js'
import { achatar, estampar, reconstruir } from './sync/registos.js'
import { carregarLocal, guardarLocal } from './sync/armazenamento.js'
import { useSync } from './sync/useSync.js'
import Dashboard from './tabs/Dashboard.jsx'
import Casa from './tabs/Casa.jsx'
import Carro from './tabs/Carro.jsx'
import Orcamento from './tabs/Orcamento.jsx'
import Sincronizacao, { estadoDaSync } from './tabs/Sincronizacao.jsx'

export default function App() {
  const [{ aba, registos }, setLocal] = useState(carregarLocal)
  const [painelSync, setPainelSync] = useState(false)
  const agora = useAgora()

  const estado = useMemo(() => reconstruir(registos), [registos])
  const estadoRef = useRef(estado)
  estadoRef.current = estado

  useEffect(() => {
    guardarLocal({ aba, registos })
  }, [aba, registos])

  const aplicarRemoto = useCallback((novos) => {
    setLocal((anterior) => ({ ...anterior, registos: novos }))
  }, [])

  const sync = useSync({ registos, aplicarRemoto })
  const etiqueta = estadoDaSync(sync.situacao)

  /** Carimba só os campos que mudaram — é isso que permite fundir por campo. */
  const definirVarios = (alteracoes) => {
    const seguinte = { ...estadoRef.current, ...alteracoes }
    setLocal((anterior) => ({
      ...anterior,
      registos: estampar(anterior.registos, achatar(seguinte), Date.now()),
    }))
  }

  const definir = (chave, valor) => definirVarios({ [chave]: valor })

  /** Apagar uma categoria não pode deixar despesas órfãs. */
  const removerCategoria = (id) => {
    const atual = estadoRef.current
    const restantes = atual.categorias.filter((c) => c.id !== id)
    if (restantes.length === 0) return

    const reserva = restantes[restantes.length - 1].id
    const remapear = (pessoa) => ({
      ...pessoa,
      despesas: pessoa.despesas.map((d) => (d.categoria === id ? { ...d, categoria: reserva } : d)),
    })

    definirVarios({
      categorias: restantes,
      daniel: remapear(atual.daniel),
      camila: remapear(atual.camila),
    })
  }

  const abrirAba = (novaAba) => {
    setPainelSync(false)
    setLocal((anterior) => ({ ...anterior, aba: novaAba }))
    window.scrollTo({ top: 0 })
  }

  /**
   * Virar o mês: as recorrentes ficam com os vistos limpos, as pontuais
   * saem. É determinístico, por isso dois dispositivos a virar o mesmo mês
   * chegam ao mesmo resultado e a fusão não tem nada que decidir.
   */
  useEffect(() => {
    const mes = mesDe(agora)
    const guardado = estadoRef.current.mes.atual

    if (!guardado) {
      definir('mes', { atual: mes })
      return
    }
    if (mes <= guardado) return

    const limpar = (pessoa) => ({
      ...pessoa,
      rendimentos: pessoa.rendimentos
        .filter((r) => r.recorrente)
        .map((r) => ({ ...r, confirmado: false })),
      despesas: pessoa.despesas
        .filter((d) => d.recorrente)
        .map((d) => ({ ...d, confirmado: false })),
    })

    definirVarios({
      mes: { atual: mes },
      daniel: limpar(estadoRef.current.daniel),
      camila: limpar(estadoRef.current.camila),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agora, estado.mes.atual])

  return (
    <div className="app">
      <header className="cabecalho">
        <div className="cabecalho__topo">
          <h1 className="cabecalho__titulo">Casita</h1>
          <button
            className="chip-sync"
            type="button"
            aria-label={`Sincronização: ${etiqueta.texto}`}
            onClick={() => setPainelSync((v) => !v)}
          >
            <span className="ponto" style={{ background: etiqueta.cor }} />
            {sync.ligado ? 'Nuvem' : 'Local'}
          </button>
        </div>

        <nav className="abas" aria-label="Secções">
          {ABAS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`aba ${!painelSync && aba === tab.id ? 'aba--ativa' : ''}`}
              aria-current={!painelSync && aba === tab.id ? 'page' : undefined}
              onClick={() => abrirAba(tab.id)}
            >
              {tab.nome}
            </button>
          ))}
        </nav>
      </header>

      <main className="conteudo">
        {painelSync && <Sincronizacao sync={sync} onFechar={() => setPainelSync(false)} />}

        {!painelSync && aba === 'dashboard' && <Dashboard estado={estado} onAbrirAba={abrirAba} />}
        {!painelSync && aba === 'casa' && (
          <Casa dados={estado.casa} onChange={(casa) => definir('casa', casa)} />
        )}
        {!painelSync && aba === 'carro' && (
          <Carro dados={estado.carro} onChange={(carro) => definir('carro', carro)} />
        )}
        {!painelSync && aba === 'daniel' && (
          <Orcamento
            nome="Daniel"
            dados={estado.daniel}
            categorias={estado.categorias}
            mes={agora}
            onChange={(daniel) => definir('daniel', daniel)}
            onChangeCategorias={(categorias) => definir('categorias', categorias)}
            onRemoverCategoria={removerCategoria}
          />
        )}
        {!painelSync && aba === 'camila' && (
          <Orcamento
            nome="Camila"
            dados={estado.camila}
            categorias={estado.categorias}
            mes={agora}
            onChange={(camila) => definir('camila', camila)}
            onChangeCategorias={(categorias) => definir('categorias', categorias)}
            onRemoverCategoria={removerCategoria}
          />
        )}
      </main>

      <footer className="rodape">
        {sync.ligado
          ? 'Sincronizado campo a campo entre dispositivos.'
          : 'Guardado só neste dispositivo — liga a sincronização em Local.'}
      </footer>
    </div>
  )
}
