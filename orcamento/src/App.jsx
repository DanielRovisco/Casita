import { useCallback, useEffect, useState } from 'react'
import { ABAS, PARTES_SINCRONIZADAS, carregarEstado, guardarEstado } from './estado.js'
import { useSync } from './sync/useSync.js'
import Dashboard from './tabs/Dashboard.jsx'
import Casa from './tabs/Casa.jsx'
import Carro from './tabs/Carro.jsx'
import Orcamento from './tabs/Orcamento.jsx'
import Sincronizacao, { estadoDaSync } from './tabs/Sincronizacao.jsx'

export default function App() {
  const [estado, setEstado] = useState(carregarEstado)
  const [painelSync, setPainelSync] = useState(false)

  // Cache local: arranque instantâneo e continua a funcionar sem rede.
  useEffect(() => {
    guardarEstado(estado)
  }, [estado])

  const aplicarRemoto = useCallback((dados) => {
    setEstado((anterior) => ({ ...anterior, ...dados }))
  }, [])

  const sync = useSync({ estado, aplicarRemoto, partes: PARTES_SINCRONIZADAS })
  const etiqueta = estadoDaSync(sync.situacao)

  // Qualquer alteração de dados carimba a hora — é ela que decide quem vence.
  const definir = (chave, valor) =>
    setEstado((anterior) => ({
      ...anterior,
      [chave]: valor,
      ...(chave === 'aba' ? {} : { atualizado: Date.now() }),
    }))

  const abrirAba = (aba) => {
    setPainelSync(false)
    definir('aba', aba)
    window.scrollTo({ top: 0 })
  }

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
              className={`aba ${!painelSync && estado.aba === tab.id ? 'aba--ativa' : ''}`}
              aria-current={!painelSync && estado.aba === tab.id ? 'page' : undefined}
              onClick={() => abrirAba(tab.id)}
            >
              {tab.nome}
            </button>
          ))}
        </nav>
      </header>

      <main className="conteudo">
        {painelSync && <Sincronizacao sync={sync} onFechar={() => setPainelSync(false)} />}

        {!painelSync && estado.aba === 'dashboard' && (
          <Dashboard estado={estado} onAbrirAba={abrirAba} />
        )}
        {!painelSync && estado.aba === 'casa' && (
          <Casa dados={estado.casa} onChange={(casa) => definir('casa', casa)} />
        )}
        {!painelSync && estado.aba === 'carro' && (
          <Carro dados={estado.carro} onChange={(carro) => definir('carro', carro)} />
        )}
        {!painelSync && estado.aba === 'daniel' && (
          <Orcamento
            nome="Daniel"
            dados={estado.daniel}
            onChange={(daniel) => definir('daniel', daniel)}
          />
        )}
        {!painelSync && estado.aba === 'camila' && (
          <Orcamento
            nome="Camila"
            dados={estado.camila}
            onChange={(camila) => definir('camila', camila)}
          />
        )}
      </main>

      <footer className="rodape">
        {sync.ligado
          ? 'Guardado na nuvem e sincronizado entre dispositivos.'
          : 'Guardado só neste dispositivo — liga a sincronização em Local.'}
      </footer>
    </div>
  )
}
