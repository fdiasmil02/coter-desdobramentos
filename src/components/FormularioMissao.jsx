// Formulário de missão — cria ou edita; mandato em mês/ano; coordenadas via mini mapa
import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { supabase } from '../supabaseClient'
import { LISTA_PAISES } from '../paises'

// Aceita "2027-10", "10/2027", "10-2027" ou "2027-10-01" e devolve "2027-10"
function normalizarMesAno(valor) {
  if (!valor) return ''
  const v = String(valor).trim()
  if (/^\d{4}-\d{2}$/.test(v)) return v                                  // AAAA-MM (nativo do navegador)
  const m = v.match(/^(\d{1,2})[\/\-](\d{4})$/)                          // MM/AAAA ou MM-AAAA (digitação manual)
  if (m) return `${m[2]}-${String(Number(m[1])).padStart(2, '0')}`
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v.slice(0, 7)                // data completa vinda do banco
  return ''
}

// "2027-10" → "2027-10-01" (a coluna date exige dia completo)
function mesAnoParaData(valor) {
  const normalizado = normalizarMesAno(valor)
  return normalizado ? `${normalizado}-01` : null
}

// "2027-10-01" (banco) → "2027-10" (para preencher o campo na edição)
function dataParaMesAno(valor) {
  if (!valor) return ''
  return normalizarMesAno(valor)
}

// Mini mapa interativo: clique define o ponto do QG
function MiniMapa({ lat, lng, aoSelecionar }) {
  const refDiv = useRef(null)
  const refMapa = useRef(null)
  const refMarcador = useRef(null)

  useEffect(() => {
    if (refMapa.current) return
    const pontoInicial = lat && lng ? [Number(lat), Number(lng)] : [15, 10]
    const mapa = L.map(refDiv.current).setView(pontoInicial, lat && lng ? 5 : 2)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(mapa)
    if (lat && lng) refMarcador.current = L.marker(pontoInicial).addTo(mapa)
    mapa.on('click', evento => {
      const { lat: novaLat, lng: novoLng } = evento.latlng
      aoSelecionar(novaLat.toFixed(6), novoLng.toFixed(6))
      if (refMarcador.current) {
        refMarcador.current.setLatLng([novaLat, novoLng])
      } else {
        refMarcador.current = L.marker([novaLat, novoLng]).addTo(mapa)
      }
    })
    refMapa.current = mapa
  }, [])

  useEffect(() => {
    if (refMarcador.current && lat && lng) refMarcador.current.setLatLng([Number(lat), Number(lng)])
  }, [lat, lng])

  return <div ref={refDiv} className="mini-mapa" />
}

