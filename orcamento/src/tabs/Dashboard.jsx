import { COR_CARRO, COR_CASA, VERDE, VERMELHO } from '../estado.js'
import { formatarEuro, formatarPercentagem } from '../format.js'
import { juroMensal, patrimonioTotal, progresso, saldoCasa } from '../calculos.js'
import { useAgora } from '../useAgora.js'
import { Barra, LinhaCalculada } from '../componentes.jsx'

export default function Dashboard({ estado, onAbrirAba }) {
  const agora = useAgora()
  const { casa, carro } = estado
  const saldo = saldoCasa(casa, agora)
  const total = patrimonioTotal(estado, agora)
  const parteCasa = total > 0 ? (saldo / total) * 100 : 0
  const parteCarro = total > 0 ? (carro.valor / total) * 100 : 0

  const juroCasaMes = juroMensal(casa, agora)
  const mediaCarroMes = carro.ganho3Meses / 3
  const rendimentoMes = juroCasaMes + mediaCarroMes

  const pctCasa = progresso(saldo, casa.objetivo)
  const pctCarro = progresso(carro.valor, carro.objetivo)

  return (
    <>
      <section className="cartao">
        <p className="cartao__etiqueta">Património total</p>
        <div className="valor-grande">{formatarEuro(total)}</div>
        <p className="nota">Casa + Carro</p>

        <div className="distribuicao">
          <div
            className="distribuicao__parte"
            style={{ width: `${parteCasa}%`, background: COR_CASA }}
          />
          <div
            className="distribuicao__parte"
            style={{ width: `${parteCarro}%`, background: COR_CARRO }}
          />
        </div>
        <div className="categorias">
          <span className="categoria">
            <span className="categoria__ponto" style={{ background: COR_CASA }} />
            Casa
            <span className="categoria__valor">{formatarPercentagem(parteCasa, 1)}</span>
          </span>
          <span className="categoria">
            <span className="categoria__ponto" style={{ background: COR_CARRO }} />
            Carro
            <span className="categoria__valor">{formatarPercentagem(parteCarro, 1)}</span>
          </span>
        </div>
      </section>

      <section className="cartao">
        <p className="cartao__etiqueta">Rendimento estimado / mês</p>
        <div
          className="valor-grande valor-grande--medio"
          style={{ color: rendimentoMes < 0 ? VERMELHO : VERDE }}
        >
          {formatarEuro(rendimentoMes)}
        </div>
        <hr className="separador" />
        <LinhaCalculada
          label="Juros da casa"
          valor={formatarEuro(juroCasaMes)}
          cor={VERDE}
        />
        <LinhaCalculada
          label="Carro"
          nota="média de 3 meses"
          valor={formatarEuro(mediaCarroMes)}
          cor={mediaCarroMes < 0 ? VERMELHO : VERDE}
        />
      </section>

      <button className="cartao cartao--botao" type="button" onClick={() => onAbrirAba('casa')}>
        <div className="cartao__topo">
          <h2 className="cartao__titulo">
            <span className="ponto" style={{ background: COR_CASA }} />
            Casa
          </h2>
          <span className="cartao__total" style={{ color: COR_CASA }}>
            {formatarEuro(saldo)}
          </span>
        </div>
        {pctCasa !== null && (
          <>
            <Barra percentagem={pctCasa} cor={COR_CASA} />
            <LinhaCalculada
              label={`Objetivo ${formatarEuro(casa.objetivo)}`}
              valor={formatarPercentagem(pctCasa, 1)}
            />
          </>
        )}
        <LinhaCalculada
          label="Ganho no último mês"
          valor={formatarEuro(casa.ganhoMes)}
          cor={casa.ganhoMes < 0 ? VERMELHO : VERDE}
        />
        <LinhaCalculada
          label="Ganho desde sempre"
          valor={formatarEuro(casa.ganhoTotal)}
          cor={casa.ganhoTotal < 0 ? VERMELHO : VERDE}
        />
      </button>

      <button className="cartao cartao--botao" type="button" onClick={() => onAbrirAba('carro')}>
        <div className="cartao__topo">
          <h2 className="cartao__titulo">
            <span className="ponto" style={{ background: COR_CARRO }} />
            Carro
          </h2>
          <span className="cartao__total" style={{ color: COR_CARRO }}>
            {formatarEuro(carro.valor)}
          </span>
        </div>
        {pctCarro !== null && (
          <>
            <Barra percentagem={pctCarro} cor={COR_CARRO} />
            <LinhaCalculada
              label={`Objetivo ${formatarEuro(carro.objetivo)}`}
              valor={formatarPercentagem(pctCarro, 1)}
            />
          </>
        )}
        <LinhaCalculada
          label="Rendibilidade"
          valor={formatarPercentagem(carro.retorno, 1)}
          cor={carro.retorno < 0 ? VERMELHO : VERDE}
        />
        <LinhaCalculada
          label="Ganho últimos 3 meses"
          valor={formatarEuro(carro.ganho3Meses)}
          cor={carro.ganho3Meses < 0 ? VERMELHO : VERDE}
        />
      </button>
    </>
  )
}
