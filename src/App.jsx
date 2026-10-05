// Página pública: contadores + mapa mundi + lista de missões ativas
import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
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

  // Indexa as estatísticas pelo id da missão (busca rápida no mapa)
  const statsPorMissao = Object.fromEntries(stats.map(s => [s.missao_id, s]))
  const totalEfetivo = stats.reduce((soma, s) => soma + Number(s.efetivo_total), 0)
  const totalMulheres = stats.reduce((soma, s) => soma + Number(s.efetivo_feminino), 0)

  return (
    <div className="app">
      <header className="cabecalho">
        <h1>Efetivos em Missões de Paz — ONU</h1>
        <p className="subtitulo">
          Militares do Exército Brasileiro e Policiais Militares desdobrados
        </p>
      </header>

      <Contadores
        totalEfetivo={totalEfetivo}
        totalMissoes={missoes.length}
        totalMulheres={totalMulheres}
      />

      {erro && <div className="aviso-erro">Erro ao carregar dados: {erro}</div>}

      {carregando ? (
        <p className="carregando">Carregando mapa…</p>
      ) : (
        <MapaPublico missoes={missoes} statsPorMissao={statsPorMissao} />
      )}

      <section className="lista-missoes">
        <h2>Missões ativas</h2>
        {missoes.length === 0 ? (
          <p>Nenhuma missão cadastrada ainda.</p>
        ) : (
          <ul>
            {missoes.map(m => {
              const s = statsPorMissao[m.id]
              return (
                <li key={m.id}>
                  <strong>{m.sigla}</strong> — {m.nome_completo} (QG: {m.qg_missao})
                  <span className="badge">
                    {s ? `${s.efetivo_total} sob comando da ONU` : 'sem efetivo cadastrado'}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}