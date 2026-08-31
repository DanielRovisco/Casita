import { useEffect, useState } from 'react'
import { ABAS, carregarEstado, guardarEstado } from './estado.js'
import Dashboard from './tabs/Dashboard.jsx'
import Casa from './tabs/Casa.jsx'
import Carro from './tabs/Carro.jsx'
import Orcamento from './tabs/Orcamento.jsx'

export default function App() {
  const [estado, setEstado] = useState(carregarEstado)

  useEffect(() => {
    guardarEstado(estado)
  }, [estado])

  const definir = (chave, valor) => setEstado((anterior) => ({ ...anterior, [chave]: valor }))
  const abrirAba = (aba) => {
    definir('aba', aba)
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="app">
      <header className="cabecalho">
        <h1 className="cabecalho__titulo">Casita</h1>
        <nav className="abas" aria-label="Secções">
          {ABAS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`aba ${estado.aba === tab.id ? 'aba--ativa' : ''}`}
              aria-current={estado.aba === tab.id ? 'page' : undefined}
              onClick={() => abrirAba(tab.id)}
            >
              {tab.nome}
            </button>
          ))}
        </nav>
      </header>

      <main className="conteudo">
        {estado.aba === 'dashboard' && <Dashboard estado={estado} onAbrirAba={abrirAba} />}
        {estado.aba === 'casa' && (
          <Casa dados={estado.casa} onChange={(casa) => definir('casa', casa)} />
        )}
        {estado.aba === 'carro' && (
          <Carro dados={estado.carro} onChange={(carro) => definir('carro', carro)} />
        )}
        {estado.aba === 'daniel' && (
          <Orcamento
            nome="Daniel"
            dados={estado.daniel}
            onChange={(daniel) => definir('daniel', daniel)}
          />
        )}
        {estado.aba === 'camila' && (
          <Orcamento
            nome="Camila"
            dados={estado.camila}
            onChange={(camila) => definir('camila', camila)}
          />
        )}
      </main>

      <footer className="rodape">Guardado automaticamente neste dispositivo.</footer>
    </div>
  )
}
