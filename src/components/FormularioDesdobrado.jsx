// Formulário de cadastro/edição de desdobrado — campos espelham a tabela desdobrados
// A foto é guardada LOCALMENTE durante a edição e só enviada ao bucket
// "fotos" DEPOIS que o registro é salvo com sucesso (evita erro de RLS).
import { useState } from 'react'
import { supabase } from '../supabaseClient'
import RecorteFoto from '../RecorteFoto'

// Lista validada de posto/graduação — EB: Gen Ex a Sd; PM: Cel a Sd
const POSTOS_EB = [
  'Gen Ex', 'Gen Div', 'Gen Bda', 'Cel', 'Ten Cel', 'Maj', 'Cap',
  '1º Ten', '2º Ten', 'Asp', 'S Ten', '1º Sgt', '2º Sgt', '3º Sgt', 'Cb', 'Sd'
]
const POSTOS_PM = [
  'Cel', 'Ten Cel', 'Maj', 'Cap', '1º Ten', '2º Ten', 'Asp',
  '1º Sgt', '2º Sgt', '3º Sgt', 'Cb', 'Sd'
]
// UFs (o banco guarda a sigla; a tela exibe como PM + Estado, ex.: PMRJ)
const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]
const SITUACOES = ['Na Missão', 'Leaving', 'Previsto', 'Retornou', 'Estendido']