export default function FormularioMissao({ missao, aoSalvar, aoCancelar }) {
  const [sigla, setSigla] = useState(missao?.sigla ?? '')
  const [pais, setPais] = useState(missao?.pais ?? '')
  const [nomeCompleto, setNomeCompleto] = useState(missao?.nome_completo ?? '')
  const [qg, setQg] = useState(missao?.qg_missao ?? '')
  const [status, setStatus] = useState(missao?.status ?? 'Ativa')
  const [inicioMandato, setInicioMandato] = useState(dataParaMesAno(missao?.data_inicio_mandato))
  const [fimMandato, setFimMandato] = useState(dataParaMesAno(missao?.data_fim_mandato))
  const [latitude, setLatitude] = useState(missao?.latitude ?? '')
  const [longitude, setLongitude] = useState(missao?.longitude ?? '')
  const [descricao, setDescricao] = useState(missao?.descricao ?? '')
  const [erro, setErro] = useState(null)
  const [aguardando, setAguardando] = useState(false)

  async function salvar(evento) {
    evento.preventDefault()
    setErro(null)

    // Valida o formato dos meses/anos antes de tocar no banco
    if (inicioMandato.trim() !== '' && normalizarMesAno(inicioMandato) === '') {
      setErro('Início do mandato inválido — informe mês e ano, como 10/2027.')
      return
    }
    if (fimMandato.trim() !== '' && normalizarMesAno(fimMandato) === '') {
      setErro('Fim do mandato inválido — informe mês e ano, como 10/2027.')
      return
    }

    setAguardando(true)

    const registro = {
      sigla: sigla.trim().toUpperCase(),
      pais,
      nome_completo: nomeCompleto.trim(),
      qg_missao: qg.trim(),
      status,
      // Guarda sempre o dia 1º do mês escolhido
      data_inicio_mandato: mesAnoParaData(inicioMandato),
      data_fim_mandato: mesAnoParaData(fimMandato),
      latitude,
      longitude,
      descricao: descricao.trim() || null
    }

    const { error } = missao?.id
      ? await supabase.from('missoes').update(registro).eq('id', missao.id)
      : await supabase.from('missoes').insert(registro)

    setAguardando(false)
    if (error) {
      setErro(error.message)
      return
    }
    aoSalvar()
  }

  return (
    <div className="modal-overlay">
      <div className="modal modal-largo">
        <div className="modal-cabecalho">
          <div>
            <div className="modal-sigla">{missao?.id ? 'Editar Missão' : 'Gerenciar Missão'}</div>
            <div className="modal-sub">{missao?.id ? missao.sigla : 'Cadastro de nova missão'}</div>
          </div>
          <button type="button" className="modal-fechar" onClick={aoCancelar}>×</button>
        </div>

        <form className="form-missao" onSubmit={salvar}>
          <div>
            <label>Sigla da Missão *</label>
            <input value={sigla} onChange={e => setSigla(e.target.value)} required
              placeholder="Sigla oficial da missão, em letras maiúsculas" />
          </div>
          <div>
            <label>País *</label>
            <select value={pais} onChange={e => setPais(e.target.value)} required>
              <option value="">Selecione o país-sede da missão…</option>
              {LISTA_PAISES.map(p => (
                <option key={p.codigo} value={p.codigo}>{p.nome}</option>
              ))}
            </select>
          </div>
          <div className="campo-inteiro">
            <label>Nome Completo da Missão *</label>
            <input value={nomeCompleto} onChange={e => setNomeCompleto(e.target.value)} required
              placeholder="Nome oficial completo da missão das Nações Unidas" />
          </div>
          <div>
            <label>Cidade-Sede *</label>
            <input value={qg} onChange={e => setQg(e.target.value)} required
              placeholder="Cidade onde funciona o Quartel-General" />
          </div>
          <div>
            <label>Status *</label>
            <select value={status} onChange={e => setStatus(e.target.value)} required>
              <option value="Ativa">Ativa</option>
              <option value="Encerrada">Encerrada</option>
            </select>
          </div>
          <div>
            <label>Início do Mandato (mês/ano)</label>
            <input value={inicioMandato}
              onChange={e => setInicioMandato(e.target.value)}
              placeholder="MM/AAAA — ex.: 10/2015" />
          </div>
          <div>
            <label>Fim do Mandato / Renovação (mês/ano)</label>
            <input value={fimMandato}
              onChange={e => setFimMandato(e.target.value)}
              placeholder="MM/AAAA — vazio se o mandato estiver em curso" />
          </div>
          <div>
            <label>Latitude *</label>
            <input type="number" step="any" value={latitude}
              onChange={e => setLatitude(e.target.value)} required
              placeholder="Preenchido automaticamente ao clicar no mapa" />
          </div>
          <div>
            <label>Longitude *</label>
            <input type="number" step="any" value={longitude}
              onChange={e => setLongitude(e.target.value)} required
              placeholder="Preenchido automaticamente ao clicar no mapa" />
          </div>
          <div className="campo-inteiro">
            <label>📍 Selecionar no mapa interativo (clique para marcar o QG)</label>
            <MiniMapa
              lat={latitude}
              lng={longitude}
              aoSelecionar={(lat, lng) => { setLatitude(lat); setLongitude(lng) }}
            />
            <span className="dica-mapa">O clique preenche automaticamente latitude e longitude.</span>
          </div>
          <div className="campo-inteiro">
            <label>Descrição Resumida</label>
            <textarea value={descricao} onChange={e => setDescricao(e.target.value)}
              placeholder="Breve resumo do mandato da missão e da participação brasileira" />
          </div>

          {erro && <div className="aviso-erro campo-inteiro">Erro ao salvar: {erro}</div>}

          <div className="form-rodape campo-inteiro">
            <button type="button" className="botao-secundario-form" onClick={aoCancelar}>Cancelar</button>
            <button type="submit" className="botao-primario" disabled={aguardando}>
              {aguardando ? 'Salvando…' : 'Salvar Missão'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}