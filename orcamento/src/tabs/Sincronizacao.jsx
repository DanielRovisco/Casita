import { useEffect, useState } from 'react'
import { VERDE, VERMELHO } from '../estado.js'
import { configCompleta } from '../sync/config.js'

const ETIQUETAS = {
  desligado: { texto: 'Só neste dispositivo', cor: 'var(--texto-fraco)' },
  'a-sincronizar': { texto: 'A sincronizar…', cor: '#F59E0B' },
  ok: { texto: 'Sincronizado', cor: VERDE },
  erro: { texto: 'Erro de sincronização', cor: VERMELHO },
  'sem-cripto': { texto: 'Cifra indisponível neste browser', cor: VERMELHO },
}

export function estadoDaSync(situacao) {
  return ETIQUETAS[situacao] || ETIQUETAS.desligado
}

const REGRAS = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /casita/{espaco} {
      allow read, write: if true;
    }
  }
}`

export default function Sincronizacao({ sync, onFechar }) {
  const { config, gravarConfig, desligar, situacao, erro, ultimaSync, ligado, espaco, espacoNovo } =
    sync
  const [form, setForm] = useState(config)
  const [guardado, setGuardado] = useState(false)

  useEffect(() => setForm(config), [config])

  const etiqueta = estadoDaSync(situacao)
  const alterar = (campo) => (e) => {
    setForm({ ...form, [campo]: e.target.value })
    setGuardado(false)
  }

  return (
    <>
      <section className="cartao">
        <div className="cartao__topo">
          <h2 className="cartao__titulo">
            <span className="ponto" style={{ background: etiqueta.cor }} />
            Sincronização
          </h2>
          <button className="btn-texto" type="button" onClick={onFechar}>
            Fechar
          </button>
        </div>

        <p className="estado-sync" style={{ color: etiqueta.cor }}>
          {etiqueta.texto}
        </p>
        {erro && <p className="erro">{erro}</p>}
        {ultimaSync && !erro && (
          <p className="nota">
            Última sincronização às{' '}
            {new Date(ultimaSync).toLocaleTimeString('pt-PT', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}
        {ligado && espaco && (
          <p className="nota">
            Espaço <b className="impressao">{espaco}</b> — confirma que aparece este mesmo código
            nos outros dispositivos.
          </p>
        )}
        {ligado && espacoNovo && (
          <p className="aviso">
            Espaço novo: não havia nada guardado com este código. Se esperavas encontrar os dados
            do outro dispositivo, o código está escrito de forma diferente — corrige-o em vez de
            continuares, senão ficam duas cópias separadas.
          </p>
        )}
        {!ligado && (
          <p className="nota">
            Preenche os três campos para os dados passarem a acompanhar-te em qualquer
            dispositivo. Sem isto, ficam só neste telemóvel ou computador.
          </p>
        )}
      </section>

      <section className="cartao">
        <h2 className="cartao__titulo cartao__titulo--solo">Ligação ao Firebase</h2>

        <label className="etiqueta" htmlFor="projectId">
          Project ID
        </label>
        <input
          id="projectId"
          className="campo"
          type="text"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck="false"
          placeholder="casita-1a2b3"
          value={form.projectId}
          onChange={alterar('projectId')}
        />

        <label className="etiqueta" htmlFor="apiKey">
          API key (Web)
        </label>
        <input
          id="apiKey"
          className="campo"
          type="text"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck="false"
          placeholder="AIza…"
          value={form.apiKey}
          onChange={alterar('apiKey')}
        />

        <label className="etiqueta" htmlFor="codigo">
          Código de acesso
        </label>
        <input
          id="codigo"
          className="campo"
          type="password"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck="false"
          placeholder="a mesma palavra em todos os dispositivos"
          value={form.codigo}
          onChange={alterar('codigo')}
        />
        <p className="nota">
          O código cifra os dados antes de saírem daqui e define onde ficam guardados. Escreve o
          mesmo código em cada dispositivo. Não há forma de o recuperar — se o perderes, os dados
          na nuvem ficam ilegíveis.
        </p>

        <button
          className="btn-principal"
          type="button"
          disabled={!configCompleta(form)}
          onClick={() => {
            gravarConfig(form)
            setGuardado(true)
          }}
        >
          {ligado ? 'Guardar e sincronizar' : 'Ligar sincronização'}
        </button>
        {guardado && <p className="nota">Configuração guardada.</p>}

        {ligado && (
          <button
            className="btn-secundario"
            type="button"
            onClick={() => {
              if (confirm('Desligar a sincronização neste dispositivo? Os dados na nuvem ficam lá.'))
                desligar()
            }}
          >
            Desligar neste dispositivo
          </button>
        )}
      </section>

      <section className="cartao">
        <h2 className="cartao__titulo cartao__titulo--solo">Como preencher</h2>
        <ol className="passos">
          <li>
            Cria um projeto em <b>console.firebase.google.com</b> (podes desativar o Analytics).
          </li>
          <li>
            Em <b>Build → Firestore Database</b>, carrega em <b>Create database</b> e escolhe a
            região <b>eur3</b>.
          </li>
          <li>
            Em <b>Project settings → General</b>, regista uma app <b>Web</b>. Copia dali o{' '}
            <b>Project ID</b> e a <b>apiKey</b>.
          </li>
          <li>
            Em <b>Firestore → Rules</b>, cola as regras abaixo e publica.
          </li>
        </ol>
        <pre className="codigo">{REGRAS}</pre>
        <p className="nota">
          Estas regras deixam qualquer pessoa escrever na coleção <code>casita</code>, mas o
          conteúdo vai cifrado com o teu código — quem lá chegar vê texto sem sentido. A API key do
          Firebase é pública por definição; não é um segredo.
        </p>
      </section>
    </>
  )
}