export default function FormularioDesdobrado({ missoes, desdobrado, aoSalvar, aoCancelar }) {
  const [tipo, setTipo] = useState(desdobrado?.tipo ?? '')
  const [missaoId, setMissaoId] = useState(desdobrado?.missao_id ?? '')
  const [posto, setPosto] = useState(desdobrado?.posto_graduacao ?? '')
  const [qms, setQms] = useState(desdobrado?.qms ?? '')
  const [estadoPm, setEstadoPm] = useState(desdobrado?.estado_pm ?? '')
  const [omOrigem, setOmOrigem] = useState(desdobrado?.om_origem ?? '')
  const [funcaoAtual, setFuncaoAtual] = useState(desdobrado?.funcao_atual ?? '')
  const [cidadeDesdobramento, setCidadeDesdobramento] = useState(desdobrado?.cidade_desdobramento ?? '')
  const [nomeGuerra, setNomeGuerra] = useState(desdobrado?.nome_guerra ?? '')
  const [nomeCompleto, setNomeCompleto] = useState(desdobrado?.nome_completo ?? '')
  const [genero, setGenero] = useState(desdobrado?.genero ?? '')
  const [telWhats, setTelWhats] = useState(desdobrado?.contato_telefone_whatsapp ?? '')
  const [email, setEmail] = useState(desdobrado?.contato_email ?? '')
  const [documento, setDocumento] = useState(desdobrado?.documento_referencia ?? '')
  const [fotoUrl, setFotoUrl] = useState(desdobrado?.foto_url ?? '')
  // Foto aguardando envio (blob local) — só vai ao bucket após salvar o registro
  const [fotoPendente, setFotoPendente] = useState(null)
  const [dataChegada, setDataChegada] = useState(desdobrado?.data_chegada ?? '')
  const [dataRetorno, setDataRetorno] = useState(desdobrado?.data_previsao_retorno ?? '')
  const [dataRetornoReal, setDataRetornoReal] = useState(desdobrado?.data_retorno_real ?? '')
  const [situacao, setSituacao] = useState(desdobrado?.situacao ?? 'Na Missão')
  const [leavingInicio, setLeavingInicio] = useState(desdobrado?.leaving_inicio ?? '')
  const [leavingFim, setLeavingFim] = useState(desdobrado?.leaving_fim ?? '')
  const [leavingDestino, setLeavingDestino] = useState(desdobrado?.leaving_destino ?? '')
  const [observacoes, setObservacoes] = useState(desdobrado?.observacoes ?? '')
  const [erro, setErro] = useState(null)
  const [modalFotoAberto, setModalFotoAberto] = useState(false)
  const [aguardando, setAguardando] = useState(false)

  // Libera a prévia local da memória do navegador (evita vazamento de blob:)
  function liberarPrevia() {
    if (fotoUrl.startsWith('blob:')) URL.revokeObjectURL(fotoUrl)
  }

  function limpar() {
    setTipo(''); setMissaoId(''); setPosto(''); setQms(''); setEstadoPm('')
    setOmOrigem(''); setFuncaoAtual(''); setCidadeDesdobramento('')
    setNomeGuerra(''); setNomeCompleto(''); setGenero(''); setTelWhats('')
    setEmail(''); setDocumento('')
    liberarPrevia()
    setFotoUrl(''); setFotoPendente(null)
    setDataChegada(''); setDataRetorno(''); setDataRetornoReal('')
    setSituacao('Na Missão'); setObservacoes('')
    setLeavingInicio(''); setLeavingFim(''); setLeavingDestino('')
    setErro(null)
  }

  // Recebe o recorte do modal e guarda LOCALMENTE — nada é enviado ao Supabase aqui
  function receberFotoRecortada(blob) {
    setModalFotoAberto(false)
    setErro(null)
    liberarPrevia()
    setFotoPendente(blob)
    setFotoUrl(URL.createObjectURL(blob)) // prévia local, sem custo de rede
  }

  // Envia a foto pendente ao bucket "fotos" e grava a URL pública no registro
  async function enviarFotoPendente(idDoRegistro) {
    const caminho = `desdobrados/${idDoRegistro}-${Date.now()}.jpg`
    const { error: erroUpload } = await supabase.storage
      .from('fotos')
      .upload(caminho, fotoPendente, { contentType: 'image/jpeg' })
    if (erroUpload) return erroUpload.message

    const { data } = supabase.storage.from('fotos').getPublicUrl(caminho)
    const { error: erroUpdate } = await supabase
      .from('desdobrados')
      .update({ foto_url: data.publicUrl })
      .eq('id', idDoRegistro)
    if (erroUpdate) return erroUpdate.message

    return null // tudo certo
  }

  async function salvar(evento) {
    evento.preventDefault()
    setErro(null)
    // Validação de datas: previsão de retorno não pode ser anterior à chegada
    if (dataChegada && dataRetorno && dataRetorno < dataChegada) {
      setErro('A previsão de retorno não pode ser anterior à data de chegada.')
      return
    }
    if (situacao === 'Leaving' && (!leavingInicio || !leavingFim || leavingFim < leavingInicio)) {
      setErro('Informe as datas de início e término do Leaving; o término não pode ser anterior ao início.')
      return
    }
    const registro = {
      missao_id: missaoId,
      tipo,
      posto_graduacao: posto,
      qms: tipo === 'Militar do EB' ? (qms.trim() || null) : null,
      estado_pm: tipo === 'Policial Militar' ? estadoPm : null,
      om_origem: omOrigem.trim() || null,
      funcao_atual: funcaoAtual.trim() || null,
      cidade_desdobramento: cidadeDesdobramento.trim() || null,
      nome_guerra: nomeGuerra.trim(),
      genero,
      nome_completo: nomeCompleto.trim(),
      contato_telefone_whatsapp: telWhats.trim() || null,
      contato_email: email.trim() || null,
      documento_referencia: documento.trim() || null,
      // Foto nova → grava null agora e atualiza depois do upload.
      // Foto mantida → regrava a URL remota. Foto removida → grava null.
      foto_url: fotoPendente ? null : (fotoUrl.trim() || null),
      data_chegada: dataChegada,
      data_previsao_retorno: dataRetorno,
      data_retorno_real: dataRetornoReal || null,
      situacao,
      leaving_inicio: situacao === 'Leaving' ? leavingInicio : (desdobrado?.leaving_inicio ?? null),
      leaving_fim: situacao === 'Leaving' ? leavingFim : (desdobrado?.leaving_fim ?? null),
      leaving_destino: situacao === 'Leaving' ? (leavingDestino.trim() || null) : (desdobrado?.leaving_destino ?? null),
      observacoes: observacoes.trim() || null
    }
    setAguardando(true)
    const { data: salvo, error } = desdobrado?.id
      ? await supabase.from('desdobrados')
          .update({ ...registro, atualizado_em: new Date().toISOString() })
          .eq('id', desdobrado.id)
          .select()
          .single()
      : await supabase.from('desdobrados').insert(registro).select().single()

    if (error) {
      setAguardando(false)
      setErro(error.message)
      return
    }

    // Registro salvo sem erro → agora sim envia a foto ao bucket
    if (fotoPendente) {
      const erroFoto = await enviarFotoPendente(salvo.id)
      if (erroFoto) {
        setAguardando(false)
        setErro(`Integrante salvo, mas o envio da foto falhou: ${erroFoto}`)
        return
      }
    }

    setAguardando(false)
    aoSalvar()
  }

  const listaPostos = tipo === 'Policial Militar' ? POSTOS_PM : POSTOS_EB
  const editando = Boolean(desdobrado?.id)
  return (
    <section className="form-desdobrado-section">
      <div className="alerta-privacidade">
        🔒 Os campos marcados com cadeado (Nome Completo, contatos, documento e observações) são
        restritos — visíveis apenas para a equipe autenticada no painel.
      </div>
      <form className="form-desdobrado" onSubmit={salvar}>
        {/* Seção 1 — Informações Básicas */}
        <h3 className="secao-titulo">Informações Básicas</h3>
        <div>
          <label>Missão da ONU *</label>
          <select value={missaoId} onChange={e => setMissaoId(e.target.value)} required>
            <option value="">Selecione a missão…</option>
            {missoes.map(m => (
              <option key={m.id} value={m.id}>{m.sigla} — {m.nome_completo}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Tipo de Força *</label>
          <select value={tipo} onChange={e => { setTipo(e.target.value); setPosto('') }} required>
            <option value="">Selecione o tipo…</option>
            <option value="Militar do EB">Militar do EB</option>
            <option value="Policial Militar">Policial Militar</option>
          </select>
        </div>
        <div>
          <label>Posto/Graduação *</label>
          <select value={posto} onChange={e => setPosto(e.target.value)} required disabled={!tipo}>
            <option value="">{tipo ? 'Selecione o posto…' : 'Escolha o tipo primeiro'}</option>
            {listaPostos.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        {tipo === 'Militar do EB' && (
          <div>
            <label>QMS</label>
            <input value={qms} onChange={e => setQms(e.target.value)}
              placeholder="Texto livre (QMS do militar do Exército)" />
          </div>
        )}
        {tipo === 'Policial Militar' && (
          <div>
            <label>Estado da PM *</label>
            <select value={estadoPm} onChange={e => setEstadoPm(e.target.value)} required>
              <option value="">Selecione a UF…</option>
              {UFS.map(uf => <option key={uf} value={uf}>PM{uf}</option>)}
            </select>
          </div>
        )}
        <div>
          <label>Nome de Guerra *</label>
          <input value={nomeGuerra} onChange={e => setNomeGuerra(e.target.value)} required
            placeholder="Nome de guerra (público — aparece no mapa)" />
        </div>
        <div>
          <label>OM de origem (opcional) 🔒</label>
          <input value={omOrigem} onChange={e => setOmOrigem(e.target.value)} placeholder="Organização Militar de origem" />
        </div>
        <div>
          <label>Função atual (opcional) 🔒</label>
          <input value={funcaoAtual} onChange={e => setFuncaoAtual(e.target.value)} placeholder="Função exercida na missão" />
        </div>
        <div>
          <label>Cidade de desdobramento (opcional) 🔒</label>
          <input value={cidadeDesdobramento} onChange={e => setCidadeDesdobramento(e.target.value)} placeholder="Cidade de desdobramento" />
        </div>
        {/* Seção 2 — Dados Sensíveis / Restritos */}
        <h3 className="secao-titulo secao-restrita">🔒 Dados Sensíveis / Restritos</h3>
        <div>
          <label>Nome Completo * 🔒</label>
          <input value={nomeCompleto} onChange={e => setNomeCompleto(e.target.value)} required
            placeholder="Nome completo do militar ou policial" />
        </div>
        <div>
          <label>Gênero * 🔒</label>
          <select value={genero} onChange={e => setGenero(e.target.value)} required>
            <option value="">Selecione…</option>
            <option value="Masculino">Masculino</option>
            <option value="Feminino">Feminino</option>
          </select>
        </div>
        <div>
          <label>Contato WhatsApp 🔒</label>
          <input value={telWhats} onChange={e => setTelWhats(e.target.value)}
            placeholder="Telefone com DDD (opcional)" />
        </div>
        <div>
          <label>Contato E-mail 🔒</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="E-mail de contato (opcional)" />
        </div>
        <div>
          <label>Documento de Referência 🔒</label>
          <input value={documento} onChange={e => setDocumento(e.target.value)}
            placeholder="Documento de referência (opcional)" />
        </div>
        <div>
          <label>Foto do Integrante</label>
          <div className="foto-upload-linha">
            {fotoUrl
              ? <img src={fotoUrl} alt="Prévia da foto" className="foto-previa" />
              : <div className="foto-previa foto-vazia">👤</div>}
            <button type="button" className="botao-secundario-form"
              onClick={() => setModalFotoAberto(true)}>
              {fotoUrl ? 'Trocar foto' : 'Selecionar foto'}
            </button>
            {fotoUrl && (
              <button type="button" className="botao-secundario-form" onClick={() => {
                liberarPrevia()
                setFotoUrl('')
                setFotoPendente(null)
              }}>
                Remover
              </button>
            )}
          </div>
        </div>
        {/* Seção 3 — Período de Desdobramento */}
        <h3 className="secao-titulo">Período de Desdobramento</h3>
        <div>
          <label>Data de Chegada *</label>
          <input type="date" value={dataChegada}
            onChange={e => setDataChegada(e.target.value)} required />
        </div>
        <div>
          <label>Previsão de Retorno *</label>
          <input type="date" value={dataRetorno}
            onChange={e => setDataRetorno(e.target.value)} required />
        </div>
        <div>
          <label>Retorno Real</label>
          <input type="date" value={dataRetornoReal}
            onChange={e => setDataRetornoReal(e.target.value)} />
        </div>
        <div>
          <label>Situação *</label>
          <select value={situacao} onChange={e => setSituacao(e.target.value)} required>
            {SITUACOES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {situacao === 'Leaving' && <>
          <h3 className="secao-titulo">Período de Leaving</h3>
          <div><label>Início do Leaving *</label><input type="date" value={leavingInicio} onChange={e => setLeavingInicio(e.target.value)} required /></div>
          <div><label>Término do Leaving *</label><input type="date" min={leavingInicio || undefined} value={leavingFim} onChange={e => setLeavingFim(e.target.value)} required /></div>
          <div className="campo-inteiro"><label>Provável destino (opcional) 🔒</label><input value={leavingDestino} onChange={e => setLeavingDestino(e.target.value)} placeholder="Cidade, país ou local de destino" /></div>
          <p className="campo-inteiro ef-leaving-aviso">Após o término, o status será atualizado automaticamente para Na Missão. O período ficará preservado no histórico.</p>
        </>}
        <div className="campo-inteiro">
          <label>Observações 🔒</label>
          <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)}
            placeholder="Anotações internas (opcional — restrito)" />
        </div>
        {modalFotoAberto && (
          <RecorteFoto aoConfirmar={receberFotoRecortada} aoFechar={() => setModalFotoAberto(false)} />
        )}
        {erro && <div className="aviso-erro campo-inteiro">Erro ao salvar: {erro}</div>}
        <div className="form-rodape campo-inteiro">
          <button type="button" className="botao-secundario-form" onClick={limpar}>
            Limpar
          </button>
          {aoCancelar && (
            <button type="button" className="botao-secundario-form" onClick={aoCancelar}>
              Cancelar
            </button>
          )}
          <button type="submit" className="botao-primario" disabled={aguardando}>
            {aguardando ? 'Salvando…' : editando ? 'Salvar Alterações' : 'Salvar Desdobrado'}
          </button>
        </div>
      </form>
    </section>
  )
}