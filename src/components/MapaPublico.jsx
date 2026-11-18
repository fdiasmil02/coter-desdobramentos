// Mapa mundi: pins com efetivo+sigla (estilo Skip), modal colorido e tabela completa para logados
import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { createPortal } from 'react-dom'
import { nomePais } from '../paises'
import ModalEfetivos from './ModalEfetivos'

const URL_GEOJSON_PAISES =
  'https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json'


// Distribuição automática em pixels: preserva as coordenadas reais no banco.
// Agrupa apenas pins cujos centros ficariam próximos na tela.
function distribuirPins(mapa, missoes) {
  const pontos = missoes.filter(m => Number.isFinite(Number(m.latitude)) && Number.isFinite(Number(m.longitude)))
    .map(m => ({ m, original: mapa.latLngToLayerPoint([Number(m.latitude), Number(m.longitude)]) }))
    .sort((a,b) => String(a.m.id).localeCompare(String(b.m.id)))
  const visitados = new Set(), saida = new Map()
  for (let i=0;i<pontos.length;i++) {
    if(visitados.has(i)) continue
    const grupo=[i]; visitados.add(i)
    for(let k=0;k<grupo.length;k++){
      for(let j=0;j<pontos.length;j++){
        if(visitados.has(j))continue
        if(pontos[grupo[k]].original.distanceTo(pontos[j].original)<76){visitados.add(j);grupo.push(j)}
      }
    }
    if(grupo.length===1){saida.set(pontos[i].m.id,{latlng:[Number(pontos[i].m.latitude),Number(pontos[i].m.longitude)],original:null});continue}
    const centro=L.point(grupo.reduce((v,j)=>v+pontos[j].original.x,0)/grupo.length,grupo.reduce((v,j)=>v+pontos[j].original.y,0)/grupo.length)
    const n=grupo.length
    // Até 8: círculo; acima disso: espiral para evitar colisões.
    grupo.forEach((j,k)=>{
      const ang=-Math.PI/2+2*Math.PI*k/Math.min(n,8)
      const raio=n<=8?Math.max(64,Math.ceil(n*56/(2*Math.PI))):64+14*k
      const a=n<=8?ang:-Math.PI/2+k*2.39996
      const deslocado=L.point(centro.x+Math.cos(a)*raio,centro.y+Math.sin(a)*raio)
      saida.set(pontos[j].m.id,{latlng:mapa.layerPointToLatLng(deslocado),original:[Number(pontos[j].m.latitude),Number(pontos[j].m.longitude)]})
    })
  }
  return saida
}

export default function MapaPublico({ missoes, statsPorMissao, logado, focoMissao, aoFocarConcluido }) {
  const refDivMapa = useRef(null)
  const refMapa = useRef(null)
  const refCamadaPaises = useRef(null)
  const refCamadaPins = useRef(null)
  const refPopup = useRef(null)
  const refPosicoesPins = useRef(new Map())
  const [versaoPosicoes, setVersaoPosicoes] = useState(0)
  const [popupElement, setPopupElement] = useState(null)
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

  // Recalcula posições visuais no carregamento, zoom e deslocamento do mapa.
  useEffect(() => {
    const mapa=refMapa.current
    if(!mapa)return
    function atualizar(){
      if(refCamadaPins.current)mapa.removeLayer(refCamadaPins.current)
      const posicoes=distribuirPins(mapa,missoes)
      refPosicoesPins.current=posicoes
      const elementos=[]
      missoes.forEach(m=>{
        const pos=posicoes.get(m.id)
        if(!pos)return
        const s=statsPorMissao[m.id]
        const total=s?Number(s.efetivo_total):0
        const icone=L.divIcon({
          className:'',
          html:`<div class="pin-efetivo"><span class="pin-num">${total}</span><span class="pin-sigla">${String(m.sigla).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span></div>`,
          iconSize:[56,56],iconAnchor:[28,28]
        })
        if(pos.original) elementos.push(L.polyline([pos.original,pos.latlng],{color:'#64748b',weight:1.5,opacity:0.7,dashArray:'4 5',interactive:false}))
        elementos.push(L.marker(pos.latlng,{icon:icone}).on('click',()=>{setVerEfetivos(false);setMissaoSelecionada(m)}))
      })
      refCamadaPins.current=L.layerGroup(elementos).addTo(mapa)
      setVersaoPosicoes(v=>v+1)
    }
    atualizar()
    mapa.on('zoomend moveend',atualizar)
    return ()=>{mapa.off('zoomend moveend',atualizar);if(refCamadaPins.current){mapa.removeLayer(refCamadaPins.current);refCamadaPins.current=null}}
  },[missoes,statsPorMissao])

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

  useEffect(() => {
    const mapa = refMapa.current
    if (!mapa || !missaoSelecionada || verEfetivos) {
      if (refPopup.current) { refPopup.current.remove(); refPopup.current = null }
      setPopupElement(null)
      return
    }
    const ponto = refPosicoesPins.current.get(missaoSelecionada.id)?.latlng || [Number(missaoSelecionada.latitude), Number(missaoSelecionada.longitude)]
    const popup = L.popup({ className: 'popup-missao', maxWidth: 460, minWidth: 300, autoPan: true, autoPanPadding: [24, 24], closeButton: false, offset: [0, -24] })
      .setLatLng(ponto)
      .setContent(document.createElement('div'))
      .openOn(mapa)
    refPopup.current = popup
    setPopupElement(popup.getContent())
    const fechar = () => { setMissaoSelecionada(atual => atual?.id === missaoSelecionada.id ? null : atual) }
    mapa.on('popupclose', fechar)
    return () => {
      setPopupElement(null)
      mapa.off('popupclose', fechar)
      popup.remove()
      if (refPopup.current === popup) refPopup.current = null
    }
  }, [missaoSelecionada, verEfetivos, versaoPosicoes])

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

      {missaoSelecionada && !verEfetivos && popupElement && createPortal(
        
          <div className="modal modal-pin" onClick={evento => evento.stopPropagation()}>
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
                <span className="modal-valor modal-valor-branco">{s ? Number(s.efetivo_total) : 0}</span>
                <span className="modal-rotulo">Efetivo Total</span>
              </div>
              <div>
                <span className="modal-valor modal-valor-verde">{s ? Number(s.efetivo_eb) : 0}</span>
                <span className="modal-rotulo">Efetivo EB</span>
              </div>
              <div>
                <span className="modal-valor modal-valor-azul">{s ? Number(s.efetivo_pm) : 0}</span>
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
          </div>, popupElement
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