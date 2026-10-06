// Página pública: barra superior + contadores + mapa com painel lateral de missões
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import { nomePais } from './paises'
import MapaPublico from './components/MapaPublico'
import Contadores from './components/Contadores'
import { formatarMesAno } from './formatos'

export default function App() {
  const navegar = useNavigate()
  const [missoes, setMissoes] = useState([])
  const [stats, setStats] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const [logado, setLogado] = useState(null)
  const [focoMissao, setFocoMissao] = useState(null)

  // Indicador de sessão no cabeçalho
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const sessao = data?.session
      if (!sessao) return setLogado(null)
      const { data: perfil } = await supabase
        .from('perfis')
        .select('nome')
        .eq('id', sessao.user.id)
        .single()
      setLogado(perfil?.nome ?? sessao.user.email)
    })
  }, [])

  useEffect(() => {
    async function carregarDados() {
      const [resMissoes, resStats] = await Promise.all([
        supabase.from('missoes').select('*').eq('status', 'Ativa').order('sigla'),
        supabase.from('vw_stats_publico').select('*')
      ])
      if (resMissoes.error) setErro(resMissoes.error.message)
      if (resStats.error) setErro(resStats.error.message)
      setMissoes(resMissoes.data ?? [])
      setStats(resStats.data ?? [])
      setCarregando(false)
    }
    carregarDados()
  }, [])

  const statsPorMissao = Object.fromEntries(stats.map(s => [s.missao_id, s]))
  const soma = campo => stats.reduce((total, s) => total + Number(s[campo] ?? 0), 0)

  return (
    <>
      <header className="barra-superior">
        <div className="barra-marca">
          <span className="emblema">🕊️</span>
          <div>
            <h1>Controle de Efetivos — Missões de Paz</h1>
            <p className="subtitulo">Desdobramento de Militares e Policiais Militares Brasileiros</p>
          </div>
        </div>
        <nav className="abas">
          <span className="aba ativa">🌐 Mapa Público</span>
          <span className="aba inativa" onClick={() => navegar(logado ? '/admin' : '/login')}>
            🔒 Painel Admin
          </span>
          {logado && <span className="aba usuario-logado">👤 {logado}</span>}
        </nav>
      </header>

      <div className="app">
        <Contadores
          totalEfetivo={soma('efetivo_total')}
          totalEb={soma('efetivo_eb')}
          totalPm={soma('efetivo_pm')}
          totalMulheres={soma('efetivo_feminino')}
          totalLeaving={soma('efetivo_leaving')}
          totalMissoes={missoes.length}
        />

        {erro && <div className="aviso-erro">Erro ao carregar dados: {erro}</div>}

        {carregando ? (
          <p className="carregando">Carregando mapa…</p>
        ) : (
          <section className="linha-principal">
            <MapaPublico
              missoes={missoes}
              statsPorMissao={statsPorMissao}
              logado={logado}
              focoMissao={focoMissao}
              aoFocarConcluido={() => setFocoMissao(null)}
            />

            <aside className="painel-missoes">
              <div className="painel-cabecalho">
                <h2>Missões Desdobradas</h2>
                <span className="badge">{missoes.length} Missões</span>
              </div>
              {missoes.length === 0 ? (
                <p className="carregando">Nenhuma missão cadastrada ainda.</p>
              ) : (
                missoes.map(m => {
                  const s = statsPorMissao[m.id]
                  return (
                    <div key={m.id} className="card-missao-lateral">
                      <div className="cm-topo">
                        <strong>{m.sigla}</strong>
                        <span className="cm-efetivo">
                          {s ? Number(s.efetivo_total) : 0} militares
                        </span>
                      </div>
                      <span className="cm-local">📍 {m.qg_missao}, {nomePais(m.pais)}</span>
                      <div className="cm-rodape">
                        <span className="cm-mandato">
                          {m.data_inicio_mandato ? `Mandato: ${formatarMesAno(m.data_inicio_mandato)}` : ''}
                        </span>
                        <button className="cm-ver" onClick={() => setFocoMissao(m.id)}>
                          Ver no mapa →
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </aside>
          </section>
        )}

        <footer className="rodape">
          CCOPAB / Centro Conjunto de Operações de Paz do Brasil • Sistema de Apoio à Decisão Operacional
        </footer>
      </div>
    </>
  )
}