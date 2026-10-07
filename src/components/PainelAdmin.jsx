// Painel admin: headbar única + gerenciamento de missões
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { nomePais } from '../paises'
import BarraSuperior from './BarraSuperior'
import FormularioMissao from './FormularioMissao'

export default function PainelAdmin() {
  const navegar = useNavigate()
  const [verificando, setVerificando] = useState(true)
  const [missoes, setMissoes] = useState([])
  const [stats, setStats] = useState([])
  const [modalMissao, setModalMissao] = useState(null) // null | 'nova' | objeto da missão

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
          <button className="admin-nav-botao ativo">🗺️ Missões de Paz</button>
          <button className="admin-nav-botao" disabled title="Próxima etapa">👥 Efetivo Completo (com restritos)</button>
          <button className="admin-nav-botao" disabled title="Próxima etapa">📋 Cadastrar Desdobrado</button>
          <button className="admin-nav-botao" disabled title="Próxima etapa">📊 Relatórios de Rotação</button>
        </nav>

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