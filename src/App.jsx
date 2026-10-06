// Página pública: contadores + mapa mundi + cards de missões (estilo protótipo)
import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { nomePais } from './paises'
import MapaPublico from './components/MapaPublico'
import Contadores from './components/Contadores'

export default function App() {
  const [missoes, setMissoes] = useState([])
  const [stats, setStats] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

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
    <div className="app">
      <header className="cabecalho">
        <div className="emblema">🕊️</div>
        <h1>Controle de Efetivos — Missões de Paz</h1>
        <p className="subtitulo">Desdobramento de Militares e Policiais Militares Brasileiros</p>
        <nav className="abas">
          <span className="aba ativa">🌐 Mapa Público</span>
          <span className="aba desabilitada" title="Em construção">🔒 Painel Admin</span>
        </nav>
      </header>

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
        <MapaPublico missoes={missoes} statsPorMissao={statsPorMissao} />
      )}

      <section className="lista-missoes">
        <div className="lista-cabecalho">
          <h2>Missões Desdobradas</h2>
          <span className="badge">{missoes.length} Missões</span>
        </div>
        {missoes.length === 0 ? (
          <p className="carregando">Nenhuma missão cadastrada ainda.</p>
        ) : (
          <div className="grade-missoes">
            {missoes.map(m => {
              const s = statsPorMissao[m.id]
              return (
                <div key={m.id} className="card-missao">
                  <div className="card-topo">
                    <strong>{m.sigla}</strong>
                    <span className="badge-status">{m.status}</span>
                  </div>
                  <span className="card-pais">🌍 {nomePais(m.pais)}</span>
                  <p className="card-nome">{m.nome_completo}</p>
                  <div className="card-numeros">
                    <div><span>{s ? Number(s.efetivo_total) : 0}</span><small>Efetivo</small></div>
                    <div><span>{s ? Number(s.efetivo_feminino) : 0}</span><small>Mulheres</small></div>
                    <div><span>{s ? Number(s.efetivo_leaving) : 0}</span><small>Leaving</small></div>
                  </div>
                  <span className="card-qg">QG: {m.qg_missao}</span>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <footer className="rodape">
        Sistema de acompanhamento de efetivos brasileiros em missões de paz das Nações Unidas.
      </footer>
    </div>
  )
}