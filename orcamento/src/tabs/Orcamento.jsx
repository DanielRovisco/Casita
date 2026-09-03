import { useMemo, useState } from 'react'
import { CORES_CATEGORIA, VERDE, VERMELHO } from '../estado.js'
import { formatarEuro, formatarPercentagem, novoId } from '../format.js'
import { nomeDoMes, totaisOrcamento } from '../calculos.js'
import { Barra, LinhaCalculada, ValorEditavel, ValorInput } from '../componentes.jsx'
import Donut from '../Donut.jsx'

/** Botão de "repete todos os meses". */
function BotaoRecorrente({ ativo, onClick, descricao }) {
  return (
    <button
      className={`btn-repetir ${ativo ? 'btn-repetir--ativo' : ''}`}
      type="button"
      aria-pressed={ativo}
      title={ativo ? 'Repete todos os meses' : 'Só este mês'}
      aria-label={`${descricao || 'Item'}: ${ativo ? 'repete todos os meses' : 'só este mês'}`}
      onClick={onClick}
    >
      ↻
    </button>
  )
}

export default function Orcamento({
  nome,
  dados,
  categorias,
  mes,
  onChange,
  onChangeCategorias,
  onRemoverCategoria,
}) {
  const totais = useMemo(() => totaisOrcamento(dados, categorias), [dados, categorias])
  const [gerirCategorias, setGerirCategorias] = useState(false)
  const [paletaAberta, setPaletaAberta] = useState(null)

  const corDe = (id) => categorias.find((c) => c.id === id)?.cor || '#6B7280'

  const atualizar = (alteracoes) => onChange({ ...dados, ...alteracoes })

  const atualizarItem = (lista, id, alteracoes) =>
    atualizar({
      [lista]: dados[lista].map((item) => (item.id === id ? { ...item, ...alteracoes } : item)),
    })

  const removerItem = (lista, id) =>
    atualizar({ [lista]: dados[lista].filter((item) => item.id !== id) })

  const comDespesas = totais.porCategoria.filter((c) => c.total > 0)

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
        <p className="nota">
          Ponto de partida de {nomeDoMes(mes)} — toca no valor para editar. No dia 1 as pontuais
          são apagadas e os vistos limpos; as marcadas com ↻ ficam.
        </p>
      </section>

      <section className="cartao">
        <div className="cartao__topo">
          <h2 className="cartao__titulo">Rendimentos</h2>
          <span className="cartao__total" style={{ color: VERDE }}>
            {formatarEuro(totais.rendimentos)}
          </span>
        </div>
        <p className="nota nota--topo">
          Recebido {formatarEuro(totais.rendimentosRecebidos)} de{' '}
          {formatarEuro(totais.rendimentos)} · fixo {formatarEuro(totais.rendimentosFixos)}
        </p>

        {dados.rendimentos.length === 0 && <p className="vazio">Sem rendimentos registados.</p>}

        {dados.rendimentos.map((item) => (
          <div className="linha linha--rendimento" key={item.id}>
            <input
              className="check"
              type="checkbox"
              style={{ accentColor: VERDE }}
              checked={item.confirmado}
              aria-label={`Marcar ${item.descricao || 'rendimento'} como recebido`}
              onChange={(e) => atualizarItem('rendimentos', item.id, { confirmado: e.target.checked })}
            />
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
            <BotaoRecorrente
              ativo={item.recorrente}
              descricao={item.descricao}
              onClick={() =>
                atualizarItem('rendimentos', item.id, { recorrente: !item.recorrente })
              }
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
              rendimentos: [
                ...dados.rendimentos,
                { id: novoId(), descricao: '', valor: 0, confirmado: false, recorrente: false },
              ],
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
        <p className="nota nota--topo">
          Gasto {formatarEuro(totais.despesasPagas)} de {formatarEuro(totais.despesas)} · fixo{' '}
          {formatarEuro(totais.despesasFixas)}
        </p>

        {dados.despesas.length === 0 && <p className="vazio">Sem despesas registadas.</p>}

        {dados.despesas.map((item) => (
          <div className="linha linha--despesa" key={item.id}>
            <input
              className="check"
              type="checkbox"
              style={{ accentColor: corDe(item.categoria) }}
              checked={item.confirmado}
              aria-label={`Marcar ${item.descricao || 'despesa'} como paga`}
              onChange={(e) => atualizarItem('despesas', item.id, { confirmado: e.target.checked })}
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
              style={{ color: corDe(item.categoria) }}
              onChange={(e) => atualizarItem('despesas', item.id, { categoria: e.target.value })}
            >
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id} style={{ color: '#F9FAFB' }}>
                  {cat.nome}
                </option>
              ))}
            </select>
            <ValorInput
              valor={item.valor}
              ariaLabel="Valor da despesa"
              onChange={(valor) => atualizarItem('despesas', item.id, { valor })}
            />
            <BotaoRecorrente
              ativo={item.recorrente}
              descricao={item.descricao}
              onClick={() => atualizarItem('despesas', item.id, { recorrente: !item.recorrente })}
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
                {
                  id: novoId(),
                  descricao: '',
                  valor: 0,
                  categoria: categorias[categorias.length - 1]?.id || 'outro',
                  confirmado: false,
                  recorrente: false,
                },
              ],
            })
          }
        >
          + Adicionar despesa
        </button>
      </section>

      <section className="cartao">
        <div className="cartao__topo">
          <h2 className="cartao__titulo">Categorias</h2>
          <button
            className="btn-texto"
            type="button"
            onClick={() => setGerirCategorias((v) => !v)}
          >
            {gerirCategorias ? 'Fechar' : 'Gerir'}
          </button>
        </div>

        {!gerirCategorias ? (
          <div className="categorias">
            {categorias.map((cat) => (
              <span className="categoria" key={cat.id}>
                <span className="categoria__ponto" style={{ background: cat.cor }} />
                {cat.nome}
              </span>
            ))}
          </div>
        ) : (
          <>
            {categorias.map((cat) => (
              <div key={cat.id}>
                <div className="linha linha--categoria">
                  <button
                    className="cor-atual"
                    type="button"
                    style={{ background: cat.cor }}
                    aria-label={`Mudar a cor de ${cat.nome}`}
                    onClick={() => setPaletaAberta(paletaAberta === cat.id ? null : cat.id)}
                  />
                  <input
                    className="campo"
                    type="text"
                    aria-label="Nome da categoria"
                    placeholder="Nome"
                    value={cat.nome}
                    onChange={(e) =>
                      onChangeCategorias(
                        categorias.map((c) => (c.id === cat.id ? { ...c, nome: e.target.value } : c))
                      )
                    }
                  />
                  <button
                    className="btn-remover"
                    type="button"
                    disabled={categorias.length <= 1}
                    aria-label={`Remover categoria ${cat.nome}`}
                    onClick={() => onRemoverCategoria(cat.id)}
                  >
                    ×
                  </button>
                </div>
                {paletaAberta === cat.id && (
                  <div className="paleta">
                    {CORES_CATEGORIA.map((cor) => (
                      <button
                        key={cor}
                        type="button"
                        className={`paleta__cor ${cat.cor === cor ? 'paleta__cor--ativa' : ''}`}
                        style={{ background: cor }}
                        aria-label={`Cor ${cor}`}
                        onClick={() => {
                          onChangeCategorias(
                            categorias.map((c) => (c.id === cat.id ? { ...c, cor } : c))
                          )
                          setPaletaAberta(null)
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}

            <button
              className="btn-adicionar"
              type="button"
              onClick={() =>
                onChangeCategorias([
                  ...categorias,
                  {
                    id: novoId(),
                    nome: '',
                    cor: CORES_CATEGORIA[categorias.length % CORES_CATEGORIA.length],
                  },
                ])
              }
            >
              + Nova categoria
            </button>
            <p className="nota">
              As categorias são as mesmas para ti e para a Camila. Ao apagar uma, as despesas dela
              passam para a última da lista.
            </p>
          </>
        )}
      </section>

      <section className="cartao">
        <p className="cartao__etiqueta">Estimativa fim do mês</p>

        <LinhaCalculada label="Conta corrente" valor={formatarEuro(dados.contaCorrente)} />
        <LinhaCalculada
          label="+ Rendimentos"
          valor={formatarEuro(totais.rendimentos)}
          cor={VERDE}
        />
        <LinhaCalculada label="− Despesas" valor={formatarEuro(totais.despesas)} cor={VERMELHO} />

        <hr className="separador" />

        <div className="valor-grande" style={{ color: totais.estimativa < 0 ? VERMELHO : VERDE }}>
          {formatarEuro(totais.estimativa)}
        </div>

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

      <section className="cartao">
        <div className="cartao__topo">
          <h2 className="cartao__titulo">Resumo por categoria</h2>
          <span className="cartao__total" style={{ color: VERMELHO }}>
            {formatarEuro(totais.despesas)}
          </span>
        </div>

        {comDespesas.length === 0 ? (
          <p className="vazio">Ainda não há despesas com valor para resumir.</p>
        ) : (
          <>
            <div className="resumo">
              <Donut itens={comDespesas} titulo={`Despesas de ${nome} por categoria`} />
              <ul className="resumo__lista">
                {comDespesas
                  .slice()
                  .sort((a, b) => b.total - a.total)
                  .map((cat) => (
                    <li className="resumo__linha" key={cat.id}>
                      <span className="categoria__ponto" style={{ background: cat.cor }} />
                      <span className="resumo__nome">{cat.nome}</span>
                      <span className="resumo__valor">{formatarEuro(cat.total)}</span>
                      <span className="resumo__fatia">{formatarPercentagem(cat.fatia, 0)}</span>
                    </li>
                  ))}
              </ul>
            </div>

            <hr className="separador" />

            <LinhaCalculada
              label="Já pago"
              nota={`de ${formatarEuro(totais.despesas)}`}
              valor={formatarEuro(totais.despesasPagas)}
              cor={VERMELHO}
            />
            <LinhaCalculada
              label="Já recebido"
              nota={`de ${formatarEuro(totais.rendimentos)}`}
              valor={formatarEuro(totais.rendimentosRecebidos)}
              cor={VERDE}
            />
            <LinhaCalculada
              label="Saldo real até agora"
              valor={formatarEuro(totais.realAteAgora)}
              cor={totais.realAteAgora < 0 ? VERMELHO : VERDE}
            />
            <LinhaCalculada
              label="Fixo por mês"
              nota="marcado com ↻"
              valor={formatarEuro(totais.despesasFixas)}
            />
            <p className="nota">
              Conta só o que está confirmado com o visto — o resto ainda é previsão.
            </p>
          </>
        )}
      </section>
    </>
  )
}
