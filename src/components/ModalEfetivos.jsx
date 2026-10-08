import { useNavigate } from 'react-router-dom'
import ModalDetalhesMilitar from './ModalDetalhesMilitar'
// Modal completo de efetivos de uma missão — visível apenas para usuários logados
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { nomePais } from '../paises'
import { formatarMesAno } from '../formatos'

const CLASSE_SITUACAO = {
  'Na Missão': 'verde',
  'Leaving': 'laranja',
  'Previsto': 'azul',
  'Estendido': 'roxo',
  'Retornou': 'cinza'
}

export default function ModalEfetivos({ missao, stats, aoFechar }) {
  const navegar = useNavigate()
  const [detalhe, setDetalhe] = useState(null)
  const [podeEditar, setPodeEditar] = useState(false)
  const [efetivos, setEfetivos] = useState([])
  const [busca, setBusca] = useState('')
  const [filtroSituacao, setFiltroSituacao] = useState('Todas')
  const [filtroTipo, setFiltroTipo] = useState('Todos')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    let ativo = true
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data?.user) return
      const { data: perfil } = await supabase.from('perfis').select('nivel').eq('id', data.user.id).maybeSingle()
      if (ativo) setPodeEditar(['admin', 'super_admin'].includes(perfil?.nivel))
    })
    return () => { ativo = false }
  }, [])

  useEffect(() => {
    async function carregar() {
      setCarregando(true)
      setErro(null)
      const { data, error } = await supabase
        .from('desdobrados')
        .select('*')
        .eq('missao_id', missao.id)
        .order('data_chegada')
      if (error) setErro(error.message)
      setEfetivos(data ?? [])
      setCarregando(false)
    }
    carregar()
  }, [missao.id])

  const listaFiltrada = efetivos.filter(e =>
    (busca === '' || (e.nome_guerra ?? '').toLowerCase().includes(busca.toLowerCase())) &&
    (filtroSituacao === 'Todas' || e.situacao === filtroSituacao) &&
    (filtroTipo === 'Todos' || e.tipo === filtroTipo)
  )

  const mandato = missao.data_inicio_mandato
  ? `${formatarMesAno(missao.data_inicio_mandato)} a ${missao.data_fim_mandato ? formatarMesAno(missao.data_fim_mandato) : 'Atual'}`
  : '—'

  return (
    <div className="modal-efetivos" onClick={aoFechar}>
      <div className="modal-efetivos-caixa" onClick={evento => evento.stopPropagation()}>
        <div className="modal-cabecalho">
          <div>
            <div className="modal-sigla">{missao.sigla}</div>
            <div className="me-badges">
              <span className="me-badge">📍 {missao.qg_missao}, {nomePais(missao.pais)}</span>
              <span className={`me-badge ${missao.status === 'Ativa' ? 'ativa' : ''}`}>{missao.status}</span>
            </div>
            <p className="modal-sub">Mandato ONU: {mandato}</p>
            <p className="modal-nome">{missao.nome_completo}</p>
          </div>
          <button className="modal-fechar" onClick={aoFechar}>×</button>
        </div>

        <div className="modal-stats">
              <div>
                <span className="modal-valor modal-valor-branco">{stats ? Number(stats.efetivo_total) : 0}</span>
                <span className="modal-rotulo">Efetivo Total</span>
              </div>
              <div>
                <span className="modal-valor modal-valor-verde">{stats ? Number(stats.efetivo_eb) : 0}</span>
                <span className="modal-rotulo">Efetivo EB</span>
              </div>
              <div>
                <span className="modal-valor modal-valor-azul">{stats ? Number(stats.efetivo_pm) : 0}</span>
                <span className="modal-rotulo">Efetivo PM</span>
              </div>
              <div>
                <span className="modal-valor modal-valor-rosa">{stats ? Number(stats.efetivo_feminino) : 0}</span>
                <span className="modal-rotulo">Mulheres (♀)</span>
              </div>
              <div>
                <span className="modal-valor modal-valor-laranja">{stats ? Number(stats.efetivo_leaving) : 0}</span>
                <span className="modal-rotulo">Em Leaving</span>
              </div>
        </div>

        <div className="efetivos-filtros">
          <input
            className="efetivos-busca"
            placeholder="Buscar por Nome de Guerra…"
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
          <select className="efetivos-select" value={filtroSituacao} onChange={e => setFiltroSituacao(e.target.value)}>
            <option value="Todas">Todas Situações</option>
            <option value="Na Missão">Na Missão</option>
            <option value="Leaving">Leaving</option>
            <option value="Previsto">Previsto</option>
            <option value="Estendido">Estendido</option>
            <option value="Retornou">Retornou</option>
          </select>
          <select className="efetivos-select" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
            <option value="Todos">Todos Tipos</option>
            <option value="Militar do EB">Militar</option>
            <option value="Policial Militar">Policial Militar</option>
          </select>
        </div>

        {erro && <div className="aviso-erro">Erro ao carregar efetivos: {erro}</div>}

        {carregando ? (
          <p className="carregando">Carregando efetivos…</p>
        ) : listaFiltrada.length === 0 ? (
          <p className="carregando">Nenhum efetivo encontrado com os filtros atuais.</p>
        ) : (
          <div className="tabela-wrap">
            <table className="tabela-efetivos">
              <thead>
                <tr>
                  <th>Posto / Graduação</th>
                  <th>Nome de Guerra</th>
                  <th>Gênero</th>
                  <th>Situação</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {listaFiltrada.map((e, i) => (
                  <tr key={e.id ?? i} className={e.tipo === 'Militar do EB' ? 'linha-efetivo-eb' : e.tipo === 'Policial Militar' ? 'linha-efetivo-pm' : ''}>
                    <td>{[e.posto_graduacao, e.tipo === 'Militar do EB' ? e.qms : e.tipo === 'Policial Militar' ? `PM${(e.estado_pm ?? '').replace(/^PM/i, '').replace(/\s/g, '').toUpperCase()}` : null].filter(Boolean).join(' ')}</td>
                    <td>{e.nome_guerra}</td>
                    <td><span className={e.genero === 'Masculino' ? 'ef-genero-masculino' : e.genero === 'Feminino' ? 'ef-genero-feminino' : ''}>{e.genero || '—'}</span></td>
                    <td>
                      <span className={`badge-sit ${CLASSE_SITUACAO[e.situacao] ?? 'cinza'}`}>{e.situacao}</span>
                    </td>
                    <td><button type="button" className="me-botao-detalhes" onClick={() => setDetalhe(e)}>Detalhes</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {detalhe && <div onClick={evento => evento.stopPropagation()}><ModalDetalhesMilitar detalhe={detalhe} siglaMissao={() => missao.sigla} podeEditar={podeEditar} aoFechar={() => setDetalhe(null)} aoEditar={registro => navegar('/admin', { state: { editarDesdobrado: registro } })} /></div>}
        <div className="me-rodape">
          <button className="botao-fechar-modal" onClick={aoFechar}>Fechar</button>
        </div>
      </div>
    </div>
  )
}