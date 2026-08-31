import { useMemo } from 'react'
import { CATEGORIAS, NOMES_CATEGORIAS, VERDE, VERMELHO } from '../estado.js'
import { formatarEuro, formatarPercentagem, novoId } from '../format.js'
import { totaisOrcamento } from '../calculos.js'
import { Barra, LinhaCalculada, ValorEditavel, ValorInput } from '../componentes.jsx'

export default function Orcamento({ nome, dados, onChange }) {
  const totais = useMemo(() => totaisOrcamento(dados), [dados])

  const atualizar = (alteracoes) => onChange({ ...dados, ...alteracoes })

  const atualizarItem = (lista, id, alteracoes) =>
    atualizar({
      [lista]: dados[lista].map((item) => (item.id === id ? { ...item, ...alteracoes } : item)),
    })

  const removerItem = (lista, id) =>
    atualizar({ [lista]: dados[lista].filter((item) => item.id !== id) })

  return (
    <>
      <section className="cartao">
        <p className="cartao__etiqueta">Conta corrente · {nome}</p>
        <div
          className="valor-grande"
          style={{ color: dados.contaCorrente < 0 ? VERMELHO : 'var(--texto)' }}
        >
          <ValorEditavel
            valor={dados.contaCorrente}
            onChange={(contaCorrente) => atualizar({ contaCorrente })}
            formatar={formatarEuro}
            ariaLabel={`Conta corrente de ${nome}`}
          />
        </div>
        <p className="nota">Ponto de partida do mês — toca no valor para editar.</p>
      </section>

      <section className="cartao">
        <div className="cartao__topo">
          <h2 className="cartao__titulo">Rendimentos</h2>
          <span className="cartao__total" style={{ color: VERDE }}>
            {formatarEuro(totais.rendimentos)}
          </span>
        </div>

        {dados.rendimentos.length === 0 && <p className="vazio">Sem rendimentos registados.</p>}

        {dados.rendimentos.map((item) => (
          <div className="linha linha--rendimento" key={item.id}>
            <input
              className="campo"
              type="text"
              aria-label="Descrição do rendimento"
              placeholder="Descrição"
              value={item.descricao}
              onChange={(e) => atualizarItem('rendimentos', item.id, { descricao: e.target.value })}
            />
            <ValorInput
              valor={item.valor}
              ariaLabel="Valor do rendimento"
              onChange={(valor) => atualizarItem('rendimentos', item.id, { valor })}
            />
            <button
              className="btn-remover"
              type="button"
              aria-label={`Remover ${item.descricao || 'rendimento'}`}
              onClick={() => removerItem('rendimentos', item.id)}
            >
              ×
            </button>
          </div>
        ))}

        <button
          className="btn-adicionar"
          type="button"
          onClick={() =>
            atualizar({
              rendimentos: [...dados.rendimentos, { id: novoId(), descricao: '', valor: 0 }],
            })
          }
        >
          + Adicionar rendimento
        </button>
      </section>

      <section className="cartao">
        <div className="cartao__topo">
          <h2 className="cartao__titulo">Despesas</h2>
          <span className="cartao__total" style={{ color: VERMELHO }}>
            {formatarEuro(totais.despesas)}
          </span>
        </div>

        {dados.despesas.length === 0 && <p className="vazio">Sem despesas registadas.</p>}

        {dados.despesas.map((item) => (
          <div className="linha linha--despesa" key={item.id}>
            <span
              className="linha__cor"
              style={{ background: CATEGORIAS[item.categoria] || CATEGORIAS.Outro }}
            />
            <input
              className="campo campo--descricao"
              type="text"
              aria-label="Descrição da despesa"
              placeholder="Descrição"
              value={item.descricao}
              onChange={(e) => atualizarItem('despesas', item.id, { descricao: e.target.value })}
            />
            <select
              className="campo campo--seletor"
              aria-label="Categoria da despesa"
              value={item.categoria}
              style={{ color: CATEGORIAS[item.categoria] || CATEGORIAS.Outro }}
              onChange={(e) => atualizarItem('despesas', item.id, { categoria: e.target.value })}
            >
              {NOMES_CATEGORIAS.map((cat) => (
                <option key={cat} value={cat} style={{ color: '#F9FAFB' }}>
                  {cat}
                </option>
              ))}
            </select>
            <ValorInput
              valor={item.valor}
              ariaLabel="Valor da despesa"
              onChange={(valor) => atualizarItem('despesas', item.id, { valor })}
            />
            <button
              className="btn-remover"
              type="button"
              aria-label={`Remover ${item.descricao || 'despesa'}`}
              onClick={() => removerItem('despesas', item.id)}
            >
              ×
            </button>
          </div>
        ))}

        <button
          className="btn-adicionar"
          type="button"
          onClick={() =>
            atualizar({
              despesas: [
                ...dados.despesas,
                { id: novoId(), descricao: '', valor: 0, categoria: 'Outro' },
              ],
            })
          }
        >
          + Adicionar despesa
        </button>

        <div className="categorias">
          {NOMES_CATEGORIAS.map((cat) => (
            <span className="categoria" key={cat}>
              <span className="categoria__ponto" style={{ background: CATEGORIAS[cat] }} />
              {cat}
              <span className="categoria__valor">{formatarEuro(totais.porCategoria[cat])}</span>
            </span>
          ))}
        </div>
      </section>

      <section className="cartao">
        <p className="cartao__etiqueta">Estimativa fim do mês</p>
        <div className="valor-grande" style={{ color: totais.estimativa < 0 ? VERMELHO : VERDE }}>
          {formatarEuro(totais.estimativa)}
        </div>

        <hr className="separador" />

        <LinhaCalculada label="Conta corrente" valor={formatarEuro(dados.contaCorrente)} />
        <LinhaCalculada
          label="+ Rendimentos"
          valor={formatarEuro(totais.rendimentos)}
          cor={VERDE}
        />
        <LinhaCalculada label="− Despesas" valor={formatarEuro(totais.despesas)} cor={VERMELHO} />

        <hr className="separador" />

        <LinhaCalculada
          label="Sobra no mês"
          valor={formatarEuro(totais.sobra)}
          cor={totais.sobra < 0 ? VERMELHO : VERDE}
        />
        <div className="linha-dados">
          <span className="linha-dados__label">Taxa de poupança</span>
          <span
            className="linha-dados__valor"
            style={{ color: totais.taxaPoupanca < 0 ? VERMELHO : VERDE }}
          >
            {formatarPercentagem(totais.taxaPoupanca)}
          </span>
        </div>
        <Barra
          percentagem={totais.taxaPoupanca < 0 ? 100 : totais.taxaPoupanca}
          cor={totais.taxaPoupanca < 0 ? VERMELHO : VERDE}
        />
        <p className="nota">
          Percentagem dos rendimentos que sobra no fim do mês depois das despesas.
        </p>
      </section>
    </>
  )
}
