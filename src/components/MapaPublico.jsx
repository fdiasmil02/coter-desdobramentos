// Mapa mundi: países com missão ativa coloridos + pin clicável com modal de detalhes
import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { nomePais } from '../paises'

const URL_GEOJSON_PAISES =
  'https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json'

export default function MapaPublico({ missoes, statsPorMissao }) {
  const refDivMapa = useRef(null)
  const refMapa = useRef(null)
  const refCamadaPaises = useRef(null)
  const refCamadaPins = useRef(null)
  const [missaoSelecionada, setMissaoSelecionada] = useState(null)

  // Cria o mapa uma única vez (tiles claros, como no protótipo)
  useEffect(() => {
    if (refMapa.current) return
    const mapa = L.map(refDivMapa.current, { worldCopyJump: true }).setView([15, 10], 2)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
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
              ? { fillColor: '#2563eb', fillOpacity: 0.35, color: '#1e40af', weight: 1 }
              : { fillColor: '#64748b', fillOpacity: 0.08, color: '#94a3b8', weight: 0.5 }
        }).addTo(mapa)
      })
  }, [missoes])

  // Pins nos QGs — o clique abre o modal de detalhes
  useEffect(() => {
    const mapa = refMapa.current
    if (!mapa) return
    if (refCamadaPins.current) mapa.removeLayer(refCamadaPins.current)

    refCamadaPins.current = L.layerGroup(
      missoes.map(m =>
        L.circleMarker([Number(m.latitude), Number(m.longitude)], {
          radius: 8,
          color: '#1e3a8a',
          fillColor: '#3b82f6',
          fillOpacity: 1,
          weight: 2
        }).on('click', () => setMissaoSelecionada(m))
      )
    ).addTo(mapa)
  }, [missoes])

  const s = missaoSelecionada ? statsPorMissao[missaoSelecionada.id] : null

  return (
    <div className="mapa-bloco">
      <div className="mapa-cabecalho">
        <h2>📍 Mapa Geográfico das Missões Ativas</h2>
        <span className="dica">Clique no marcador para ver detalhes</span>
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

      {missaoSelecionada && (
        <div className="modal-overlay" onClick={() => setMissaoSelecionada(null)}>
          <div className="modal" onClick={evento => evento.stopPropagation()}>
            <div className="modal-cabecalho">
              <div>
                <div className="modal-sigla">{missaoSelecionada.sigla}</div>
                <div className="modal-sub">
                  {nomePais(missaoSelecionada.pais)} · {missaoSelecionada.status}
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
                <span className="modal-valor">{s ? Number(s.efetivo_feminino) : 0}</span>
                <span className="modal-rotulo">Mulheres (♀)</span>
              </div>
              <div>
                <span className="modal-valor">{s ? Number(s.efetivo_leaving) : 0}</span>
                <span className="modal-rotulo">Em Leaving</span>
              </div>
              <div>
                <span className="modal-valor">{missaoSelecionada.qg_missao}</span>
                <span className="modal-rotulo">QG da Missão</span>
              </div>
            </div>
            <p className="modal-nota">
              Dados individuais dos efetivos são visíveis apenas para a equipe logada.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}