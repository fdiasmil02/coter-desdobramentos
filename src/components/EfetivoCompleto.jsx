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
      if (!data?.user) return
      const { data: perfil, error } = await supabase.from('perfis').select('nivel').eq('id', data.user.id).single()
      if (ativo) {
        setNivel(perfil?.nivel ?? 'visualizador')
        if (error) setErro('Não foi possível confirmar o nível de acesso.')
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
                    <td>{r.genero || '—'}</td><td>{formatarData(r.data_chegada)}</td><td>{formatarData(r.data_previsao_retorno)}</td>
                    <td><span className={`ef-badge-situacao ${corSituacao(r.situacao)}`}>{r.situacao}</span></td>
                    <td><div className="ef-acoes"><button onClick={() => setDetalhe(r)}>Detalhes</button>{podeEditar && <button onClick={() => aoEditar(r)}>Editar</button>}</div></td>
                  </tr>
                </Fragment>
              })}
            </tbody>
          </table>
          {!lista.length && <p className="carregando">Nenhum registro encontrado.</p>}
        </div>
      }
      {detalhe && <div className="modal-overlay" onClick={() => setDetalhe(null)}>
        <div className="modal ef-detalhe" onClick={e => e.stopPropagation()}>
          <div className="modal-cabecalho"><h2>{detalhe.nome_guerra} — {postoFormatado(detalhe)}</h2><button className="modal-fechar" onClick={() => setDetalhe(null)}>×</button></div>
          <dl>
            {[['Nome completo', detalhe.nome_completo], ['Missão', siglaMissao(detalhe.missao_id)], ['Tipo', detalhe.tipo], ['Gênero', detalhe.genero], ['Situação', detalhe.situacao], ['Chegada', formatarData(detalhe.data_chegada)], ['Retorno previsto', formatarData(detalhe.data_previsao_retorno)], ['Retorno real', detalhe.data_retorno_real ? formatarData(detalhe.data_retorno_real) : '—'], ['WhatsApp', detalhe.contato_telefone_whatsapp], ['E-mail', detalhe.contato_email], ['Documento', detalhe.documento_referencia], ['Observações', detalhe.observacoes]].map(([k,v]) => <div key={k}><dt>{k}</dt><dd>{v || '—'}</dd></div>)}
          </dl>
          <div className="me-rodape"><button className="botao-fechar-modal" onClick={() => setDetalhe(null)}>Fechar</button></div>
        </div>
      </div>}

    </section>
  )
}
