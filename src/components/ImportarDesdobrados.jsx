import { useState } from 'react'
import { supabase } from '../supabaseClient'

const COLUNAS = ['missao_sigla','tipo','posto_graduacao','qms','estado_pm','nome_guerra','genero','nome_completo','contato_telefone_whatsapp','contato_email','documento_referencia','data_chegada','data_previsao_retorno','data_retorno_real','situacao','observacoes','leaving_inicio','leaving_fim','leaving_destino','om_origem','funcao_atual','cidade_desdobramento']
const POSTOS_EB = ['Gen Ex','Gen Div','Gen Bda','Cel','Ten Cel','Maj','Cap','1º Ten','2º Ten','Asp','S Ten','1º Sgt','2º Sgt','3º Sgt','Cb','Sd']
const POSTOS_PM = ['Cel','Ten Cel','Maj','Cap','1º Ten','2º Ten','Asp','1º Sgt','2º Sgt','3º Sgt','Cb','Sd']
const SITUACOES = ['Na Missão','Leaving','Previsto','Retornou','Estendido']
const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']
const normalizar = v => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase().replace(/\s+/g,' ')
const vazio = v => String(v ?? '').trim() || null
const dataValida = v => !v || (/^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && new Date(v+'T12:00:00Z').toISOString().slice(0,10) === v)

// Lê CSV com campos entre aspas, vírgulas e quebras de linha; detecta ; ou ,.
function lerCSV(texto) {
  const t = texto.replace(/^\uFEFF/,'')
  const primeira = t.split(/\r?\n/,1)[0]
  const delimitador = (primeira.match(/;/g)||[]).length > (primeira.match(/,/g)||[]).length ? ';' : ','
  const linhas = []; let linha = [], campo = '', aspas = false
  for (let i=0; i<t.length; i++) {
    const c=t[i]
    if (c==='"') {
      if (aspas && t[i+1]==='"') { campo+='"'; i++ } else aspas=!aspas
    } else if (c===delimitador && !aspas) { linha.push(campo); campo='' }
    else if ((c==='\n'||c==='\r') && !aspas) {
      if(c==='\r' && t[i+1]==='\n') i++
      linha.push(campo); if(linha.some(v=>v.trim())) linhas.push(linha)
      linha=[]; campo=''
    } else campo+=c
  }
  if(aspas) throw new Error('CSV com aspas não fechadas.')
  linha.push(campo); if(linha.some(v=>v.trim())) linhas.push(linha)
  if(!linhas.length) throw new Error('Arquivo vazio.')
  return linhas
}

function validar(campos, missoesPorSigla) {
  const erros=[]
  const missao=missoesPorSigla.get(normalizar(campos.missao_sigla))
  if(!missao) erros.push('Missão não cadastrada: '+(campos.missao_sigla||'(vazia)'))
  if(!['Militar do EB','Policial Militar'].includes(campos.tipo)) erros.push('Tipo de força inválido')
  const postos=campos.tipo==='Policial Militar'?POSTOS_PM:POSTOS_EB
  if(!postos.includes(campos.posto_graduacao)) erros.push('Posto/graduação inválido')
  if(campos.tipo==='Policial Militar' && !UFS.includes(campos.estado_pm)) erros.push('UF da PM obrigatória ou inválida')
  for(const c of ['nome_guerra','nome_completo','genero','data_chegada','data_previsao_retorno','situacao']) if(!campos[c]) erros.push('Falta '+c)
  if(campos.genero && !['Masculino','Feminino'].includes(campos.genero)) erros.push('Gênero inválido')
  if(campos.situacao && !SITUACOES.includes(campos.situacao)) erros.push('Situação inválida')
  for(const c of ['data_chegada','data_previsao_retorno','data_retorno_real','leaving_inicio','leaving_fim']) if(!dataValida(campos[c])) erros.push('Data inválida em '+c+' (use AAAA-MM-DD)')
  if(campos.data_chegada && campos.data_previsao_retorno && campos.data_previsao_retorno<campos.data_chegada) erros.push('Retorno previsto anterior à chegada')
  if(campos.situacao==='Leaving' && (!campos.leaving_inicio || !campos.leaving_fim || campos.leaving_fim<campos.leaving_inicio)) erros.push('Leaving exige início e fim válidos')
  if(campos.contato_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(campos.contato_email)) erros.push('E-mail inválido')
  return {erros,missao}
}

