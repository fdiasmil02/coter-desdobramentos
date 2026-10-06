// Painel admin: navegação por abas + gerenciamento de missões (Etapa 1)
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { nomePais } from '../paises'
import FormularioMissao from './FormularioMissao'

export default function PainelAdmin() {
  const navegar = useNavigate()
  const [perfil, setPerfil] = useState(null)
  const [verificando, setVerificando] = useState(true)
  const [aba, setAba] = useState('missoes')
  const [missoes, setMissoes] = useState([])
  const [modalMissao, setModalMissao] = useState(null) // null | 'nova' | objeto da missão

  useEffect(() => {
    async function verificar() {
      const { data } = await supabase.auth.getSession()
      if (!data?.session) {
        navegar('/login')
        return
      }
      const { data: perfilDados } = await supabase
        .from('perfis')
        .select('nome, nivel')
        .eq('id', data.session.user.id)
        .single()
      setPerfil(perfilDados)
      setVerificando(false)
    }
    verificar()
  }, [navegar])

  async function carregarMissoes() {
    const { data } = await supabase.from('missoes').select('*').order('sigla')
    setMissoes(data ?? [])
  }

  useEffect(() => { carregarMissoes() }, [])

  async function sair() {
    await supabase.auth.signOut()
    navegar('/')
  }

  if (verificando) return <p className="carregando">Verificando acesso…</p>

  return (
    <div className="app">
      <header className="barra-superior">
        <div className="barra-marca">
          <span className="emblema">🔒</span>
          <div>
            <h1>Painel Admin</h1>
            <p className="subtitulo">
              Bem-vindo, {perfil?.nome ?? 'usuário'} — nível: {perfil?.nivel ?? '—'}
            </p>
          </div>
        </div>
        <nav className="abas">
          <span className="aba inativa" onClick={() => navegar('/')}>🌐 Mapa Público</span>
          <span className="aba ativa">🔒 Painel Admin</span>
        </nav>
      </header>

      <nav className="admin-nav">
        <button className={`admin-nav-botao ${aba === 'missoes' ? 'ativo' : ''}`} onClick={() => setAba('missoes')}>
          🗺️ Missões
        </button>
        <button className="admin-nav-botao" disabled title="Etapa 2">👥 Efetivos</button>
        <button className="admin-nav-botao" disabled title="Etapa 4">📊 Relatórios</button>
      </nav>

      {aba === 'missoes' && (
        <section className="lista-missoes">
          <div className="admin-topo">
            <h2>Missões Cadastradas</h2>
            <button className="botao-primario" onClick={() => setModalMissao('nova')}>
              ➕ Nova Missão
            </button>
          </div>

          {missoes.length === 0 ? (
            <p className="carregando">Nenhuma missão cadastrada — clique em "Nova Missão" para começar.</p>
          ) : (
            <div className="grade-admin-missoes">
              {missoes.map(m => (
                <div key={m.id} className="card-admin-missao">
                  <div className="card-topo">
                    <strong>{m.sigla}</strong>
                    <span className={`badge-status ${m.status === 'Ativa' ? '' : 'encerrada'}`}>{m.status}</span>
                  </div>
                  <span className="cam-missao">🌍 {nomePais(m.pais)}</span>
                  <span className="cam-missao">📍 QG: {m.qg_missao}</span>
                  <button className="botao-editar" onClick={() => setModalMissao(m)}>
                    ✏️ Gerenciar
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {modalMissao && (
        <FormularioMissao
          missao={modalMissao === 'nova' ? null : modalMissao}
          aoSalvar={() => { setModalMissao(null); carregarMissoes() }}
          aoCancelar={() => setModalMissao(null)}
        />
      )}

      <button className="botao-sair" onClick={sair}>Sair da conta</button>
    </div>
  )
}