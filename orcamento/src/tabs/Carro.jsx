import { COR_CARRO, VERDE, VERMELHO } from '../estado.js'
import { formatarEuro, formatarNumero, formatarPercentagem } from '../format.js'
import { carroFimDoMes, diasAteFimDoMes, progresso } from '../calculos.js'
import { useAgora } from '../useAgora.js'
import { Barra, LinhaCalculada, LinhaEditavel, ValorEditavel } from '../componentes.jsx'

export default function Carro({ dados, onChange }) {
  const agora = useAgora()
  const atualizar = (alteracoes) => onChange({ ...dados, ...alteracoes })
  const pct = progresso(dados.valor, dados.objetivo)
  const falta = dados.objetivo - dados.valor
  const corGanho = dados.ganho3Meses < 0 ? VERMELHO : VERDE
  const fator = 1 + dados.retorno / 100
  const diasQueFaltam = diasAteFimDoMes(agora)

  return (
    <>
      <section className="cartao">
        <p className="cartao__etiqueta">Carro · investimento</p>
        <div className="valor-grande" style={{ color: COR_CARRO }}>
          <ValorEditavel
            valor={dados.valor}
            onChange={(valor) => atualizar({ valor })}
            formatar={formatarEuro}
            ariaLabel="Valor da carteira do carro"
          />
        </div>
        <p className="nota">Valor atual da carteira — toca no valor para atualizar.</p>

        <hr className="separador" />

        <LinhaCalculada
          label="Estimativa fim do mês"
          nota={diasQueFaltam === 1 ? 'falta 1 dia' : `faltam ${diasQueFaltam} dias`}
          valor={formatarEuro(carroFimDoMes(dados, agora))}
          cor={COR_CARRO}
        />
        <p className="nota">
          Projeção pela média dos últimos 3 meses, aplicada ao que falta do mês. Ao contrário dos
          juros da casa, isto não é garantido — o valor pode subir ou descer.
        </p>

        {pct !== null && (
          <>
            <hr className="separador" />
            <div className="linha-dados">
              <span className="linha-dados__label">Objetivo</span>
              <span className="linha-dados__valor">
                <ValorEditavel
                  valor={dados.objetivo}
                  onChange={(objetivo) => atualizar({ objetivo })}
                  formatar={formatarEuro}
                  ariaLabel="Objetivo do carro"
                />
              </span>
            </div>
            <Barra percentagem={pct} cor={COR_CARRO} />
            <div className="linha-dados">
              <span className="linha-dados__label">{falta > 0 ? 'Falta' : 'Excedente'}</span>
              <span
                className="linha-dados__valor"
                style={{ color: falta > 0 ? 'var(--texto)' : VERDE }}
              >
                {formatarEuro(Math.abs(falta))} · {formatarPercentagem(pct, 1)}
              </span>
            </div>
          </>
        )}

        {pct === null && (
          <>
            <hr className="separador" />
            <LinhaEditavel
              label="Objetivo (0 = sem objetivo)"
              valor={dados.objetivo}
              onChange={(objetivo) => atualizar({ objetivo })}
              formatar={formatarEuro}
            />
            <p className="nota">Define um objetivo para veres a barra de progresso.</p>
          </>
        )}
      </section>

      <section className="cartao">
        <div className="cartao__topo">
          <h2 className="cartao__titulo">Rendibilidade</h2>
          <span className="cartao__total" style={{ color: dados.retorno < 0 ? VERMELHO : VERDE }}>
            {dados.retorno >= 0 ? '↗' : '↘'} {formatarPercentagem(dados.retorno, 1)}
          </span>
        </div>

        <LinhaEditavel
          label="Taxa de retorno"
          valor={dados.retorno}
          onChange={(retorno) => atualizar({ retorno })}
          formatar={formatarNumero}
          sufixo="%"
          cor={dados.retorno < 0 ? VERMELHO : VERDE}
        />
        <LinhaEditavel
          label="Ganho últimos 3 meses"
          valor={dados.ganho3Meses}
          onChange={(ganho3Meses) => atualizar({ ganho3Meses })}
          formatar={formatarEuro}
          cor={corGanho}
        />

        <hr className="separador" />

        <LinhaCalculada
          label="Média mensal"
          nota="últimos 3 meses"
          valor={formatarEuro(dados.ganho3Meses / 3)}
          cor={corGanho}
        />
        <LinhaCalculada
          label="Capital investido"
          nota="estimado"
          valor={fator > 0 ? formatarEuro(dados.valor / fator) : '—'}
        />
        <p className="nota">Valores copiados da app de investimento — toca para atualizar.</p>
      </section>
    </>
  )
}
