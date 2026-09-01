import { useEffect } from 'react'
import { COR_CASA, VERDE, VERMELHO } from '../estado.js'
import { formatarEuro, formatarNumero, formatarPercentagem } from '../format.js'
import {
  casaFimDoMes,
  diasAteFimDoMes,
  diasDesde,
  juroAnual,
  juroDiario,
  juroMensal,
  jurosAcumulados,
  progresso,
  saldoCasa,
} from '../calculos.js'
import { useAgora } from '../useAgora.js'
import { Barra, LinhaCalculada, LinhaEditavel, ValorEditavel } from '../componentes.jsx'

const dataCurta = (instante) =>
  new Date(instante).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })

export default function Casa({ dados, onChange }) {
  const agora = useAgora()
  const atualizar = (alteracoes) => onChange({ ...dados, ...alteracoes })

  // Sem data de referência os juros não podiam começar a contar.
  useEffect(() => {
    if (!dados.saldoDesde) atualizar({ saldoDesde: Date.now() })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dados.saldoDesde])

  const saldo = saldoCasa(dados, agora)
  const juros = jurosAcumulados(dados, agora)
  const dias = diasDesde(dados.saldoDesde, agora)
  const diasQueFaltam = diasAteFimDoMes(agora)
  const pct = progresso(saldo, dados.objetivo)
  const falta = dados.objetivo - saldo

  return (
    <>
      <section className="cartao">
        <p className="cartao__etiqueta">Casa · poupança</p>
        <div className="valor-grande" style={{ color: COR_CASA }}>
          <ValorEditavel
            valor={saldo}
            onChange={(novo) => atualizar({ saldo: novo, saldoDesde: Date.now() })}
            formatar={formatarEuro}
            ariaLabel="Saldo da poupança da casa"
          />
        </div>
        <p className="nota">
          {dias > 0
            ? `Cresce sozinho todos os dias. Toca no valor para o acertar pelo banco.`
            : `Saldo de hoje. Toca no valor para o acertar pelo banco.`}
        </p>

        {dias > 0 && (
          <>
            <hr className="separador" />
            <LinhaCalculada
              label={`Saldo de ${dataCurta(dados.saldoDesde)}`}
              valor={formatarEuro(dados.saldo)}
            />
            <LinhaCalculada
              label={`Juros de ${dias} ${dias === 1 ? 'dia' : 'dias'}`}
              valor={`+ ${formatarEuro(juros)}`}
              cor={VERDE}
            />
          </>
        )}

        <hr className="separador" />

        <LinhaCalculada
          label="Estimativa fim do mês"
          nota={diasQueFaltam === 1 ? 'falta 1 dia' : `faltam ${diasQueFaltam} dias`}
          valor={formatarEuro(casaFimDoMes(dados, agora))}
          cor={COR_CASA}
        />

        <hr className="separador" />

        {pct !== null ? (
          <>
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
              <span className="linha-dados__label">{falta > 0 ? 'Falta' : 'Excedente'}</span>
              <span
                className="linha-dados__valor"
                style={{ color: falta > 0 ? 'var(--texto)' : VERDE }}
              >
                {formatarEuro(Math.abs(falta))} · {formatarPercentagem(pct, 1)}
              </span>
            </div>
          </>
        ) : (
          <LinhaEditavel
            label="Objetivo (0 = sem objetivo)"
            valor={dados.objetivo}
            onChange={(objetivo) => atualizar({ objetivo })}
            formatar={formatarEuro}
          />
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

        <LinhaCalculada label="Por dia" valor={formatarEuro(juroDiario(dados, agora))} cor={VERDE} />
        <LinhaCalculada
          label="Por mês"
          nota="30 dias"
          valor={formatarEuro(juroMensal(dados, agora))}
          cor={VERDE}
        />
        <LinhaCalculada
          label="Por ano"
          valor={formatarEuro(juroAnual(dados, agora))}
          cor={VERDE}
        />
        <p className="nota">
          Capitalização diária a partir do APY, como o banco faz: a taxa de um dia é a raiz 365 do
          ano. Ao fim de 12 meses dá exatamente os {formatarPercentagem(dados.taxaAnual)}.
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
