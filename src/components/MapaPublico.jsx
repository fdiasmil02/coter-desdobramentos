// Mapa mundi: pins com efetivo+sigla (estilo Skip), modal colorido e tabela completa para logados
import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { nomePais } from '../paises'
import ModalEfetivos from './ModalEfetivos'

const URL_GEOJSON_PAISES =
  'https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json'

export default function MapaPublico({ missoes, statsPorMissao, logado, focoMissao, aoFocarConcluido }) {
  const refDivMapa = useRef(null)
  const refMapa = useRef(null)
  const refCamadaPaises = useRef(null)
  const refCamadaPins = useRef(null)
  const [missaoSelecionada, setMissaoSelecionada] = useState(null)
  const [verEfetivos, setVerEfetivos] = useState(false)

  // Cria o mapa uma única vez (tiles claros do OpenStreetMap)
  useEffect(() => {
    if (refMapa.current) return
    const mapa = L.map(refDivMapa.current, { worldCopyJump: true }).setView([15, 10], 2)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19
    }).addTo(mapa)
    refMapa.current = mapa
  }, [])

  // Camada de coloração dos países que possuem missão ativa
  useEffect(() => {
    const mapa = refMapa.current
    if (!mapa) return
    const isoComMissao = new Set(missoes.map(m => m.pais))

    fetch(URL_GEOJSON_PAISES)
      .then(resposta => resposta.json())
      .then(geojson => {
        if (refCamadaPaises.current) mapa.removeLayer(refCamadaPaises.current)
        refCamadaPaises.current = L.geoJSON(geojson, {
          style: feature =>
            isoComMissao.has(feature.id)
              ? { fillColor: '#3b82f6', fillOpacity: 0.4, color: '#1e40af', weight: 1 }
              : { fillColor: '#94a3b8', fillOpacity: 0.15, color: '#cbd5e1', weight: 0.5 }
        }).addTo(mapa)
      })
  }, [missoes])

  // Pins estilo Skip: círculo com número do efetivo + sigla; clique abre o modal
  useEffect(() => {
    const mapa = refMapa.current
    if (!mapa) return
    if (refCamadaPins.current) mapa.removeLayer(refCamadaPins.current)

    refCamadaPins.current = L.layerGroup(
      missoes.map(m => {
        const s = statsPorMissao[m.id]
        const total = s ? Number(s.efetivo_total) : 0
        const icone = L.divIcon({
          className: '',
          html: `<div class="pin-efetivo"><span class="pin-num">${total}</span><span class="pin-sigla">${m.sigla}</span></div>`,
          iconSize: [56, 56],
          iconAnchor: [28, 28]
        })
        return L.marker([Number(m.latitude), Number(m.longitude)], { icon: icone })
          .on('click', () => setMissaoSelecionada(m))
      })
    ).addTo(mapa)
  }, [missoes, statsPorMissao])

  // "Ver no mapa" do painel lateral: aproxima e abre o detalhe da missão
  useEffect(() => {
    if (!focoMissao) return
    const m = missoes.find(x => x.id === focoMissao)
    if (m && refMapa.current) {
      refMapa.current.flyTo([Number(m.latitude), Number(m.longitude)], 5, { duration: 1.2 })
      setMissaoSelecionada(m)
    }
    aoFocarConcluido()
  }, [focoMissao, missoes, aoFocarConcluido])

  const s = missaoSelecionada ? statsPorMissao[missaoSelecionada.id] : null

  return (
    <div className="mapa-bloco">
      <div className="mapa-cabecalho">
        <h2>📍 Mapa Geográfico das Missões Ativas</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="badge-tempo-real">● TEMPO REAL</span>
          <span className="dica">Clique no marcador para ver detalhes</span>
        </div>
      </div>
      <div ref={refDivMapa} className="mapa" />
      <div className="legenda">
        <span className="legenda-item">
          <span className="amostra cor-pais-ativo" /> País com missão ativa
        </span>
        <span className="legenda-item">
          <span className="amostra cor-pin" /> QG da missão
        </span>
      </div>

      {missaoSelecionada && !verEfetivos && (
        <div className="modal-overlay" onClick={() => setMissaoSelecionada(null)}>
          <div className="modal" onClick={evento => evento.stopPropagation()}>
            <div className="modal-cabecalho">
              <div>
                <div className="modal-sigla">{missaoSelecionada.sigla}</div>
                <div className="modal-sub">
                  {nomePais(missaoSelecionada.pais)} · QG: {missaoSelecionada.qg_missao} · {missaoSelecionada.status}
                </div>
              </div>
              <button className="modal-fechar" onClick={() => setMissaoSelecionada(null)}>×</button>
            </div>
            <p className="modal-nome">{missaoSelecionada.nome_completo}</p>
            <div className="modal-stats">
              <div>
                <span className="modal-valor">{s ? Number(s.efetivo_total) : 0}</span>
                <span className="modal-rotulo">Efetivo Total</span>
              </div>
              <div>
                <span className="modal-valor">{s ? Number(s.efetivo_eb) : 0}</span>
                <span className="modal-rotulo">Efetivo EB</span>
              </div>
              <div>
                <span className="modal-valor">{s ? Number(s.efetivo_pm) : 0}</span>
                <span className="modal-rotulo">Efetivo PM</span>
              </div>
              <div>
                <span className="modal-valor modal-valor-rosa">{s ? Number(s.efetivo_feminino) : 0}</span>
                <span className="modal-rotulo">Mulheres (♀)</span>
              </div>
              <div>
                <span className="modal-valor modal-valor-laranja">{s ? Number(s.efetivo_leaving) : 0}</span>
                <span className="modal-rotulo">Em Leaving</span>
              </div>
            </div>

            {logado ? (
              <button className="botao-ver-efetivo" onClick={() => setVerEfetivos(true)}>
                👁️ Ver todo o efetivo
              </button>
            ) : (
              <p className="modal-nota">
                Dados individuais dos efetivos são visíveis apenas para a equipe logada.
              </p>
            )}
          </div>
        </div>
      )}

      {missaoSelecionada && verEfetivos && (
        <ModalEfetivos
          missao={missaoSelecionada}
          stats={s}
          aoFechar={() => setVerEfetivos(false)}
        />
      )}
    </div>
  )
}