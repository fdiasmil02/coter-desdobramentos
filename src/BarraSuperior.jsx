// Headbar única do sistema — idêntica em todas as páginas que a usarem.
// Mostra o e-mail do usuário logado; o clique abre menu com Trocar senha e Sair.
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'

export default function BarraSuperior({ abaAtiva }) {
  const navegar = useNavigate()
  const [email, setEmail] = useState(null)
  const [menuAberto, setMenuAberto] = useState(false)
  const [modalSenha, setModalSenha] = useState(false)
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmaSenha, setConfirmaSenha] = useState('')
  const [msgSenha, setMsgSenha] = useState(null)   // texto de resultado (ok ou erro)
  const [aguardando, setAguardando] = useState(false)
  const refMenu = useRef(null)

  // Detecta a sessão e exibe o e-mail
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) setEmail(data.session.user.email)
    })
  }, [])

  // Fecha o menu ao clicar fora dele
  useEffect(() => {
    function cliqueFora(evento) {
      if (refMenu.current && !refMenu.current.contains(evento.target)) setMenuAberto(false)
    }
    document.addEventListener('mousedown', cliqueFora)
    return () => document.removeEventListener('mousedown', cliqueFora)
  }, [])

  async function sair() {
    setMenuAberto(false)
    await supabase.auth.signOut()
    navegar('/')
  }

  function abrirTrocaSenha() {
    setMenuAberto(false)
    setNovaSenha('')
    setConfirmaSenha('')
    setMsgSenha(null)
    setModalSenha(true)
  }

  async function salvarSenha(evento) {
    evento.preventDefault()
    setMsgSenha(null)

    if (novaSenha.length < 6) {
      setMsgSenha({ tipo: 'erro', texto: 'A senha deve ter no mínimo 6 caracteres.' })
      return
    }
    if (novaSenha !== confirmaSenha) {
      setMsgSenha({ tipo: 'erro', texto: 'As duas senhas não coincidem.' })
      return
    }

    setAguardando(true)
    const { error } = await supabase.auth.updateUser({ password: novaSenha })
    setAguardando(false)

    if (error) {
      setMsgSenha({ tipo: 'erro', texto: error.message })
      return
    }
    setMsgSenha({ tipo: 'ok', texto: 'Senha alterada com sucesso! ✅' })
    setNovaSenha('')
    setConfirmaSenha('')
  }

  return (
    <header className="barra-superior">
      <div className="barra-marca">
        <span className="emblema">🕊️</span>
        <div>
          <h1>Controle de Efetivos — Missões de Paz</h1>
          <p className="subtitulo">Desdobramento de Militares e Policiais Militares Brasileiros</p>
        </div>
      </div>

      <nav className="abas">
        <span
          className={abaAtiva === 'mapa' ? 'aba ativa' : 'aba inativa'}
          onClick={() => navegar('/')}
        >
          🌐 Mapa Público
        </span>
        <span
          className={abaAtiva === 'admin' ? 'aba ativa' : 'aba inativa'}
          onClick={() => navegar(email ? '/admin' : '/login')}
        >
          🔒 Painel Admin
        </span>

        {email && (
          <div className="usuario-menu" ref={refMenu}>
            <button
              type="button"
              className="aba usuario-logado"
              onClick={() => setMenuAberto(anterior => !anterior)}
            >
              👤 {email}
            </button>
            {menuAberto && (
              <div className="usuario-dropdown">
                <button type="button" onClick={abrirTrocaSenha}>🔑 Trocar senha</button>
                <button type="button" onClick={sair}>🚪 Sair da conta</button>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Modal de troca de senha */}
      {modalSenha && (
        <div className="modal-overlay" onClick={() => setModalSenha(false)}>
          <form className="modal" onClick={evento => evento.stopPropagation()} onSubmit={salvarSenha}>
            <div className="modal-cabecalho">
              <div>
                <div className="modal-sigla">🔑 Trocar senha</div>
                <div className="modal-sub">Conta: {email}</div>
              </div>
              <button type="button" className="modal-fechar" onClick={() => setModalSenha(false)}>×</button>
            </div>

            <div className="form-senha">
              <label>Nova senha</label>
              <input
                type="password" value={novaSenha} required minLength={6}
                onChange={e => setNovaSenha(e.target.value)}
                placeholder="Mínimo de 6 caracteres"
              />
              <label>Confirmar nova senha</label>
              <input
                type="password" value={confirmaSenha} required
                onChange={e => setConfirmaSenha(e.target.value)}
                placeholder="Repita a nova senha"
              />
            </div>

            {msgSenha && (
              <div className={msgSenha.tipo === 'erro' ? 'aviso-erro' : 'msg-senha-ok'}>
                {msgSenha.texto}
              </div>
            )}

            <div className="form-rodape">
              <button type="button" className="botao-secundario-form" onClick={() => setModalSenha(false)}>
                Cancelar
              </button>
              <button type="submit" className="botao-primario" disabled={aguardando}>
                {aguardando ? 'Salvando…' : 'Salvar nova senha'}
              </button>
            </div>
          </form>
        </div>
      )}
    </header>
  )
}