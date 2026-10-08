import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import { formatarData } from '../formatos'
import FormularioDesdobrado from './FormularioDesdobrado'

const SITUACOES = ['Na Missão', 'Leaving', 'Previsto', 'Estendido', 'Retornou']

export default function EfetivoCompleto({ missoes, aoAtualizar }) {
  const [registros, setRegistros] = useState([])
  const [nivel, setNivel] = useState(null)
  const [busca, setBusca] = useState('')
  const [missao, setMissao] = useState('')
  const [tipo, setTipo] = useState('')
  const [situacao, setSituacao] = useState('')
  const [editando, setEditando] = useState(null)
  const [detalhe, setDetalhe] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [excluindo, setExcluindo] = useState(null)
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
    const texto = [r.nome_guerra, r.nome_completo, r.posto_graduacao, r.qms, r.estado_pm].filter(Boolean).join(' ').toLocaleLowerCase('pt-BR')
    return (!busca || texto.includes(busca.toLocaleLowerCase('pt-BR'))) &&
      (!missao || r.missao_id === missao) &&
      (!tipo || r.tipo === tipo) &&
      (!situacao || r.situacao === situacao)
  }), [registros, busca, missao, tipo, situacao])

  const siglaMissao = id => missoes.find(m => m.id === id)?.sigla ?? '—'
  const postoFormatado = r => [r.posto_graduacao,
    r.tipo === 'Militar do EB' ? r.qms :
      r.tipo === 'Policial Militar' ? 'PM' + (r.estado_pm ?? '').replace(/^PM/i, '').toUpperCase() : null
  ].filter(Boolean).join(' ')

  async function excluir(registro) {
    if (!podeEditar || excluindo) return
    if (!window.confirm('Excluir definitivamente o cadastro de ' + registro.nome_guerra + '? Esta ação não pode ser desfeita.')) return
    setExcluindo(registro.id)
    const { error } = await supabase.from('desdobrados').delete().eq('id', registro.id)
    setExcluindo(null)
    if (error) { setErro(error.message); return }
    setAviso('Cadastro excluído com sucesso.')
    await carregar()
    aoAtualizar?.()
  }

  async function salvo() {
    setEditando(null)
    setAviso('Cadastro atualizado com sucesso.')
    await carregar()
    aoAtualizar?.()
  }

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
        <input aria-label="Pesquisar efetivo" placeholder="Pesquisar nome, posto ou QMS..." value={busca} onChange={e => setBusca(e.target.value)} />
        <select aria-label="Filtrar missão" value={missao} onChange={e => setMissao(e.target.value)}>
          <option value="">Todas as missões</option>
          {missoes.map(m => <option key={m.id} value={m.id}>{m.sigla}</option>)}
        </select>
        <select aria-label="Filtrar tipo" value={tipo} onChange={e => setTipo(e.target.value)}>
          <option value="">EB e PM</option>
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
            <thead><tr><th>Militar / Policial</th><th>Posto / Grad.</th><th>Missão</th><th>Chegada</th><th>Retorno previsto</th><th>Situação</th><th>Ações</th></tr></thead>
            <tbody>
              {lista.map(r => <tr key={r.id} className={r.tipo === 'Militar do EB' ? 'linha-efetivo-eb' : 'linha-efetivo-pm'}>
                <td><div className="ef-pessoa">{r.foto_url ? <img src={r.foto_url} alt="" /> : <span className="ef-avatar">👤</span>}<span><strong>{r.nome_guerra}</strong><small>{r.nome_completo}</small></span></div></td>
                <td>{postoFormatado(r)}</td><td>{siglaMissao(r.missao_id)}</td><td>{formatarData(r.data_chegada)}</td>
                <td>{formatarData(r.data_previsao_retorno)}</td>
                <td><span className="badge-sit azul">{r.situacao}</span></td>
                <td><div className="ef-acoes">
                  <button onClick={() => setDetalhe(r)}>Detalhes</button>
                  {podeEditar && <button onClick={() => setEditando(r)}>Editar</button>}
                  {podeEditar && <button className="ef-excluir" disabled={excluindo === r.id} onClick={() => excluir(r)}>Excluir</button>}
                </div></td>
              </tr>)}
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
      {editando && podeEditar && <div className="modal-overlay" onClick={() => setEditando(null)}>
        <div className="modal-efetivos-caixa ef-editor" onClick={e => e.stopPropagation()}>
          <div className="modal-cabecalho"><h2>Editar — {editando.nome_guerra}</h2><button className="modal-fechar" onClick={() => setEditando(null)}>×</button></div>
          <FormularioDesdobrado key={editando.id} missoes={missoes} desdobrado={editando} aoSalvar={salvo} aoCancelar={() => setEditando(null)} />
        </div>
      </div>}
    </section>
  )
}
