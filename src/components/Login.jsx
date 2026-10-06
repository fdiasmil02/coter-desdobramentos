// Página de login — se o usuário já tem sessão ativa, vai direto ao painel
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Login() {
  const navegar = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState(null)
  const [aguardando, setAguardando] = useState(false)

  // Já está logado? Pula o formulário e abre o painel
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) navegar('/admin')
    })
  }, [navegar])

  async function entrar(evento) {
    evento.preventDefault()
    setErro(null)
    setAguardando(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    setAguardando(false)

    if (error) {
      setErro('E-mail ou senha incorretos.')
      return
    }
    navegar('/admin')
  }

  return (
    <div className="tela-login">
      <form className="cartao-login" onSubmit={entrar}>
        <div className="emblema">🕊️</div>
        <h1>Acesso Restrito</h1>
        <p className="subtitulo">Painel de Gerenciamento de Efetivos</p>

        <label>E-mail</label>
        <input
          type="email" value={email} required
          onChange={e => setEmail(e.target.value)}
          placeholder="seu.email@exemplo.mil.br"
        />

        <label>Senha</label>
        <input
          type="password" value={senha} required
          onChange={e => setSenha(e.target.value)}
          placeholder="••••••••"
        />

        {erro && <div className="aviso-erro">{erro}</div>}

        <button type="submit" disabled={aguardando}>
          {aguardando ? 'Entrando…' : 'Entrar'}
        </button>
        <button type="button" className="botao-secundario" onClick={() => navegar('/')}>
          Voltar ao mapa público
        </button>
      </form>
    </div>
  )
}