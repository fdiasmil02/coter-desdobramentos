import { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabaseClient'
import { nomePais } from '../paises'

const W=1280,H=720
const STORAGE='bcs-layout-v1'
const ATIVOS=['Na Missão','Leaving','Estendido']
const MAPA='https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json'
const POS={
 MINURSO:[130,89,222,120], MINUSCA:[406,80,253,125],
 UNGSC:[711,89,174,116], UNHQ:[711,89,174,116],
 UNFICYP:[1040,104,222,112], UNIFIL:[1100,298,170,115],
 UNTMIS:[1030,433,238,118], UNMISS:[780,552,254,116],
 MONUSCO:[480,538,269,130], UNVMC:[24,220,236,122],
 DH:[8,371,335,183]
}
const TITULOS={UNGSC:'UNHQ',UNTMIS:'UNTMIS/UNSOM',DH:'DESMINAGEM HUMANITÁRIA'}
const NOMES={MINURSO:'Saara Ocidental',MINUSCA:'República Centro-Africana',MONUSCO:'República Democrática do Congo',UNMISS:'Sudão do Sul',UNIFIL:'Líbano',UNFICYP:'Chipre',UNVMC:'Colômbia',UNTMIS:'Somália',UNGSC:'Brindisi – Itália',UNHQ:'Brindisi – Itália',DH:'Colômbia'}
const GRUPOS=['GMI','GATI','MIADH','CIDES','Não identificado']
const GRUPOS_NOMES=['Grupo de Monitores Internacionais','Grupo de Assessores Técnicos Internacionais','Missão de Instrutores e Assessores de Desminagem Humanitária','Centro Internacional de Desminagem','Não identificado']
const LOGO_ESQ='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADkAAABKCAMAAAA2cAzYAAAASFBMVEUFk9vy4gQFBQwSljoBjkTYHxr18/OuiQvkahMdla5lsyamziHbsAobGSGrpxXgXlejsE2eyVCh1O5WrJInJCTrop5koGZftuabXRWbAAAAGHRSTlP//gn/////jf/////2XPf//////4////+QDpO9AAADCklEQVR42p2WjbaCIAyARxqlIqaYvv+b3v2Akgrq3TnBRD422JjB4wHqvgBiRJr3PTEKgMiXej9vino9YvLdPbuOlA64w6eOBt6+D887stMoX6+EXuvn88s9IqHfkDKPCK2BJwQS+++XBr76Czzjl6R3HY1T82YC53VffoXL8VLdc0uiaI0N4A+XQIWeUOWjBC19R7ZZW0j7+Xy0/oiADo1v8ZX0vfaaXcgKAAZNzQwwa2w0PaFKLb8aSNEzv4Tqh5y1ngceZ2UICA/IGvMxCeSKn691QAZZUwawnVnZkDAwx6jXZGQeSPhxkKEteV1W0t0k3UKa27cskNO/bRbZjVYuvc+izKF9kyGL8r9kmUPzZA7NkXVRZBzOkSLVv8lUbC6QidhcIBNbvWLzGD0ny0RscqRtUGqW6XYmoD023FR3s68I5D42l8ldbK6S+1O6TO7Q6za3GXEaz4YuTFGzvsYGK0mvwLmzTChLIetqLVa9wmD3J3mLfnpyiY1zfe96N10nA+pU5D6PVX2WLENYK8sDdqoqN1mLLmAJyO1zjc2kPIs/Ix8DlznbqDAhaSxiRmEnizhIx7MRJ+Q0eDphJpDVGSmnJLPZz+skoxWdD0qj/I5VXG9TJKOhnlYTkQ2mVSAhSUpsXPJbBqaOagLHJpCJmuaM/39rrNQgGqw3Khx9lSdPtuYoE1DUGptf+XjyYY6yL2z86KNhTCvkK0/uUP6bwCSYPLlF2Vkm2zxZbsshO8ukN8qZdEj+xmZSAj3EaO1vidyYZr0xfqmdSU+CsseZsCZIbHIlyWhxmH1R6V8yT0wGEl3Ik2U4YGsgJtnfE1LQj7ICBvLR+ruX3KfEZlrAlRzN9mwbOdtmHa6cMuOWZNSWqXjWvv6FTcakoEWWjCyuJN22Ede0WZtj+0NEqM/9Y9JADEbeEtpiuJYaX6x/dgryBtp2Mz8WNEusxWMNNQGPl+o7Gmx/pm5INDtSTuMnxJdl+iwY2HF7kliCrQliEdtzRySz7TiOnKYjUQfcMRloL4kZKfJc/gBe3Dp40bI/TAAAAABJRU5ErkJggg=='
const LOGO_DIR='data:image/png;base64,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'
const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase()
function grupoDH(r){
 const f=norm(r.funcao_atual),c=norm(r.cidade_desdobramento)
 for(const g of ['CIDES','GMI','GATI','MIADH']) if(new RegExp('\\b'+g+'\\b').test(f))return g
 for(const g of ['CIDES','GMI','GATI','MIADH']) if(new RegExp('\\b'+g+'\\b').test(c))return g
 if(/\bMONITOR\b/.test(f))return 'GMI'
 return 'Não identificado'
}
function resumo(rows){
 const eb=rows.filter(r=>r.tipo==='Militar do EB'),pm=rows.filter(r=>r.tipo==='Policial Militar')
 return {eb:eb.length,pm:pm.length,feb:eb.filter(r=>r.genero==='Feminino').length,fpm:pm.filter(r=>r.genero==='Feminino').length,leb:eb.filter(r=>r.situacao==='Leaving').length,lpm:pm.filter(r=>r.situacao==='Leaving').length,total:rows.length}
}
function dataBR(d){
 const p=new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',year:'2-digit'}).formatToParts(d)
 const v=k=>p.find(x=>x.type===k)?.value
 return v('day')+' '+['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'][Number(v('month'))-1]+' '+v('year')
}
const proj=(lon,lat)=>[(Number(lon)+180)*W/360,73+(83-Number(lat))*594/145]
function poligono(g){
 const ps=g.type==='Polygon'?[g.coordinates]:g.type==='MultiPolygon'?g.coordinates:[]
 return ps.map(p=>p.map(r=>r.map((pt,i)=>{const [x,y]=proj(pt[0],pt[1]);return (i?'L':'M')+x.toFixed(1)+','+y.toFixed(1)}).join('')+'Z').join('')).join('')
}
function posicao(m,i,layout){return layout[m.sigla]||POS[m.sigla]||[355+(i%3)*220,205+Math.floor(i%9/3)*105,210,100]}
function linhas(m,s,grupos){
 const a=[{t:TITULOS[m.sigla]||m.sigla,size:23,bold:true}]
 if(m.sigla==='DH'){
   for(let i=0;i<4;i++)a.push({t:GRUPOS[i]+': '+grupos[GRUPOS[i]],size:19,bold:true})
   if(grupos['Não identificado'])a.push({t:'Não identificado: '+grupos['Não identificado'],size:15})
   a.push({t:'(Colômbia) — EB: '+s.eb+' Mil'+(s.pm?' | PM: '+s.pm:''),size:19,bold:true})
   if(s.feb||s.fpm)a.push({t:'Mulheres: '+(s.feb+s.fpm),size:15})
 }else{
   if(['UNGSC','UNHQ'].includes(m.sigla))a.push({t:'Base Log ONU',size:16})
   a.push({t:'('+(NOMES[m.sigla]||nomePais(m.pais))+')',size:17})
   if(s.eb||!s.pm)a.push({t:'EB: '+s.eb+' Mil'+(s.feb?' ('+s.feb+'F)':''),size:21,bold:true})
   if(s.pm)a.push({t:'PM: '+s.pm+(s.fpm?' ('+s.fpm+'F)':''),size:21,bold:true})
 }
 if(s.leb||s.lpm)a.push({t:'Leaving/CTO: '+[s.leb?s.leb+' EB':null,s.lpm?s.lpm+' PM':null].filter(Boolean).join(' + '),size:15,italic:true})
 return a
}
function blocosTexto(ls,x,y,w,h){
 const total=ls.reduce((s,l)=>s+l.size+3,0)
 const k=Math.min(1,(h-12)/total)
 let cur=y+(h-total*k)/2
 return ls.map(l=>{const size=l.size*k;const altura=(l.size+3)*k;const b={...l,size,x:x+5,y:cur,w:w-10,h:altura};cur+=altura;return b})
}
function seta(b,m){
 const [x,y,w,h]=b
 const [tx,ty]=proj(m.longitude,m.latitude)
 const cx=x+w/2,cy=y+h/2,dx=tx-cx,dy=ty-cy
 const k=Math.min((w/2)/Math.max(Math.abs(dx),.001),(h/2)/Math.max(Math.abs(dy),.001),1)
 return [cx+dx*k,cy+dy*k,tx,ty]
}
async function svgPNG(svg,largura){
 const xml=new XMLSerializer().serializeToString(svg)
 const url=URL.createObjectURL(new Blob([xml],{type:'image/svg+xml;charset=utf-8'}))
 try{
  const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error('Falha ao renderizar o slide.'));i.src=url})
  const canvas=document.createElement('canvas');canvas.width=largura;canvas.height=Math.round(largura*H/W)
  const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,canvas.width,canvas.height)
  return canvas.toDataURL('image/png')
 }finally{URL.revokeObjectURL(url)}
}
function baixar(url,nome){const a=document.createElement('a');a.href=url;a.download=nome;a.click()}
function textoSVG(t,i){return <text key={i} x={t.x+t.w/2} y={t.y+t.h/2} dominantBaseline="central" textAnchor="middle" fontSize={t.size} fontWeight={t.bold?'700':'400'} fontStyle={t.italic?'italic':'normal'} fill={t.color||'#172117'}>{t.t}</text>}

