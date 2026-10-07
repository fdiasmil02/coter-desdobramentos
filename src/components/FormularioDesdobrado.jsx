// Formulário de cadastro/edição de desdobrado — campos espelham a tabela desdobrados
import { useState } from 'react'
import { supabase } from '../supabaseClient'

// Lista validada de posto/graduação — EB: Gen Ex a Sd; PM: Cel a Sd
const POSTOS_EB = [
  'Gen Ex', 'Gen Div', 'Gen Bda', 'Cel', 'Ten Cel', 'Maj', 'Cap',
  '1º Ten', '2º Ten', 'Asp', 'S Ten', '1º Sgt', '2º Sgt', '3º Sgt', 'Cb', 'Sd'
]
const POSTOS_PM = [
  'Cel', 'Ten Cel', 'Maj', 'Cap', '1º Ten', '2º Ten',
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
  const [nomeGuerra, setNomeGuerra] = useState(desdobrado?.nome_guerra ?? '')
  const [nomeCompleto, setNomeCompleto] = useState(desdobrado?.nome_completo ?? '')
  const [genero, setGenero] = useState(desdobrado?.genero ?? '')
  const [telWhats, setTelWhats] = useState(desdobrado?.contato_telefone_whatsapp ?? '')
  const [email, setEmail] = useState(desdobrado?.contato_email ?? '')
  const [documento, setDocumento] = useState(desdobrado?.documento_referencia ?? '')
  const [fotoUrl, setFotoUrl] = useState(desdobrado?.foto_url ?? '')
  const [dataChegada, setDataChegada] = useState(desdobrado?.data_chegada ?? '')
  const [dataRetorno, setDataRetorno] = useState(desdobrado?.data_previsao_retorno ?? '')
  const [dataRetornoReal, setDataRetornoReal] = useState(desdobrado?.data_retorno_real ?? '')
  const [situacao, setSituacao] = useState(desdobrado?.situacao ?? 'Na Missão')
  const [observacoes, setObservacoes] = useState(desdobrado?.observacoes ?? '')
  const [erro, setErro] = useState(null)
  const [aguardando, setAguardando] = useState(false)

  function limpar() {
    setTipo(''); setMissaoId(''); setPosto(''); setQms(''); setEstadoPm('')
    setNomeGuerra(''); setNomeCompleto(''); setGenero(''); setTelWhats('')
    setEmail(''); setDocumento(''); setFotoUrl(''); setDataChegada('')
    setDataRetorno(''); setDataRetornoReal(''); setSituacao('Na Missão'); setObservacoes('')
    setErro(null)
  }

  async function salvar(evento) {
    evento.preventDefault()
    setErro(null)

    // Validação de datas: previsão de retorno não pode ser anterior à chegada
    if (dataChegada && dataRetorno && dataRetorno < dataChegada) {
      setErro('A previsão de retorno não pode ser anterior à data de chegada.')
      return
    }

    const registro = {
      missao_id: missaoId,
      tipo,
      posto_graduacao: posto,
      qms: tipo === 'Militar do EB' ? (qms.trim() || null) : null,
      estado_pm: tipo === 'Policial Militar' ? estadoPm : null,
      nome_guerra: nomeGuerra.trim(),
      genero,
      nome_completo: nomeCompleto.trim(),
      contato_telefone_whatsapp: telWhats.trim() || null,
      contato_email: email.trim() || null,
      documento_referencia: documento.trim() || null,
      foto_url: fotoUrl.trim() || null,
      data_chegada: dataChegada,
      data_previsao_retorno: dataRetorno,
      data_retorno_real: dataRetornoReal || null,
      situacao,
      observacoes: observacoes.trim() || null
    }

    setAguardando(true)
    const { error } = desdobrado?.id
      ? await supabase.from('desdobrados')
          .update({ ...registro, atualizado_em: new Date().toISOString() })
          .eq('id', desdobrado.id)
      : await supabase.from('desdobrados').insert(registro)
    setAguardando(false)

    if (error) {
      setErro(error.message)
      return
    }
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
          <label>Foto (URL)</label>
          <input value={fotoUrl} onChange={e => setFotoUrl(e.target.value)}
            placeholder="Endereço da foto (opcional — sem foto, exibe avatar)" />
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
        <div className="campo-inteiro">
          <label>Observações 🔒</label>
          <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)}
            placeholder="Anotações internas (opcional — restrito)" />
        </div>

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