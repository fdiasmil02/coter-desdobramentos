// Painel administrativo — só abre com sessão ativa; verifica o nível do usuário
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function PainelAdmin() {
  const navegar = useNavigate()
  const [sessao, setSessao] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [verificando, setVerificando] = useState(true)

  useEffect(() => {
    async function verificar() {
      const { data } = await supabase.auth.getSession()
      const sessaoAtual = data?.session

      if (!sessaoAtual) {
        navegar('/login')
        return
      }
      setSessao(sessaoAtual)

      // Busca o perfil (nome + nível) do usuário logado
      const { data: perfilDados } = await supabase
        .from('perfis')
        .select('nome, nivel')
        .eq('id', sessaoAtual.user.id)
        .single()
      setPerfil(perfilDados)
      setVerificando(false)
    }
    verificar()
  }, [navegar])

  async function sair() {
    await supabase.auth.signOut()
    navegar('/')
  }

  if (verificando) return <p className="carregando">Verificando acesso…</p>

  return (
    <div className="app">
      <header className="cabecalho">
        <div className="emblema">🔒</div>
        <h1>Painel Admin</h1>
        <p className="subtitulo">
          Bem-vindo, {perfil?.nome ?? 'usuário'} — nível: {perfil?.nivel ?? '—'}
        </p>
        <nav className="abas">
          <span className="aba inativa" onClick={() => navegar('/')}>
            🌐 Mapa Público
          </span>
          <span className="aba ativa">🔒 Painel Admin</span>
        </nav>
      </header>

      <section className="lista-missoes">
        <h2>Gerenciamento</h2>
        <p className="carregando">
          Formulários de Missões e Desdobrados chegam no próximo passo — o guarda de segurança
          já está de pé. ✅
        </p>
      </section>

      <button className="botao-sair" onClick={sair}>Sair da conta</button>
    </div>
  )
}