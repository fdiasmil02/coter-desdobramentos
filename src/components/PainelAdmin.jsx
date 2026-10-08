// Painel admin: missões, efetivo completo e cadastro — atualização de publicação
import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { nomePais } from '../paises'
import BarraSuperior from './BarraSuperior'
import FormularioMissao from './FormularioMissao'
import FormularioDesdobrado from './FormularioDesdobrado'
import EfetivoCompleto from './EfetivoCompleto'

export default function PainelAdmin() {
  const navegar = useNavigate()
  const location = useLocation()
  const [verificando, setVerificando] = useState(true)
  const [aba, setAba] = useState('missoes') // 'missoes' | 'desdobrado'
  const [missoes, setMissoes] = useState([])
  const [stats, setStats] = useState([])
  const [modalMissao, setModalMissao] = useState(null)
  const [msgDesdobrado, setMsgDesdobrado] = useState(null)
  const [desdobradoEmEdicao, setDesdobradoEmEdicao] = useState(null)

  useEffect(() => {
    const registro = location.state?.editarDesdobrado
    if (!registro?.id) return
    setDesdobradoEmEdicao(registro)
    setMsgDesdobrado(null)
    setAba('desdobrado')
    navegar(location.pathname, { replace: true, state: null })
  }, [location.state, location.pathname, navegar])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data?.session) {
        navegar('/login')
        return
      }
      setVerificando(false)
    })
  }, [navegar])

  async function carregarDados() {
    const [resMissoes, resStats] = await Promise.all([
      supabase.from('missoes').select('*').order('sigla'),
      supabase.from('vw_stats_publico').select('*')
    ])
    setMissoes(resMissoes.data ?? [])
    setStats(resStats.data ?? [])
  }

  useEffect(() => { carregarDados() }, [])

  const statsPorMissao = Object.fromEntries(stats.map(s => [s.missao_id, s]))

  if (verificando) return <p className="carregando">Verificando acesso…</p>

  return (
    <>
      <BarraSuperior abaAtiva="admin" />

      <div className="app">
        <nav className="admin-nav">
          <button
            className={`admin-nav-botao ${aba === 'missoes' ? 'ativo' : ''}`}
            onClick={() => setAba('missoes')}
          >
            🗺️ Missões de Paz
          </button>
          <button className={`admin-nav-botao ${aba === 'efetivo' ? 'ativo' : ''}`} onClick={() => setAba('efetivo')}>
            👥 Efetivo Completo (com restritos)
          </button>
          <button
            className={`admin-nav-botao ${aba === 'desdobrado' ? 'ativo' : ''}`}
            onClick={() => { setDesdobradoEmEdicao(null); setAba('desdobrado') }}
          >
            📋 Cadastrar Desdobrado
          </button>
          <button className="admin-nav-botao" disabled title="Próxima entrega">
            📊 Relatórios de Rotação
          </button>
        </nav>

        {aba === 'missoes' && (
          <section className="admin-secao">
            <div className="admin-topo">
              <span className="admin-instrucao">
                Missões cadastradas no sistema — clique em uma para editar ou crie uma nova.
              </span>
              <button className="botao-nova-missao" onClick={() => setModalMissao('nova')}>
                ➕ Nova Missão
              </button>
            </div>

            {missoes.length === 0 ? (
              <p className="carregando">Nenhuma missão cadastrada — clique em "Nova Missão" para começar.</p>
            ) : (
              <div className="grade-admin-missoes">
                {missoes.map(m => {
                  const s = statsPorMissao[m.id]
                  return (
                    <div key={m.id} className="card-admin-missao">
                      <div className="ca-topo">
                        <strong>{m.sigla}</strong>
                        <span className={`badge-status ${m.status === 'Ativa' ? '' : 'encerrada'}`}>
                          {m.status}
                        </span>
                      </div>
                      <span className="ca-pais">🌍 {nomePais(m.pais)}</span>
                      <span className="ca-nome">{m.nome_completo}</span>
                      <span className="ca-local">
                        📍 {m.qg_missao}
                        {m.latitude && m.longitude
                          ? ` (${Number(m.latitude).toFixed(2)}, ${Number(m.longitude).toFixed(2)})`
                          : ''}
                      </span>
                      {m.descricao && <p className="ca-descricao">{m.descricao}</p>}
                      <div className="ca-rodape">
                        <span className="ca-efetivo">{s ? Number(s.efetivo_total) : 0} integrantes</span>
                        <button className="botao-editar-card" onClick={() => setModalMissao(m)}>
                          <span>✏️</span> Editar
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {aba === 'efetivo' && <EfetivoCompleto missoes={missoes} aoEditar={registro => { setDesdobradoEmEdicao(registro); setMsgDesdobrado(null); setAba('desdobrado') }} />}

        {aba === 'desdobrado' && (
          <section className="admin-secao">
            <div className="admin-topo">
              <span className="admin-instrucao">
                {desdobradoEmEdicao ? `Editando cadastro de ${desdobradoEmEdicao.nome_guerra}` : 'Cadastro de militar ou policial desdobrado — os dados entram direto no banco.'}
              </span>
            </div>

            {msgDesdobrado && <div className="msg-sucesso">{msgDesdobrado}</div>}

            <FormularioDesdobrado
              key={desdobradoEmEdicao?.id ?? 'novo'}
              desdobrado={desdobradoEmEdicao}
              aoCancelar={desdobradoEmEdicao ? () => { setDesdobradoEmEdicao(null); setAba('efetivo') } : undefined}
              missoes={missoes}
              aoSalvar={() => {
                carregarDados()
                setDesdobradoEmEdicao(null)
                setAba('efetivo')
                setMsgDesdobrado(desdobradoEmEdicao ? 'Cadastro atualizado com sucesso ✅' : 'Desdobrado salvo com sucesso ✅')
                setTimeout(() => setMsgDesdobrado(null), 4000)
              }}
            />
          </section>
        )}
      </div>

      {modalMissao && (
        <FormularioMissao
          missao={modalMissao === 'nova' ? null : modalMissao}
          aoSalvar={() => { setModalMissao(null); carregarDados() }}
          aoCancelar={() => setModalMissao(null)}
        />
      )}
    </>
  )
}