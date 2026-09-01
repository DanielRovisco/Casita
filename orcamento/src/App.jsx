import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ABAS } from './estado.js'
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
  const definir = (chave, valor) => {
    const seguinte = { ...estadoRef.current, [chave]: valor }
    setLocal((anterior) => ({
      ...anterior,
      registos: estampar(anterior.registos, achatar(seguinte), Date.now()),
    }))
  }

  const abrirAba = (novaAba) => {
    setPainelSync(false)
    setLocal((anterior) => ({ ...anterior, aba: novaAba }))
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
            onChange={(daniel) => definir('daniel', daniel)}
          />
        )}
        {!painelSync && aba === 'camila' && (
          <Orcamento
            nome="Camila"
            dados={estado.camila}
            onChange={(camila) => definir('camila', camila)}
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