export default function BriefingBCS(){
 const [dados,setDados]=useState(null),[geo,setGeo]=useState(null),[erro,setErro]=useState(''),[aviso,setAviso]=useState(''),[carregando,setCarregando]=useState(false),[exportando,setExportando]=useState(false),[edicao,setEdicao]=useState(false),[resolucao,setResolucao]=useState('1920')
 const [layout,setLayout]=useState(()=>{try{return JSON.parse(localStorage.getItem(STORAGE)||'{}')||{}}catch{return {}}})
 const svgRef=useRef(null),areaRef=useRef(null),drag=useRef(null)
 async function carregar(){
  setCarregando(true);setErro('');setAviso('')
  try{
   const {data:userData,error:userError}=await supabase.auth.getUser()
   if(userError||!userData?.user)throw new Error('Entre no sistema para gerar o BCS.')
   const {data:perfil,error:perfilError}=await supabase.from('perfis').select('nivel').eq('id',userData.user.id).maybeSingle()
   if(perfilError||!['admin','super_admin'].includes(perfil?.nivel))throw new Error('A geração do BCS exige perfil administrativo.')
   const {data:missoes,error:em}=await supabase.from('missoes').select('id,sigla,pais,qg_missao,status,latitude,longitude').order('sigla')
   if(em)throw em
   let rows=[]
   for(let inicio=0;;inicio+=500){
    const {data,error}=await supabase.from('desdobrados').select('id,missao_id,tipo,genero,situacao,funcao_atual,cidade_desdobramento').in('situacao',ATIVOS).order('id').range(inicio,inicio+499)
    if(error)throw error
    rows.push(...(data||[]));if((data||[]).length<500)break
   }
   const lista=(missoes||[]).filter(m=>m.status==='Ativa'||rows.some(r=>r.missao_id===m.id))
   const grupos=Object.fromEntries(GRUPOS.map(g=>[g,0]))
   const dhIds=new Set(lista.filter(m=>m.sigla==='DH').map(m=>m.id))
   const dh=rows.filter(r=>dhIds.has(r.missao_id))
   dh.forEach(r=>grupos[grupoDH(r)]++)
   setDados({lista,rows,dh,grupos,data:new Date()})
   const resposta=await fetch(MAPA)
   if(!resposta.ok)throw new Error('Mapa geográfico indisponível.')
   setGeo(await resposta.json())
  }catch(e){setErro(e.message||'Não foi possível atualizar o BCS.')}finally{setCarregando(false)}
 }
 useEffect(()=>{carregar()},[])
 const lista=dados?.lista||[],rows=dados?.rows||[],grupos=dados?.grupos||Object.fromEntries(GRUPOS.map(g=>[g,0]))
 const cards=lista.map((m,i)=>{const s=resumo(rows.filter(r=>r.missao_id===m.id)),b=posicao(m,i,layout);return {m,s,b,ls:blocosTexto(linhas(m,s,grupos),...b),fill:m.sigla==='DH'?'#F4C43A':['UNGSC','UNHQ'].includes(m.sigla)?'#F2E83C':'#87AD70'}})
 const total=resumo(rows),oea=resumo(dados?.dh||[]),onu=resumo(rows.filter(r=>!(dados?.dh||[]).some(d=>d.id===r.id)))
 const qtdONU=lista.filter(m=>m.sigla!=='DH').length
 const qtdOEA=Number(grupos.GMI>0)+Number(grupos.GATI>0)+Number(grupos.MIADH+grupos.CIDES>0)
 const data=dados?dataBR(dados.data):''
 const paises=new Set(lista.map(m=>m.pais))
 const resumoQuadro=[{titulo:'ONU',fundo:'#466C35',cor:'#B2CF9D',linhas:[qtdONU+' Missões',onu.eb+' Mil EB',onu.pm+' PM']},{titulo:'OEA',fundo:'#8C6900',cor:'#F5D66D',linhas:[qtdOEA+' Missões',oea.eb+' Mil EB',oea.pm+' PM']},{titulo:'Mulheres',fundo:'#687584',cor:'#E1E5E8',linhas:['Desdobradas',total.feb+' EB',total.fpm+' PM']}]
 const rodape='TOTAL DE MILITARES DESDOBRADOS: '+total.eb+' Mil EB e '+total.pm+' PMs'
 function ponto(e){const p=svgRef.current.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(svgRef.current.getScreenCTM().inverse())}
 function iniciar(e,c){if(!edicao)return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);const p=ponto(e);drag.current={sigla:c.m.sigla,dx:p.x-c.b[0],dy:p.y-c.b[1],w:c.b[2],h:c.b[3]}}
 function mover(e){if(!drag.current)return;const d=drag.current,p=ponto(e);setLayout(old=>({...old,[d.sigla]:[Math.max(0,Math.min(W-d.w,p.x-d.dx)),Math.max(75,Math.min(670-d.h,p.y-d.dy)),d.w,d.h]}))}
 async function exportarPNG(){
  setExportando(true);setErro('')
  try{baixar(await svgPNG(svgRef.current,Number(resolucao)),'BCS-'+data.replace(/ /g,'-')+'.png')}catch(e){setErro(e.message)}finally{setExportando(false)}
 }
 async function exportarPPTX(){
  setExportando(true);setErro('')
  try{
   const {default:PptxGenJS}=await import('pptxgenjs')
   const pptx=new PptxGenJS();pptx.layout='LAYOUT_WIDE';pptx.author='Divisão de Missão de Paz';pptx.subject='Briefing de Consciência Situacional';pptx.title='BCS - '+data
   const slide=pptx.addSlide(),X=v=>v/96,Y=v=>v/96
   const rect=(x,y,w,h,color,round=false)=>slide.addShape(round?pptx.ShapeType.roundRect:pptx.ShapeType.rect,{x:X(x),y:Y(y),w:X(w),h:Y(h),rectRadius:.12,fill:{color:color.replace('#','')},line:{color:color.replace('#',''),transparency:100}})
   const txt=(t)=>slide.addText(t.t,{x:X(t.x),y:Y(t.y),w:X(t.w),h:Y(t.h),fontFace:'Arial',fontSize:t.size*.75,bold:!!t.bold,italic:!!t.italic,color:(t.color||'#172117').replace('#',''),align:t.align||'center',valign:'mid',margin:0,breakLine:false,fit:'shrink'})
   // Apenas o mapa é rasterizado; caixas, textos, rodapé, tabela e setas continuam editáveis.
   const mapaSvg=svgRef.current.cloneNode(true)
   for(const el of [...mapaSvg.children])if(el.getAttribute('data-map')!=='true'&&el.tagName.toLowerCase()!=='defs')el.remove()
   slide.addImage({data:await svgPNG(mapaSvg,2560),x:0,y:0,w:X(W),h:Y(H)})
   rect(0,18,W,52,'#1476AF')
   txt({t:'Ch Mis Paz Av/IGPM / Divisão de Missão de Paz',x:95,y:18,w:1090,h:52,size:28,bold:true,color:'#FFFFFF'})
   slide.addImage({data:LOGO_ESQ,x:X(30),y:Y(8),w:X(48),h:Y(64)})
   slide.addImage({data:LOGO_DIR,x:X(1197),y:Y(7),w:X(55),h:Y(65)})
   for(const c of cards){
    if(c.m.latitude==null||c.m.longitude==null)continue
    const [x1,y1,x2,y2]=seta(c.b,c.m)
    slide.addShape(pptx.ShapeType.line,{x:X(Math.min(x1,x2)),y:Y(Math.min(y1,y2)),w:X(Math.abs(x2-x1)),h:Y(Math.abs(y2-y1)),flipH:x2<x1,flipV:y2<y1,line:{color:'E92626',width:3,endArrowType:'triangle'}})
   }
   for(const c of cards){rect(...c.b,c.fill,true);c.ls.forEach(txt)}
   resumoQuadro.forEach((q,i)=>{const x=8+i*111;rect(x,559,109,40,q.fundo);rect(x,601,109,66,q.cor);txt({t:q.titulo,x,y:559,w:109,h:40,size:17,color:'#FFFFFF',bold:true});q.linhas.forEach((l,j)=>txt({t:l,x,y:603+j*20,w:109,h:20,size:15}))})
   rect(0,675,W,45,'#1476AF');rect(984,675,296,45,'#F2E83C')
   txt({t:rodape,x:12,y:675,w:958,h:45,size:21,color:'#FFFFFF',bold:true,align:'left'})
   txt({t:'Atualizado em '+data,x:986,y:675,w:292,h:45,size:17,bold:true})
   await pptx.writeFile({fileName:'BCS-'+data.replace(/ /g,'-')+'.pptx'})
  }catch(e){setErro('Erro ao exportar PowerPoint: '+e.message)}finally{setExportando(false)}
 }
 const podeExportar=!!dados&&!!geo&&!carregando&&!exportando
 return <section className="admin-secao">
  <div className="admin-topo"><div><h2>Briefing de Consciência Situacional — BCS</h2><p className="admin-instrucao">Slide institucional 16:9 gerado a partir do efetivo atualmente desdobrado.</p></div></div>
  <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:12}}>
   <button className="botao-secundario-form" onClick={carregar} disabled={carregando||exportando}>↻ Atualizar dados</button>
   <button className="botao-secundario-form" onClick={()=>setEdicao(v=>!v)} disabled={!dados}>{edicao?'✓ Concluir edição':'✥ Editar posições'}</button>
   <button className="botao-secundario-form" onClick={()=>{try{localStorage.setItem(STORAGE,JSON.stringify(layout));setAviso('Layout salvo neste navegador.')}catch{setErro('Não foi possível salvar o layout.')}}}>Salvar layout</button>
   <button className="botao-secundario-form" onClick={()=>{setLayout({});try{localStorage.removeItem(STORAGE)}catch{}setAviso('Layout original restaurado.')}}>Restaurar layout</button>
   <button className="botao-secundario-form" onClick={()=>areaRef.current?.requestFullscreen?.().catch(()=>setErro('Tela cheia indisponível.'))} disabled={!dados}>⛶ Tela cheia</button>
   <select aria-label="Resolução PNG" value={resolucao} onChange={e=>setResolucao(e.target.value)}><option value="1920">PNG Full HD</option><option value="3840">PNG 4K</option></select>
   <button className="botao-primario" disabled={!podeExportar} onClick={exportarPNG}>Exportar PNG</button>
   <button className="botao-primario" disabled={!podeExportar} onClick={exportarPPTX}>Exportar PPTX</button>
  </div>
  {erro&&<div className="aviso-erro" role="alert">{erro}</div>}
  {aviso&&<div className="msg-sucesso" role="status">{aviso}</div>}
  {carregando&&<p>Atualizando dados e mapa…</p>}
  {exportando&&<p>Gerando arquivo…</p>}
  {edicao&&<p>Arraste as caixas das missões; as setas acompanham a posição. Salve o layout para reutilizá-lo neste navegador.</p>}
  {!!grupos['Não identificado']&&<p className="aviso-erro">{grupos['Não identificado']} integrante(s) da DH sem grupo identificado. Confira função e cidade.</p>}
  {dados&&<div ref={areaRef} style={{background:'#fff',display:'flex',alignItems:'center',justifyContent:'center',border:'1px solid #bac6d0'}}>
   <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" viewBox={'0 0 '+W+' '+H} style={{width:'100%',height:'auto',maxHeight:'100vh',fontFamily:'Arial, sans-serif',display:'block',touchAction:edicao?'none':'auto'}} role="img" aria-label="Slide do Briefing de Consciência Situacional">
    <defs><marker id="bcs-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#E92626"/></marker><clipPath id="bcs-mapclip"><rect x="0" y="73" width={W} height="594"/></clipPath></defs>
    <g data-map="true"><rect width={W} height={H} fill="#F3F9FC"/><g clipPath="url(#bcs-mapclip)">{geo?.features?.filter(f=>f.id!=='ATA'&&f.geometry).map((f,i)=><path key={f.id||i} d={poligono(f.geometry)} fill={paises.has(f.id)?'#E8CF37':'#3183CD'} stroke="#A5D9F2" strokeWidth=".7" fillRule="evenodd"/>)}</g></g>
    <rect x="0" y="18" width={W} height="52" fill="#1476AF"/>
    {textoSVG({t:'Ch Mis Paz Av/IGPM / Divisão de Missão de Paz',x:95,y:18,w:1090,h:52,size:28,bold:true,color:'#fff'},'cab')}
    <image href={LOGO_ESQ} x="30" y="8" width="48" height="64"/>
    <image href={LOGO_DIR} x="1197" y="7" width="55" height="65"/>
    {cards.filter(c=>c.m.latitude!=null&&c.m.longitude!=null).map(c=>{const [x1,y1,x2,y2]=seta(c.b,c.m);return <line key={c.m.id} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#E92626" strokeWidth="5" markerEnd="url(#bcs-arrow)"/>})}
    {cards.map(c=><g key={c.m.id} onPointerDown={e=>iniciar(e,c)} onPointerMove={mover} onPointerUp={()=>{drag.current=null}} onPointerCancel={()=>{drag.current=null}} style={{cursor:edicao?'grab':'default'}}><rect x={c.b[0]} y={c.b[1]} width={c.b[2]} height={c.b[3]} rx="19" fill={c.fill} stroke={edicao?'#25445E':'#F5F9F3'} strokeWidth="2"/>{c.ls.map(textoSVG)}</g>)}
    {resumoQuadro.map((q,i)=>{const x=8+i*111;return <g key={q.titulo}><rect x={x} y="559" width="109" height="40" fill={q.fundo}/><rect x={x} y="601" width="109" height="66" fill={q.cor}/>{textoSVG({t:q.titulo,x,y:559,w:109,h:40,size:17,color:'#FFFFFF',bold:true},'t')}{q.linhas.map((l,j)=>textoSVG({t:l,x,y:603+j*20,w:109,h:20,size:15},j))}</g>})}
    <rect y="675" width={W} height="45" fill="#1476AF"/><rect x="984" y="675" width="296" height="45" fill="#F2E83C"/>
    <text x="12" y="698" dominantBaseline="central" fontSize="21" fontWeight="bold" fill="#fff">{rodape}</text>
    {textoSVG({t:'Atualizado em '+data,x:986,y:675,w:292,h:45,size:17,bold:true},'data')}
   </svg>
  </div>}
  {dados&&<p style={{fontSize:13,marginTop:10}}>Total: {total.total} integrantes. ONU: {onu.total}. OEA/DH: {oea.total}. Mulheres: {total.feb+total.fpm}. Leaving: {total.leb+total.lpm}. CIDES integra a MIADH na contagem de missões OEA. {GRUPOS.slice(0,4).map((g,i)=>g+' — '+GRUPOS_NOMES[i]+': '+grupos[g]).join(' · ')}</p>}
 </section>
}