function montarRegistro(c,missao) {
  return {
    missao_id:missao.id, tipo:c.tipo, posto_graduacao:c.posto_graduacao,
    qms:c.tipo==='Militar do EB'?vazio(c.qms):null,
    estado_pm:c.tipo==='Policial Militar'?c.estado_pm:null,
    nome_guerra:c.nome_guerra, nome_completo:c.nome_completo, genero:c.genero,
    contato_telefone_whatsapp:vazio(c.contato_telefone_whatsapp),
    contato_email:vazio(c.contato_email), documento_referencia:vazio(c.documento_referencia),
    data_chegada:c.data_chegada, data_previsao_retorno:c.data_previsao_retorno,
    data_retorno_real:vazio(c.data_retorno_real), situacao:c.situacao,
    observacoes:vazio(c.observacoes),
    leaving_inicio:c.situacao==='Leaving'?c.leaving_inicio:null,
    leaving_fim:c.situacao==='Leaving'?c.leaving_fim:null,
    leaving_destino:c.situacao==='Leaving'?vazio(c.leaving_destino):null,
    om_origem:vazio(c.om_origem), funcao_atual:vazio(c.funcao_atual),
    cidade_desdobramento:vazio(c.cidade_desdobramento)
  }
}

export default function ImportarDesdobrados({missoes,aoImportar}) {
  const [linhas,setLinhas]=useState([])
  const [arquivo,setArquivo]=useState('')
  const [erro,setErro]=useState('')
  const [processando,setProcessando]=useState(false)
  const [resultado,setResultado]=useState(null)
  const [confirmar,setConfirmar]=useState(false)
  const missoesPorSigla=new Map(missoes.map(m=>[normalizar(m.sigla),m]))
  const validas=linhas.filter(l=>!l.erros.length && !l.duplicado)
  const invalidas=linhas.filter(l=>l.erros.length)
  const duplicadas=linhas.filter(l=>l.duplicado)

  async function selecionar(e) {
    const f=e.target.files?.[0]; e.target.value=''
    setLinhas([]);setResultado(null);setConfirmar(false);setErro('');setArquivo(f?.name||'')
    if(!f)return
    if(!f.name.toLowerCase().endsWith('.csv')) {setErro('Use um arquivo CSV (.csv). No Excel, escolha Salvar como → CSV UTF-8.');return}
    if(f.size>5*1024*1024){setErro('O arquivo deve ter no máximo 5 MB.');return}
    setProcessando(true)
    try {
      const texto=await f.text()
      const matriz=lerCSV(texto)
      const cab=matriz.shift().map(v=>v.trim().replace(/^\uFEFF/,''))
      const faltantes=COLUNAS.filter(c=>!cab.includes(c))
      if(faltantes.length) throw new Error('Colunas ausentes: '+faltantes.join(', '))
      if(matriz.length>1000) throw new Error('Limite de 1.000 registros por arquivo.')
      const {data:{user},error:authError}=await supabase.auth.getUser()
      if(authError||!user) throw new Error('Faça login para importar registros.')
      const {data:perfil,error:perfilErro}=await supabase.from('perfis').select('nivel').eq('id',user.id).single()
      if(perfilErro||!['admin','super_admin'].includes(perfil?.nivel)) throw new Error('Somente administradores podem importar.')
      const existentes=[]
      for(let inicio=0;;inicio+=1000){
        const {data,error}=await supabase.from('desdobrados').select('missao_id,tipo,nome_guerra,nome_completo').range(inicio,inicio+999)
        if(error)throw error
        existentes.push(...(data||[]))
        if(!data||data.length<1000)break
      }
      const chaves=new Set(existentes.map(r=>[r.missao_id,r.tipo,normalizar(r.nome_guerra),normalizar(r.nome_completo)].join('|')))
      const vistos=new Set()
      const preparadas=matriz.map((valores,i)=>{
        const c=Object.fromEntries(cab.map((ch,j)=>[ch,String(valores[j]??'').trim()]))
        const {erros,missao}=validar(c,missoesPorSigla)
        const chave=missao?[missao.id,c.tipo,normalizar(c.nome_guerra),normalizar(c.nome_completo)].join('|'):null
        const duplicado=Boolean(chave && (chaves.has(chave)||vistos.has(chave)))
        if(chave)vistos.add(chave)
        return {numero:i+2,c,missao,erros,duplicado}
      })
      setLinhas(preparadas)
    } catch(ex){setErro(ex.message||'Não foi possível ler o arquivo.')} finally {setProcessando(false)}
  }

  async function importar(){
    if(!confirmar||!validas.length||processando)return
    setProcessando(true);setErro('')
    let inseridos=0;const falhas=[]
    // Inserção individual: isola erros, evita que uma linha invalide todas as outras.
    for(const linha of validas){
      const {error}=await supabase.from('desdobrados').insert(montarRegistro(linha.c,linha.missao))
      if(error)falhas.push('Linha '+linha.numero+': '+error.message)
      else inseridos++
    }
    setResultado({inseridos,falhas})
    setConfirmar(false);setProcessando(false)
    setLinhas([])
    if(inseridos)aoImportar?.()
  }

  return <div className="importacao-desdobrados" style={{border:'1px solid #b9c9d9',borderRadius:12,padding:20,marginBottom:24,background:'rgba(50,105,150,.055)'}}>
    <h3 style={{marginTop:0}}>📤 Importação de desdobrados por CSV</h3>
    <p style={{margin:'6px 0 14px'}}>Envie a planilha preenchida em formato <strong>CSV UTF-8</strong>. O sistema verifica os dados e mostra uma prévia antes de cadastrar. O formulário individual continua disponível abaixo.</p>
    <input type="file" accept=".csv,text/csv" onChange={selecionar} disabled={processando} aria-label="Selecionar arquivo CSV de desdobrados"/>
    {arquivo&&<p style={{fontSize:13}}>Arquivo: {arquivo}</p>}
    {processando&&<p>Processando…</p>}
    {erro&&<div className="aviso-erro" role="alert">{erro}</div>}
    {resultado&&<div role="status" style={{marginTop:12}}><strong>{resultado.inseridos} cadastro(s) incluído(s).</strong>{resultado.falhas.length>0&&<><p>{resultado.falhas.length} falha(s):</p><ul>{resultado.falhas.map((e,i)=><li key={i}>{e}</li>)}</ul></>}</div>}
    {linhas.length>0&&<div style={{marginTop:16}}>
      <p><strong>{linhas.length} linhas:</strong> {validas.length} prontas · {invalidas.length} com erros · {duplicadas.length} possíveis duplicatas (ignoradas).</p>
      <div style={{overflowX:'auto',maxHeight:360,overflowY:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
          <thead><tr><th>Linha</th><th>Missão</th><th>Posto</th><th>Nome de guerra</th><th>Resultado</th></tr></thead>
          <tbody>{linhas.map(l=><tr key={l.numero} style={{borderTop:'1px solid #ccd5de'}}><td>{l.numero}</td><td>{l.c.missao_sigla}</td><td>{l.c.posto_graduacao}</td><td>{l.c.nome_guerra}</td><td style={{color:l.erros.length?'#b42318':undefined}}>{l.erros.length?l.erros.join('; '):l.duplicado?'Possível duplicata — ignorada':'Pronto'}</td></tr>)}</tbody>
        </table>
      </div>
      <p style={{fontSize:13}}>Somente linhas válidas e não duplicadas serão inseridas. Nenhum cadastro existente será alterado. Missões precisam estar cadastradas previamente.</p>
      {validas.length>0&&<><label style={{display:'flex',alignItems:'center',gap:8,margin:'12px 0'}}><input type="checkbox" checked={confirmar} onChange={e=>setConfirmar(e.target.checked)}/> Conferi a prévia e autorizo cadastrar {validas.length} integrante(s).</label><button className="botao-primario" type="button" disabled={!confirmar||processando} onClick={importar}>{processando?'Importando…':`Importar ${validas.length} cadastros`}</button></>}
    </div>}
  </div>
}
