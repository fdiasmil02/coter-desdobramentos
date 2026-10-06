// Formulário de missão — cria ou edita; mandato em mês/ano; coordenadas via mini mapa
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
  // Campos de mês/ano recebem "AAAA-MM" (corta o dia do valor salvo)
  const [inicioMandato, setInicioMandato] = useState(missao?.data_inicio_mandato?.slice(0, 7) ?? '')
  const [fimMandato, setFimMandato] = useState(missao?.data_fim_mandato?.slice(0, 7) ?? '')
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
      // Guarda o dia 1º do mês escolhido (coluna date exige data completa)
      data_inicio_mandato: inicioMandato ? `${inicioMandato}-01` : null,
      data_fim_mandato: fimMandato ? `${fimMandato}-01` : null,
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
            <input type="month" value={inicioMandato}
              onChange={e => setInicioMandato(e.target.value)}
              placeholder="Mês e ano do início do mandato" />
          </div>
          <div>
            <label>Fim do Mandato / Renovação (mês/ano)</label>
            <input type="month" value={fimMandato}
              onChange={e => setFimMandato(e.target.value)}
              placeholder="Deixe vazio se o mandato estiver em curso" />
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