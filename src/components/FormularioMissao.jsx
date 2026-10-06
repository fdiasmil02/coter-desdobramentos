// Formulário de missão — cria ou edita; coordenadas capturadas por clique no mini mapa
import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { supabase } from '../supabaseClient'
import { LISTA_PAISES } from '../paises'

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

  // Sincroniza o marcador quando as coordenadas mudam pelo teclado
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
  const [inicioMandato, setInicioMandato] = useState(missao?.inicio_mandato ?? '')
  const [fimMandato, setFimMandato] = useState(missao?.fim_mandato ?? '')
  const [latitude, setLatitude] = useState(missao?.latitude ?? '')
  const [longitude, setLongitude] = useState(missao?.longitude ?? '')
  const [descricao, setDescricao] = useState(missao?.descricao ?? '')
  const [erro, setErro] = useState(null)
  const [aguardando, setAguardando] = useState(false)

  async function salvar(evento) {
    evento.preventDefault()
    setErro(null)
    setAguardando(true)

    const registro = {
      sigla: sigla.trim().toUpperCase(),
      pais,
      nome_completo: nomeCompleto.trim(),
      qg_missao: qg.trim(),
      status,
      inicio_mandato: inicioMandato || null,
      fim_mandato: fimMandato || null,
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
            <input value={sigla} onChange={e => setSigla(e.target.value)} required placeholder="UNIFIL" />
          </div>
          <div>
            <label>País *</label>
            <select value={pais} onChange={e => setPais(e.target.value)} required>
              <option value="">Selecione o país…</option>
              {LISTA_PAISES.map(p => (
                <option key={p.codigo} value={p.codigo}>{p.nome}</option>
              ))}
            </select>
          </div>
          <div className="campo-inteiro">
            <label>Nome Completo da Missão *</label>
            <input value={nomeCompleto} onChange={e => setNomeCompleto(e.target.value)} required
              placeholder="Força Interina das Nações Unidas no Líbano" />
          </div>
          <div>
            <label>Cidade-Sede *</label>
            <input value={qg} onChange={e => setQg(e.target.value)} required placeholder="Naqoura" />
          </div>
          <div>
            <label>Status *</label>
            <select value={status} onChange={e => setStatus(e.target.value)} required>
              <option value="Ativa">Ativa</option>
              <option value="Encerrada">Encerrada</option>
            </select>
          </div>
          <div>
            <label>Início Mandato</label>
            <input type="date" value={inicioMandato} onChange={e => setInicioMandato(e.target.value)} />
          </div>
          <div>
            <label>Fim Mandato / Renovação</label>
            <input type="date" value={fimMandato} onChange={e => setFimMandato(e.target.value)} />
          </div>
          <div>
            <label>Latitude *</label>
            <input type="number" step="any" value={latitude}
              onChange={e => setLatitude(e.target.value)} required placeholder="33.37" />
          </div>
          <div>
            <label>Longitude *</label>
            <input type="number" step="any" value={longitude}
              onChange={e => setLongitude(e.target.value)} required placeholder="35.49" />
          </div>
          <div className="campo-inteiro">
            <label>📍 Selecionar no mapa interativo (clique para marcar o QG)</label>
            <MiniMapa lat={latitude} lng={longitude} aoSelecionar={(lat, lng) => { setLatitude(lat); setLongitude(lng) }} />
            <span className="dica-mapa">O clique preenche automaticamente latitude e longitude.</span>
          </div>
          <div className="campo-inteiro">
            <label>Descrição Resumida</label>
            <textarea value={descricao} onChange={e => setDescricao(e.target.value)}
              placeholder="Resumo do mandato e da participação brasileira…" />
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