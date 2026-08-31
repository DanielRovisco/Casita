import { useEffect, useMemo, useRef, useState } from 'react'

const CHAVE_STORAGE = 'orcamento-mensal-v1'

const CATEGORIAS = {
  Poupança: '#3B82F6',
  Essencial: '#10B981',
  Lazer: '#F59E0B',
  Outro: '#6B7280',
}

const NOMES_CATEGORIAS = Object.keys(CATEGORIAS)

const VERDE = '#10B981'
const VERMELHO = '#EF4444'

const ESTADO_INICIAL = {
  contaCorrente: 0,
  rendimentos: [{ id: 'r1', descricao: 'Ordenado', valor: 850 }],
  despesas: [
    { id: 'd1', descricao: 'Poupança casa', valor: 500, categoria: 'Poupança' },
    { id: 'd2', descricao: 'Poupança carro', valor: 100, categoria: 'Poupança' },
    { id: 'd3', descricao: 'Alimentação', valor: 150, categoria: 'Essencial' },
  ],
}

const formatadorEuro = new Intl.NumberFormat('pt-PT', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function formatarEuro(valor) {
  return formatadorEuro.format(Number.isFinite(valor) ? valor : 0)
}

function formatarNumero(valor) {
  return new Intl.NumberFormat('pt-PT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(valor) ? valor : 0)
}

// Aceita "1234,56", "1.234,56" e também "1234.56"
function parseValor(texto) {
  if (typeof texto === 'number') return texto
  const limpo = String(texto).replace(/[^\d,.-]/g, '')
  if (limpo === '' || limpo === '-') return 0
  let normalizado = limpo
  if (limpo.includes(',')) {
    normalizado = limpo.replace(/\./g, '').replace(',', '.')
  }
  const numero = parseFloat(normalizado)
  return Number.isFinite(numero) ? numero : 0
}

function novoId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function carregarEstado() {
  try {
    const guardado = localStorage.getItem(CHAVE_STORAGE)
    if (!guardado) return ESTADO_INICIAL
    const dados = JSON.parse(guardado)
    return {
      contaCorrente: Number(dados.contaCorrente) || 0,
      rendimentos: Array.isArray(dados.rendimentos)
        ? dados.rendimentos.map((r) => ({
            id: r.id || novoId(),
            descricao: String(r.descricao ?? ''),
            valor: Number(r.valor) || 0,
          }))
        : ESTADO_INICIAL.rendimentos,
      despesas: Array.isArray(dados.despesas)
        ? dados.despesas.map((d) => ({
            id: d.id || novoId(),
            descricao: String(d.descricao ?? ''),
            valor: Number(d.valor) || 0,
            categoria: NOMES_CATEGORIAS.includes(d.categoria) ? d.categoria : 'Outro',
          }))
        : ESTADO_INICIAL.despesas,
    }
  } catch {
    return ESTADO_INICIAL
  }
}

/** Input de valor que mantém o texto em edição (permite escrever "12,"). */
function ValorInput({ valor, onChange, className = '', ariaLabel }) {
  const [rascunho, setRascunho] = useState(null)

  return (
    <input
      className={`input input--valor ${className}`}
      type="text"
      inputMode="decimal"
      aria-label={ariaLabel}
      value={rascunho ?? formatarNumero(valor)}
      onChange={(e) => {
        setRascunho(e.target.value)
        onChange(parseValor(e.target.value))
      }}
      onFocus={(e) => {
        setRascunho(valor === 0 ? '' : formatarNumero(valor))
        requestAnimationFrame(() => e.target.select())
      }}
      onBlur={() => setRascunho(null)}
    />
  )
}

function ContaCorrenteCard({ valor, onChange }) {
  const [aEditar, setAEditar] = useState(false)
  const inputRef = useRef(null)
  const [rascunho, setRascunho] = useState('')

  useEffect(() => {
    if (aEditar && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [aEditar])

  function terminar() {
    onChange(parseValor(rascunho))
    setAEditar(false)
  }

  return (
    <section className="card">
      <p className="card__label">Conta corrente</p>
      {aEditar ? (
        <input
          ref={inputRef}
          className="input input--big input--valor"
          type="text"
          inputMode="decimal"
          aria-label="Valor da conta corrente"
          value={rascunho}
          onChange={(e) => setRascunho(e.target.value)}
          onBlur={terminar}
          onKeyDown={(e) => {
            if (e.key === 'Enter') terminar()
            if (e.key === 'Escape') setAEditar(false)
          }}
        />
      ) : (
        <div
          className="big-value editable"
          role="button"
          tabIndex={0}
          style={{ color: valor < 0 ? VERMELHO : 'var(--text)', display: 'inline-block' }}
          onClick={() => {
            setRascunho(valor === 0 ? '' : formatarNumero(valor))
            setAEditar(true)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setRascunho(valor === 0 ? '' : formatarNumero(valor))
              setAEditar(true)
            }
          }}
        >
          {formatarEuro(valor)}
        </div>
      )}
      <p className="hint">Ponto de partida do mês — clica no valor para editar.</p>
    </section>
  )
}

function Rendimentos({ itens, total, onAtualizar, onAdicionar, onRemover }) {
  return (
    <section className="card">
      <div className="card__header">
        <h2 className="card__title">Rendimentos</h2>
        <span className="card__total" style={{ color: VERDE }}>
          {formatarEuro(total)}
        </span>
      </div>

      {itens.length === 0 && <p className="vazio">Sem rendimentos registados.</p>}

      {itens.map((item) => (
        <div className="linha" key={item.id}>
          <input
            className="input"
            type="text"
            aria-label="Descrição do rendimento"
            placeholder="Descrição"
            value={item.descricao}
            onChange={(e) => onAtualizar(item.id, { descricao: e.target.value })}
          />
          <ValorInput
            valor={item.valor}
            ariaLabel="Valor do rendimento"
            onChange={(valor) => onAtualizar(item.id, { valor })}
          />
          <button
            className="btn-remover"
            type="button"
            title="Remover rendimento"
            aria-label={`Remover ${item.descricao || 'rendimento'}`}
            onClick={() => onRemover(item.id)}
          >
            ×
          </button>
        </div>
      ))}

      <button className="btn-adicionar" type="button" onClick={onAdicionar}>
        + Adicionar rendimento
      </button>
    </section>
  )
}

function Despesas({ itens, total, totaisPorCategoria, onAtualizar, onAdicionar, onRemover }) {
  return (
    <section className="card">
      <div className="card__header">
        <h2 className="card__title">Despesas</h2>
        <span className="card__total" style={{ color: VERMELHO }}>
          {formatarEuro(total)}
        </span>
      </div>

      {itens.length === 0 && <p className="vazio">Sem despesas registadas.</p>}

      {itens.map((item) => (
        <div className="linha linha--despesa" key={item.id}>
          <span
            className="linha__cor"
            style={{ background: CATEGORIAS[item.categoria] || CATEGORIAS.Outro }}
          />
          <input
            className="input"
            type="text"
            aria-label="Descrição da despesa"
            placeholder="Descrição"
            value={item.descricao}
            onChange={(e) => onAtualizar(item.id, { descricao: e.target.value })}
          />
          <select
            className="select"
            aria-label="Categoria da despesa"
            value={item.categoria}
            onChange={(e) => onAtualizar(item.id, { categoria: e.target.value })}
            style={{ color: CATEGORIAS[item.categoria] || CATEGORIAS.Outro }}
          >
            {NOMES_CATEGORIAS.map((nome) => (
              <option key={nome} value={nome} style={{ color: '#F9FAFB' }}>
                {nome}
              </option>
            ))}
          </select>
          <ValorInput
            valor={item.valor}
            ariaLabel="Valor da despesa"
            onChange={(valor) => onAtualizar(item.id, { valor })}
          />
          <button
            className="btn-remover"
            type="button"
            title="Remover despesa"
            aria-label={`Remover ${item.descricao || 'despesa'}`}
            onClick={() => onRemover(item.id)}
          >
            ×
          </button>
        </div>
      ))}

      <button className="btn-adicionar" type="button" onClick={onAdicionar}>
        + Adicionar despesa
      </button>

      <div className="categorias">
        {NOMES_CATEGORIAS.map((nome) => (
          <span className="categoria-resumo" key={nome}>
            <span className="categoria-resumo__ponto" style={{ background: CATEGORIAS[nome] }} />
            {nome}
            <span className="categoria-resumo__valor">
              {formatarEuro(totaisPorCategoria[nome] || 0)}
            </span>
          </span>
        ))}
      </div>
    </section>
  )
}

function Estimativa({ contaCorrente, totalRendimentos, totalDespesas, estimativa, taxaPoupanca }) {
  const cor = estimativa < 0 ? VERMELHO : VERDE
  const percentagem = Math.max(0, Math.min(100, taxaPoupanca))

  return (
    <section className="card">
      <p className="card__label">Estimativa fim do mês</p>
      <div className="big-value" style={{ color: cor }}>
        {formatarEuro(estimativa)}
      </div>

      <hr className="separador" />

      <div className="detalhe">
        <span>Conta corrente</span>
        <span className="detalhe__valor">{formatarEuro(contaCorrente)}</span>
      </div>
      <div className="detalhe">
        <span>+ Rendimentos</span>
        <span className="detalhe__valor" style={{ color: VERDE }}>
          {formatarEuro(totalRendimentos)}
        </span>
      </div>
      <div className="detalhe">
        <span>− Despesas</span>
        <span className="detalhe__valor" style={{ color: VERMELHO }}>
          {formatarEuro(totalDespesas)}
        </span>
      </div>

      <hr className="separador" />

      <div className="poupanca__linha">
        <span className="poupanca__label">Taxa de poupança</span>
        <span className="poupanca__valor" style={{ color: taxaPoupanca < 0 ? VERMELHO : VERDE }}>
          {formatarNumero(taxaPoupanca)}%
        </span>
      </div>
      <div className="barra">
        <div
          className="barra__fill"
          style={{
            width: `${taxaPoupanca < 0 ? 100 : percentagem}%`,
            background: taxaPoupanca < 0 ? VERMELHO : VERDE,
          }}
        />
      </div>
      <p className="hint">
        Percentagem dos rendimentos que sobra no fim do mês depois das despesas.
      </p>
    </section>
  )
}

export default function App() {
  const [estado, setEstado] = useState(carregarEstado)

  useEffect(() => {
    try {
      localStorage.setItem(CHAVE_STORAGE, JSON.stringify(estado))
    } catch {
      // localStorage indisponível (modo privado, quota cheia) — segue sem guardar
    }
  }, [estado])

  const totalRendimentos = useMemo(
    () => estado.rendimentos.reduce((soma, r) => soma + (Number(r.valor) || 0), 0),
    [estado.rendimentos]
  )

  const totalDespesas = useMemo(
    () => estado.despesas.reduce((soma, d) => soma + (Number(d.valor) || 0), 0),
    [estado.despesas]
  )

  const totaisPorCategoria = useMemo(() => {
    const totais = Object.fromEntries(NOMES_CATEGORIAS.map((nome) => [nome, 0]))
    for (const despesa of estado.despesas) {
      const categoria = NOMES_CATEGORIAS.includes(despesa.categoria) ? despesa.categoria : 'Outro'
      totais[categoria] += Number(despesa.valor) || 0
    }
    return totais
  }, [estado.despesas])

  const estimativa = estado.contaCorrente + totalRendimentos - totalDespesas
  const taxaPoupanca =
    totalRendimentos > 0 ? ((totalRendimentos - totalDespesas) / totalRendimentos) * 100 : 0

  function atualizarLista(chave, id, alteracoes) {
    setEstado((anterior) => ({
      ...anterior,
      [chave]: anterior[chave].map((item) => (item.id === id ? { ...item, ...alteracoes } : item)),
    }))
  }

  function removerDaLista(chave, id) {
    setEstado((anterior) => ({
      ...anterior,
      [chave]: anterior[chave].filter((item) => item.id !== id),
    }))
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Orçamento mensal</h1>
        <p className="app__subtitle">
          Guardado automaticamente neste dispositivo a cada alteração.
        </p>
      </header>

      <ContaCorrenteCard
        valor={estado.contaCorrente}
        onChange={(contaCorrente) => setEstado((anterior) => ({ ...anterior, contaCorrente }))}
      />

      <Rendimentos
        itens={estado.rendimentos}
        total={totalRendimentos}
        onAtualizar={(id, alteracoes) => atualizarLista('rendimentos', id, alteracoes)}
        onRemover={(id) => removerDaLista('rendimentos', id)}
        onAdicionar={() =>
          setEstado((anterior) => ({
            ...anterior,
            rendimentos: [...anterior.rendimentos, { id: novoId(), descricao: '', valor: 0 }],
          }))
        }
      />

      <Despesas
        itens={estado.despesas}
        total={totalDespesas}
        totaisPorCategoria={totaisPorCategoria}
        onAtualizar={(id, alteracoes) => atualizarLista('despesas', id, alteracoes)}
        onRemover={(id) => removerDaLista('despesas', id)}
        onAdicionar={() =>
          setEstado((anterior) => ({
            ...anterior,
            despesas: [
              ...anterior.despesas,
              { id: novoId(), descricao: '', valor: 0, categoria: 'Outro' },
            ],
          }))
        }
      />

      <Estimativa
        contaCorrente={estado.contaCorrente}
        totalRendimentos={totalRendimentos}
        totalDespesas={totalDespesas}
        estimativa={estimativa}
        taxaPoupanca={taxaPoupanca}
      />
    </div>
  )
}
