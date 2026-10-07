// Modal de recorte de foto — quadrado 1:1, com zoom e arrastar
import { useState, useRef, useEffect } from 'react'

const LADO = 300 // canvas de visualização (px)

export default function RecorteFoto({ aoConfirmar, aoFechar }) {
  const [imagem, setImagem] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const arrastando = useRef(null)
  const canvasRef = useRef(null)
  const imgRef = useRef(null)

  function aoSelecionarArquivo(evento) {
    const arquivo = evento.target.files[0]
    if (!arquivo) return
    const leitor = new FileReader()
    leitor.onload = () => { setImagem(leitor.result); setZoom(1); setOffset({ x: 0, y: 0 }) }
    leitor.readAsDataURL(arquivo)
  }

  // Desenha a imagem no canvas: cobre o quadrado, aplica zoom e arrasto
  useEffect(() => {
    if (!imagem || !imgRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    const img = imgRef.current
    ctx.clearRect(0, 0, LADO, LADO)
    const base = Math.max(LADO / img.width, LADO / img.height)
    const escala = base * zoom
    const largura = img.width * escala
    const altura = img.height * escala
    ctx.drawImage(img, (LADO - largura) / 2 + offset.x, (LADO - altura) / 2 + offset.y, largura, altura)
  }, [imagem, zoom, offset])

  function aoPressionar(e) {
    arrastando.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }
  }
  function aoMover(e) {
    if (!arrastando.current) return
    setOffset({
      x: arrastando.current.ox + (e.clientX - arrastando.current.x),
      y: arrastando.current.oy + (e.clientY - arrastando.current.y)
    })
  }
  function aoSoltar() { arrastando.current = null }

  function confirmar() {
    // Gera a foto final em 400x400 (JPEG) e devolve o arquivo pronto para upload
    const saida = document.createElement('canvas')
    saida.width = 400
    saida.height = 400
    saida.getContext('2d').drawImage(canvasRef.current, 0, 0, 400, 400)
    saida.toBlob(blob => { if (blob) aoConfirmar(blob) }, 'image/jpeg', 0.9)
  }

  return (
    <div className="recorte-overlay">
      <div className="recorte-caixa">
        <h3>Recortar Foto</h3>
        <input type="file" accept="image/*" onChange={aoSelecionarArquivo} />
        {imagem && (
          <>
            <canvas
              ref={canvasRef} width={LADO} height={LADO}
              onMouseDown={aoPressionar} onMouseMove={aoMover} onMouseUp={aoSoltar} onMouseLeave={aoSoltar}
              className="recorte-canvas"
            />
            <img ref={imgRef} src={imagem} alt="" className="recorte-img-oculta" />
            <label className="recorte-zoom">Zoom
              <input type="range" min="1" max="3" step="0.05" value={zoom}
                onChange={e => setZoom(Number(e.target.value))} />
            </label>
          </>
        )}
        <div className="recorte-acoes">
          <button type="button" className="botao-secundario-form" onClick={aoFechar}>Cancelar</button>
          <button type="button" className="botao-primario" onClick={confirmar} disabled={!imagem}>
            Usar esta foto
          </button>
        </div>
      </div>
    </div>
  )
}