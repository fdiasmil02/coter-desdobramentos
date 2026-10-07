// Página pública: contadores + mapa mundi + painel lateral de missões
import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { nomePais } from './paises'
import { formatarMesAno } from './formatos'
import BarraSuperior from './BarraSuperior'
import MapaPublico from './components/MapaPublico'
import Contadores from './components/Contadores'

export default function App() {
  const [missoes, setMissoes] = useState([])
  const [stats, setStats] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const [focoMissao, setFocoMissao] = useState(null)

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
      <BarraSuperior abaAtiva="mapa" />

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