import { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabaseClient'
import { nomePais } from '../paises'

const W=1280,H=720
const STORAGE='bcs-layout-v2'
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


const C={navy:'#142D46',blue:'#1D5278',teal:'#087F83',gold:'#B98220',ink:'#142D46',muted:'#536B80',paper:'#F2F5F8',white:'#FFFFFF',line:'#D7E0E8'}
const MAP={x:24,y:226,w:720,h:320}
const project=(lon,lat)=>[MAP.x+(Number(lon)+180)*MAP.w/360,MAP.y+(83-Number(lat))*MAP.h/145]
function mapPath(g){
 const ps=g.type==='Polygon'?[g.coordinates]:g.type==='MultiPolygon'?g.coordinates:[]
 return ps.map(p=>p.map(r=>r.map((pt,i)=>{const [x,y]=project(pt[0],pt[1]);return (i?'L':'M')+x.toFixed(1)+','+y.toFixed(1)}).join('')+'Z').join('')).join('')
}
const isDH=m=>m.sigla==='DH'
const label=m=>TITULOS[m.sigla]||m.sigla
function scene(dados){
 const {lista,rows,dh,grupos}=dados
 const total=resumo(rows),oea=resumo(dh),onu=resumo(rows.filter(r=>!dh.some(d=>d.id===r.id)))
 const missions=lista.filter(m=>!isDH(m))
 const data=dataBR(dados.data)
 const rects=[],texts=[],lines=[]
 const rect=(x,y,w,h,fill,r=0)=>rects.push({x,y,w,h,fill,r})
 const txt=(t,x,y,w,h,size,opt={})=>texts.push({t:String(t),x,y,w,h,size,color:C.ink,...opt})
 rect(0,0,W,H,C.paper);rect(0,0,W,79,C.navy)
 txt('Ch Mis Paz Av/IGPM / Divisão de Missão de Paz',91,9,920,32,26,{bold:true,color:C.white,align:'left'})
 txt('BRIEFING DE CONSCIÊNCIA SITUACIONAL  /  MISSÕES DE PAZ',92,42,920,25,15,{color:'#B9D5E8',align:'left'})
 txt('ATUALIZADO EM',1032,10,157,23,12,{color:'#B9D5E8',bold:true})
 txt(data,1032,34,157,31,22,{color:C.white,bold:true})
 const metrics=[
 ['EFETIVO TOTAL',total.total,total.eb+' EB  •  '+total.pm+' PM',C.navy],
 ['EXÉRCITO',total.eb,'Militares desdobrados',C.blue],
 ['POLÍCIA MILITAR',total.pm,'Policiais desdobrados',C.blue],
 ['MULHERES',total.feb+total.fpm,total.feb+' EB  •  '+total.fpm+' PM',C.teal],
 ['LEAVING / CTO',total.leb+total.lpm,total.leb+' EB  •  '+total.lpm+' PM',C.gold]]
 metrics.forEach(([title,n,sub,color],i)=>{const x=24+i*248;rect(x,93,240,91,C.white,10);rect(x,93,5,91,color,2);txt(title,x+16,100,208,20,13,{bold:true,color:C.muted,align:'left'});txt(n,x+16,121,208,39,34,{bold:true,color,align:'left'});txt(sub,x+16,159,208,17,13,{color:C.muted,align:'left'})})
 rect(24,197,720,349,C.white,12)
 txt('PRESENÇA INTERNACIONAL',40,201,520,24,17,{bold:true,align:'left'})
 txt('● ONU    ● OEA / DH',540,203,190,20,12,{color:C.muted})
 rect(24,555,720,130,C.white,10)
 txt('DESMINAGEM HUMANITÁRIA  /  COLÔMBIA',40,561,680,24,18,{bold:true,align:'left'})
 const subgroups=GRUPOS.slice(0,4)
 subgroups.forEach((g,i)=>{const x=40+i*174;rect(x,591,164,60,'#F8F0DE',7);txt(g,x+8,594,148,20,14,{bold:true,color:C.gold,align:'left'});txt(grupos[g],x+8,615,148,30,26,{bold:true,align:'left'})})
 txt('OEA: '+(Number(grupos.GMI>0)+Number(grupos.GATI>0)+Number(grupos.MIADH+grupos.CIDES>0))+' missões  •  '+oea.eb+' EB  •  '+oea.pm+' PM  •  Mulheres: '+(oea.feb+oea.fpm)+'  •  Leaving: '+(oea.leb+oea.lpm)+(grupos['Não identificado']?'  •  Sem grupo: '+grupos['Não identificado']:''),40,654,690,24,13,{color:C.muted,align:'left'})
 rect(756,197,500,488,C.white,12)
 txt('EFETIVO POR MISSÃO',772,201,470,24,17,{bold:true,align:'left'})
 txt('ONU: '+missions.length+' missões  •  '+onu.eb+' EB  •  '+onu.pm+' PM',772,226,470,23,14,{color:C.muted,align:'left'})
 const cols=[['MISSÃO / PAÍS',772,224],['EB',996,56],['PM',1052,56],['F',1108,56],['LEAVE',1164,76]]
 rect(768,255,476,27,C.navy,4)
 cols.forEach(([t,x,w])=>txt(t,x,255,w,27,12,{bold:true,color:C.white,align:t==='MISSÃO / PAÍS'?'left':'center'}))
 const rh=Math.min(43,Math.floor(390/Math.max(1,missions.length)))
 missions.forEach((m,i)=>{
  const y=284+i*rh,s=resumo(rows.filter(r=>r.missao_id===m.id))
  rect(768,y,476,rh-1,i%2?'#F3F6F9':'#FFFFFF')
  txt(label(m),774,y,218,rh*.53,Math.min(16,rh*.40),{bold:true,align:'left'})
  txt(NOMES[m.sigla]||nomePais(m.pais),774,y+rh*.51,218,rh*.45,Math.min(12,rh*.28),{color:C.muted,align:'left'})
  const vals=[s.eb,s.pm,s.feb+'/'+s.fpm,s.leb+'/'+s.lpm]
  cols.slice(1).forEach((col,j)=>txt(vals[j],col[1],y,col[2],rh,Math.min(18,rh*.44),{bold:true,color:j===2?C.teal:j===3?C.gold:C.ink}))
 })
 txt('F e LEAVE: EB / PM',772,658,470,19,12,{color:C.muted,align:'left'})
 rect(0,694,W,26,C.navy)
 txt('DIVISÃO DE MISSÃO DE PAZ   •   EFETIVO ATUALMENTE DESDOBRADO',24,694,900,26,12,{color:'#D5E5F0',bold:true,align:'left'})
 txt('BCS  /  V2',1060,694,196,26,12,{color:C.white,bold:true,align:'right'})
 return {rects,texts,lines,total,oea,onu,missions,data}
}
function T({t}){
 return <text x={t.align==='left'?t.x:t.align==='right'?t.x+t.w:t.x+t.w/2} y={t.y+t.h/2} dominantBaseline="central" textAnchor={t.align==='left'?'start':t.align==='right'?'end':'middle'} fontSize={t.size} fontWeight={t.bold?'700':'400'} fill={t.color||C.ink}>{t.t}</text>
}
export default function BriefingBCSV2(){
 const [dados,setDados]=useState(null),[geo,setGeo]=useState(null),[erro,setErro]=useState(''),[loading,setLoading]=useState(false),[busy,setBusy]=useState(false),[resolucao,setResolucao]=useState('1920')
 const ref=useRef(null),area=useRef(null)
 async function carregar(){
  setLoading(true);setErro('');setDados(null);setGeo(null)
  try{
   const {data:u,error:eu}=await supabase.auth.getUser()
   if(eu||!u?.user)throw new Error('Faça login.')
   const {data:p,error:ep}=await supabase.from('perfis').select('nivel').eq('id',u.user.id).maybeSingle()
   if(ep||!['admin','super_admin'].includes(p?.nivel))throw new Error('Acesso administrativo necessário.')
   const {data:ms,error:em}=await supabase.from('missoes').select('id,sigla,pais,qg_missao,status,latitude,longitude').order('sigla')
   if(em)throw em
   const rows=[]
   for(let i=0;;i+=500){
    const {data,error}=await supabase.from('desdobrados').select('id,missao_id,tipo,genero,situacao,funcao_atual,cidade_desdobramento').in('situacao',ATIVOS).order('id').range(i,i+499)
    if(error)throw error
    rows.push(...(data||[]));if((data||[]).length<500)break
   }
   const lista=(ms||[]).filter(m=>m.status==='Ativa'||rows.some(r=>r.missao_id===m.id))
   const dh=rows.filter(r=>lista.some(m=>isDH(m)&&m.id===r.missao_id))
   const grupos=Object.fromEntries(GRUPOS.map(g=>[g,0]));dh.forEach(r=>grupos[grupoDH(r)]++)
   const res=await fetch(MAPA);if(!res.ok)throw new Error('Mapa indisponível.')
   const g=await res.json();if(!Array.isArray(g.features))throw new Error('Mapa inválido.')
   setGeo(g);setDados({lista,rows,dh,grupos,data:new Date()})
  }catch(e){setErro(e.message||'Erro ao carregar BCS.')}finally{setLoading(false)}
 }
 useEffect(()=>{carregar()},[])
 const s=dados?scene(dados):null
 const paises=new Set(dados?.lista.map(m=>m.pais)||[])
 // Pontos agrupados por proximidade no mapa; lista ao lado contém todos os quantitativos.
 const pontos=[]
 for(const m of dados?.lista||[]){
  if(m.latitude==null||m.longitude==null)continue
  const [x,y]=project(m.longitude,m.latitude)
  if(!Number.isFinite(x)||!Number.isFinite(y))continue
  const existente=pontos.find(p=>Math.hypot(p.x-x,p.y-y)<10)
  if(existente){existente.n++;existente.dh=existente.dh||isDH(m)}
  else pontos.push({x,y,n:1,dh:isDH(m)})
 }
 async function exportar(tipo){
  if(!s||!ref.current)return
  setBusy(true);setErro('')
  const nome='BCS-V2-'+s.data.replace(/ /g,'-')
  try{
   if(tipo==='png'){baixar(await svgPNG(ref.current,Number(resolucao)),nome+'.png');return}
   const {default:PptxGenJS}=await import('pptxgenjs')
   const pptx=new PptxGenJS();pptx.layout='LAYOUT_WIDE';pptx.author='Divisão de Missão de Paz';pptx.title='BCS V2 - '+s.data
   const slide=pptx.addSlide(),X=v=>v/96
   for(const r of s.rects)slide.addShape(r.r?pptx.ShapeType.roundRect:pptx.ShapeType.rect,{x:X(r.x),y:X(r.y),w:X(r.w),h:X(r.h),rectRadius:.08,fill:{color:r.fill.slice(1)},line:{transparency:100,color:r.fill.slice(1)}})
   const svg=ref.current.cloneNode(true)
   for(const el of [...svg.children])if(el.getAttribute('data-map')!=='true'&&el.tagName.toLowerCase()!=='defs')el.remove()
   // Recorta o mapa, para não cobrir os elementos editáveis do PowerPoint.
   svg.setAttribute('viewBox',MAP.x+' '+MAP.y+' '+MAP.w+' '+MAP.h)
   svg.setAttribute('width',String(MAP.w));svg.setAttribute('height',String(MAP.h))
   const xml=new XMLSerializer().serializeToString(svg)
   const url=URL.createObjectURL(new Blob([xml],{type:'image/svg+xml;charset=utf-8'}))
   try{
    const img=await new Promise((ok,fail)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=()=>fail(new Error('Mapa não renderizado.'));i.src=url})
    const canvas=document.createElement('canvas');canvas.width=MAP.w*2;canvas.height=MAP.h*2;canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height)
    slide.addImage({data:canvas.toDataURL('image/png'),x:X(MAP.x),y:X(MAP.y),w:X(MAP.w),h:X(MAP.h)})
   }finally{URL.revokeObjectURL(url)}
   for(const t of s.texts)slide.addText(t.t,{x:X(t.x),y:X(t.y),w:X(t.w),h:X(t.h),fontFace:'Arial',fontSize:t.size*.75,bold:!!t.bold,color:(t.color||C.ink).slice(1),align:t.align||'center',valign:'mid',margin:0,fit:'shrink'})
   slide.addImage({data:LOGO_ESQ,x:X(24),y:X(8),w:X(49),h:X(64)})
   slide.addImage({data:LOGO_DIR,x:X(1205),y:X(7),w:X(50),h:X(64)})
   await pptx.writeFile({fileName:nome+'.pptx'})
  }catch(e){setErro(e.message||'Erro na exportação.')}finally{setBusy(false)}
 }
 return <section className="admin-secao">
  <div className="admin-topo"><div><h2>BCS V2 — Visão executiva</h2><p className="admin-instrucao">Modelo institucional 16:9 com indicadores, mapa e quadro de efetivos.</p></div></div>
  <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:14}}>
   <button className="botao-secundario-form" disabled={loading||busy} onClick={carregar}>↻ Atualizar dados</button>
   <button className="botao-secundario-form" disabled={!s} onClick={()=>area.current?.requestFullscreen?.().catch(()=>setErro('Tela cheia indisponível.'))}>⛶ Tela cheia</button>
   <select aria-label="Resolução PNG" value={resolucao} onChange={e=>setResolucao(e.target.value)}><option value="1920">PNG Full HD</option><option value="3840">PNG 4K</option></select>
   <button className="botao-primario" disabled={!s||busy||loading} onClick={()=>exportar('png')}>Exportar PNG</button>
   <button className="botao-primario" disabled={!s||busy||loading} onClick={()=>exportar('pptx')}>Exportar PPTX</button>
  </div>
  {erro&&<div className="aviso-erro" role="alert">{erro}</div>}
  {(loading||busy)&&<p>{loading?'Atualizando dados…':'Gerando arquivo…'}</p>}
  {s&&<div ref={area} style={{background:C.paper,display:'flex',alignItems:'center',justifyContent:'center',border:'1px solid #bac6d0'}}>
   <svg ref={ref} xmlns="http://www.w3.org/2000/svg" viewBox={'0 0 '+W+' '+H} width={W} height={H} style={{width:'100%',height:'auto',maxHeight:'100vh',fontFamily:'Arial, sans-serif',display:'block'}} role="img" aria-label="BCS V2, visão executiva">
    <defs><clipPath id="bcs2-clip"><rect {...MAP}/></clipPath></defs>
    {s.rects.map((r,i)=><rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} rx={r.r} fill={r.fill}/>)}
    <g data-map="true" clipPath="url(#bcs2-clip)">
     <rect {...MAP} fill="#E8F0F5"/>
     {geo.features.filter(f=>f.id!=='ATA'&&f.geometry).map((f,i)=><path key={f.id||i} d={mapPath(f.geometry)} fill={paises.has(f.id)?'#6FA4C4':'#CDDCE5'} stroke="#F3F7FA" strokeWidth=".65" fillRule="evenodd"/>)}
     {pontos.map((p,i)=><g key={i}><circle cx={p.x} cy={p.y} r={p.n>1?8:5} fill={p.dh?C.gold:C.blue} stroke="#fff" strokeWidth="1.5"/>{p.n>1&&<text x={p.x} y={p.y} dominantBaseline="central" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">{p.n}</text>}</g>)}
    </g>
    {s.texts.map((t,i)=><T key={i} t={t}/>)}
    <image href={LOGO_ESQ} x="24" y="8" width="49" height="64"/>
    <image href={LOGO_DIR} x="1205" y="7" width="50" height="64"/>
   </svg>
  </div>}
  {s&&<p style={{fontSize:13,marginTop:10}}>F = mulheres; LEAVE = Leaving/CTO. Os valores separados por barra indicam EB / PM. CIDES integra a MIADH na contagem de missões OEA. Retornados e previstos não entram no efetivo atual.</p>}
 </section>
}
