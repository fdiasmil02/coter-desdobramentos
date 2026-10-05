// Mapa mundi: países com missão ativa coloridos + pin no QG de cada missão
import { useEffect, useRef } from 'react'
import L from 'leaflet'

// Contornos dos países (GeoJSON público, carregado uma vez)
const URL_GEOJSON_PAISES =
  'https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json'

export default function MapaPublico({ missoes, statsPorMissao }) {
  const refDivMapa = useRef(null)
  const refMapa = useRef(null)
  const refCamadaPaises = useRef(null)
  const refCamadaPins = useRef(null)

  // Cria o mapa uma única vez
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
              : { fillColor: '#64748b', fillOpacity: 0.05, color: '#94a3b8', weight: 0.5 }
        }).addTo(mapa)
      })
  }, [missoes])

  // Pins nos QGs das missões, com resumo ao clicar
  useEffect(() => {
    const mapa = refMapa.current
    if (!mapa) return
    if (refCamadaPins.current) mapa.removeLayer(refCamadaPins.current)

    refCamadaPins.current = L.layerGroup(
      missoes.map(m => {
        const s = statsPorMissao[m.id]
        const popup = `
          <strong>${m.sigla}</strong><br/>
          ${m.nome_completo}<br/>
          QG: ${m.qg_missao}<br/>
          Efetivo sob comando da ONU: <strong>${s ? Number(s.efetivo_total) : 0}</strong><br/>
          Mulheres: <strong>${s ? Number(s.efetivo_feminino) : 0}</strong>
        `
        return L.circleMarker([Number(m.latitude), Number(m.longitude)], {
          radius: 8,
          color: '#1e3a8a',
          fillColor: '#3b82f6',
          fillOpacity: 1,
          weight: 2
        }).bindPopup(popup)
      })
    ).addTo(mapa)
  }, [missoes, statsPorMissao])

  return (
    <div className="mapa-bloco">
      <div ref={refDivMapa} className="mapa" />
      <div className="legenda">
        <span className="legenda-item">
          <span className="amostra cor-pais-ativo" /> País com missão ativa
        </span>
        <span className="legenda-item">
          <span className="amostra cor-pin" /> QG da missão
        </span>
      </div>
    </div>
  )
}