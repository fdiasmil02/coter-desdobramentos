import { Fragment, useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import { formatarData } from '../formatos'

const ORDEM_POSTOS = ['Gen Ex', 'Gen Div', 'Gen Bda', 'Cel', 'Ten Cel', 'Maj', 'Cap', '1º Ten', '2º Ten', 'Asp', 'S Ten', '1º Sgt', '2º Sgt', '3º Sgt', 'Cb', 'Sd']
const ordemPosto = posto => { const i = ORDEM_POSTOS.indexOf(posto); return i === -1 ? ORDEM_POSTOS.length : i }
const corSituacao = situacao => ({ 'Na Missão': 'na-missao', Leaving: 'leaving', Previsto: 'previsto', Estendido: 'estendido', Retornou: 'retornou' }[situacao] ?? 'outro')

const SITUACOES = ['Na Missão', 'Leaving', 'Previsto', 'Estendido', 'Retornou']

export default function EfetivoCompleto({ missoes, aoEditar }) {
  const [registros, setRegistros] = useState([])
  const [nivel, setNivel] = useState(null)
  const [busca, setBusca] = useState('')
  const [missao, setMissao] = useState('')
  const [tipo, setTipo] = useState('')
  const [situacao, setSituacao] = useState('')
  const [detalhe, setDetalhe] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const podeEditar = nivel === 'admin' || nivel === 'super_admin'

  async function carregar() {
    setCarregando(true)
    setErro('')
    const { data, error } = await supabase.from('desdobrados').select('*').order('nome_guerra')
    if (error) setErro(error.message)
    setRegistros(data ?? [])
    setCarregando(false)
  }

  useEffect(() => {
    let ativo = true
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data?.user) { if (ativo) setErro('Sessão não encontrada. Entre novamente.'); return }
      const { data: perfil, error } = await supabase.from('perfis').select('nivel').eq('id', data.user.id).maybeSingle()
      if (ativo) {
        setNivel(error ? null : perfil?.nivel ?? null)
        if (error) setErro('Não foi possível confirmar as permissões de edição: ' + error.message)
        else if (!perfil?.nivel) setErro('Seu usuário não possui perfil de acesso cadastrado. Contate o administrador.')
      }
    })
    carregar()
    return () => { ativo = false }
  }, [])

  const lista = useMemo(() => registros.filter(r => {
    const texto = Object.values(r).filter(v => v != null && typeof v !== 'object').join(' ').toLocaleLowerCase('pt-BR')
    return (!busca || texto.includes(busca.toLocaleLowerCase('pt-BR'))) &&
      (!missao || r.missao_id === missao) &&
      (!tipo || r.tipo === tipo) &&
      (!situacao || r.situacao === situacao)
  }).sort((x, y) => (missoes.find(m => m.id === x.missao_id)?.sigla ?? '').localeCompare(missoes.find(m => m.id === y.missao_id)?.sigla ?? '', 'pt-BR') || ordemPosto(x.posto_graduacao) - ordemPosto(y.posto_graduacao) || (x.nome_guerra ?? '').localeCompare(y.nome_guerra ?? '', 'pt-BR')), [registros, busca, missao, tipo, situacao, missoes])

  const siglaMissao = id => missoes.find(m => m.id === id)?.sigla ?? '—'
  const postoFormatado = r => [r.posto_graduacao,
    r.tipo === 'Militar do EB' ? r.qms :
      r.tipo === 'Policial Militar' ? 'PM' + (r.estado_pm ?? '').replace(/^PM/i, '').toUpperCase() : null
  ].filter(Boolean).join(' ')

  return (
    <section className="admin-secao">
      <div className="admin-topo">
        <div>
          <h2>Efetivo Completo <span className="ef-badge-restrito">🔒 Acesso autenticado</span></h2>
          <p className="admin-instrucao">Consulta de efetivos e dados administrativos por missão.</p>
        </div>
        <button className="botao-secundario-form" onClick={carregar}>↻ Atualizar</button>
      </div>
      {aviso && <div className="msg-sucesso">{aviso}</div>}
      {erro && <div className="aviso-erro">{erro}</div>}
      <div className="ef-filtros">
        <input aria-label="Pesquisar efetivo" placeholder="Busca livre" value={busca} onChange={e => setBusca(e.target.value)} />
        <select aria-label="Filtrar missão" value={missao} onChange={e => setMissao(e.target.value)}>
          <option value="">Todas as missões</option>
          {missoes.map(m => <option key={m.id} value={m.id}>{m.sigla}</option>)}
        </select>
        <select aria-label="Filtrar tipo" value={tipo} onChange={e => setTipo(e.target.value)}>
          <option value="">Todos os Militares</option>
          <option value="Militar do EB">Exército Brasileiro</option>
          <option value="Policial Militar">Polícia Militar</option>
        </select>
        <select aria-label="Filtrar situação" value={situacao} onChange={e => setSituacao(e.target.value)}>
          <option value="">Todas as situações</option>
          {SITUACOES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <p className="ef-contagem">{lista.length} registro(s) encontrado(s)</p>
      {carregando ? <p className="carregando">Carregando efetivo…</p> :
        <div className="tabela-wrap">
          <table className="tabela-efetivos ef-tabela">
            <thead><tr><th>Posto / Grad.</th><th>Militar / Policial</th><th>Gênero</th><th>Chegada</th><th>Retorno previsto</th><th>Situação</th><th>Ações</th></tr></thead>
            <tbody>
              {lista.map((r, i) => {
                const sigla = siglaMissao(r.missao_id)
                const inicioGrupo = i === 0 || siglaMissao(lista[i - 1].missao_id) !== sigla
                return <Fragment key={r.id}>
                  {inicioGrupo && <tr className="ef-grupo-missao"><th colSpan={7} scope="rowgroup">{sigla} — {lista.filter(item => item.missao_id === r.missao_id).length} integrante(s)</th></tr>}
                  <tr className={r.tipo === 'Militar do EB' ? 'linha-efetivo-eb' : 'linha-efetivo-pm'}>
                    <td><strong>{postoFormatado(r)}</strong></td>
                    <td><div className="ef-pessoa">{r.foto_url ? <img src={r.foto_url} alt="" /> : <span className="ef-avatar">👤</span>}<span><strong>{r.nome_guerra}</strong><small>{r.nome_completo}</small></span></div></td>
                    <td><span className={r.genero === 'Masculino' ? 'ef-genero-masculino' : r.genero === 'Feminino' ? 'ef-genero-feminino' : ''}>{r.genero || '—'}</span></td><td>{formatarData(r.data_chegada)}</td><td>{formatarData(r.data_previsao_retorno)}</td>
                    <td><span className={`ef-badge-situacao ${corSituacao(r.situacao)}`}>{r.situacao}</span></td>
                    <td><div className="ef-acoes"><button onClick={() => setDetalhe(r)}>Detalhes</button>{podeEditar && <button onClick={() => aoEditar?.(r)}>Editar</button>}</div></td>
                  </tr>
                </Fragment>
              })}
            </tbody>
          </table>
          {!lista.length && <p className="carregando">Nenhum registro encontrado.</p>}
        </div>
      }
      {detalhe && <div className="modal-overlay" onClick={() => setDetalhe(null)}>
        <div className="modal ef-detalhe ef-detalhe-compacto" role="dialog" aria-modal="true" aria-labelledby="ef-detalhe-titulo" onClick={e => e.stopPropagation()}>
          <div className="ef-detalhe-topo">
            {detalhe.foto_url
              ? <img className="ef-detalhe-foto" src={detalhe.foto_url} alt={`Foto de ${detalhe.nome_guerra}`} />
              : <div className="ef-detalhe-foto ef-detalhe-foto-vazia" aria-label="Sem foto cadastrada">👤</div>}
            <div className="ef-detalhe-identificacao">
              <h2 id="ef-detalhe-titulo">{postoFormatado(detalhe)} {detalhe.nome_guerra}</h2>
              <p className="ef-detalhe-nome-completo">{detalhe.nome_completo || '—'}</p>
              <span className={`ef-badge-situacao ef-detalhe-status ${corSituacao(detalhe.situacao)}`}>{detalhe.situacao}</span>
            </div>
            <button type="button" className="modal-fechar ef-detalhe-fechar" aria-label="Fechar detalhes" onClick={() => setDetalhe(null)}>×</button>
          </div>
          <dl className="ef-detalhe-grade">
            {[
              ['Tipo', detalhe.tipo],
              ['Missão', siglaMissao(detalhe.missao_id)],
              ['Gênero', detalhe.genero],
              ['Retorno previsto', formatarData(detalhe.data_previsao_retorno)],
              ['Chegada', formatarData(detalhe.data_chegada)],
              ['WhatsApp', detalhe.contato_telefone_whatsapp],
              ['Retorno real', detalhe.data_retorno_real ? formatarData(detalhe.data_retorno_real) : '—'],
              ['Documento', detalhe.documento_referencia],
              ['E-mail', detalhe.contato_email],
              ['Observações', detalhe.observacoes]
            ].map(([rotulo, valor]) =>
              <div key={rotulo} className={rotulo === 'Observações' ? 'ef-detalhe-observacoes' : ''}>
                <dt>{rotulo}</dt><dd>{valor || '—'}</dd>
              </div>
            )}
          </dl>
          {detalhe.situacao === 'Leaving' && (
            <section className="ef-detalhe-leaving" aria-label="Informações do Leaving">
              <h3>MILITAR EM LEAVING</h3>
              <dl className="ef-detalhe-grade">
                <div><dt>Início do Leaving</dt><dd>{detalhe.leaving_inicio ? formatarData(detalhe.leaving_inicio) : '—'}</dd></div>
                <div><dt>Término do Leaving</dt><dd>{detalhe.leaving_fim ? formatarData(detalhe.leaving_fim) : '—'}</dd></div>
                <div className="ef-detalhe-observacoes"><dt>Provável destino</dt><dd>{detalhe.leaving_destino?.trim() || 'Não informado'}</dd></div>
              </dl>
            </section>
          )}
          <div className="ef-detalhe-acoes">
            {podeEditar && <button type="button" className="botao-primario" onClick={() => { const registro = detalhe; setDetalhe(null); aoEditar?.(registro) }}>✏️ Editar cadastro</button>}
            <button type="button" className="botao-fechar-modal" onClick={() => setDetalhe(null)}>Fechar</button>
          </div>
        </div>
      </div>}

    </section>
  )
}
