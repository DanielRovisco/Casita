import { COR_CASA, VERDE, VERMELHO } from '../estado.js'
import { formatarEuro, formatarNumero, formatarPercentagem } from '../format.js'
import { juroAnual, juroDiario, juroMensal, progresso } from '../calculos.js'
import { Barra, LinhaCalculada, LinhaEditavel, ValorEditavel } from '../componentes.jsx'

export default function Casa({ dados, onChange }) {
  const atualizar = (alteracoes) => onChange({ ...dados, ...alteracoes })
  const pct = progresso(dados.saldo, dados.objetivo)
  const falta = dados.objetivo - dados.saldo

  return (
    <>
      <section className="cartao">
        <p className="cartao__etiqueta">Casa · poupança</p>
        <div className="valor-grande" style={{ color: COR_CASA }}>
          <ValorEditavel
            valor={dados.saldo}
            onChange={(saldo) => atualizar({ saldo })}
            formatar={formatarEuro}
            ariaLabel="Saldo da poupança da casa"
          />
        </div>
        <p className="nota">Saldo atual — toca no valor para atualizar.</p>

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
                  ariaLabel="Objetivo da casa"
                />
              </span>
            </div>
            <Barra percentagem={pct} cor={COR_CASA} />
            <div className="linha-dados">
              <span className="linha-dados__label">
                {falta > 0 ? 'Falta' : 'Excedente'}
              </span>
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
          </>
        )}
      </section>

      <section className="cartao">
        <div className="cartao__topo">
          <h2 className="cartao__titulo">Juros</h2>
          <span className="cartao__total" style={{ color: VERDE }}>
            {formatarPercentagem(dados.taxaAnual)} APY
          </span>
        </div>

        <LinhaEditavel
          label="Taxa anual (APY)"
          valor={dados.taxaAnual}
          onChange={(taxaAnual) => atualizar({ taxaAnual })}
          formatar={formatarNumero}
          sufixo="%"
        />

        <hr className="separador" />

        <LinhaCalculada
          label="Juro diário"
          nota="estimado"
          valor={formatarEuro(juroDiario(dados))}
          cor={VERDE}
        />
        <LinhaCalculada
          label="Juro mensal"
          nota="estimado"
          valor={formatarEuro(juroMensal(dados))}
          cor={VERDE}
        />
        <LinhaCalculada
          label="Juro anual"
          nota="estimado"
          valor={formatarEuro(juroAnual(dados))}
          cor={VERDE}
        />
        <p className="nota">
          Estimativa simples: saldo × taxa. O valor real do banco varia com os dias do mês e com
          alterações de saldo.
        </p>
      </section>

      <section className="cartao">
        <h2 className="cartao__titulo cartao__titulo--solo">Ganhos reais</h2>
        <LinhaEditavel
          label="Último mês"
          valor={dados.ganhoMes}
          onChange={(ganhoMes) => atualizar({ ganhoMes })}
          formatar={formatarEuro}
          cor={dados.ganhoMes < 0 ? VERMELHO : VERDE}
        />
        <LinhaEditavel
          label="Desde sempre"
          valor={dados.ganhoTotal}
          onChange={(ganhoTotal) => atualizar({ ganhoTotal })}
          formatar={formatarEuro}
          cor={dados.ganhoTotal < 0 ? VERMELHO : VERDE}
        />
        <p className="nota">Valores copiados da app do banco — toca para atualizar.</p>
      </section>
    </>
  )
}
