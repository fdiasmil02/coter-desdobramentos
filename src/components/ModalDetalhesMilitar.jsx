import { formatarData } from '../formatos'
const corSituacao = situacao => ({ 'Na Missão': 'na-missao', Leaving: 'leaving', Previsto: 'previsto', Estendido: 'estendido', Retornou: 'retornou' }[situacao] ?? 'outro')
const postoFormatado = r => [r.posto_graduacao, r.tipo === 'Militar do EB' ? r.qms : r.tipo === 'Policial Militar' ? 'PM' + (r.estado_pm ?? '').replace(/^PM/i, '').toUpperCase() : null].filter(Boolean).join(' ')
export default function ModalDetalhesMilitar({ detalhe, siglaMissao, podeEditar, aoEditar, aoFechar }) {
  if (!detalhe) return null
  return (
    <div className="modal-overlay" onClick={() => aoFechar()}>
        <div className="modal ef-detalhe ef-detalhe-compacto" role="dialog" aria-modal="true" aria-labelledby="ef-detalhe-titulo" onClick={e => e.stopPropagation()}>
          <div className="ef-detalhe-topo">
            {detalhe.foto_url
              ? <img className="ef-detalhe-foto" src={detalhe.foto_url} alt={`Foto de ${detalhe.nome_guerra}`} />
              : <div className="ef-detalhe-foto ef-detalhe-foto-vazia" aria-label="Sem foto cadastrada">👤</div>}
            <div className="ef-detalhe-identificacao">
              <h2 id="ef-detalhe-titulo">{postoFormatado(detalhe)} {detalhe.nome_guerra}</h2>
              <p className="ef-detalhe-nome-completo">{detalhe.nome_completo || '—'}</p>
              <span className={`ef-badge-situacao ef-detalhe-status ${corSituacao(detalhe.situacao)}`}>{detalhe.situacao}</span>
            </div>
            <button type="button" className="modal-fechar ef-detalhe-fechar" aria-label="Fechar detalhes" onClick={() => aoFechar()}>×</button>
          </div>
          <dl className="ef-detalhe-grade">
            {[
              ['Tipo', detalhe.tipo],
              ['Missão', siglaMissao(detalhe.missao_id)],
              ['Gênero', detalhe.genero],
              ['OM de origem', detalhe.om_origem],
              ['Função atual na missão', detalhe.funcao_atual],
              ['Cidade atualmente desdobrado', detalhe.cidade_desdobramento],
              ['Retorno previsto', formatarData(detalhe.data_previsao_retorno)],
              ['Chegada', formatarData(detalhe.data_chegada)],
              ['WhatsApp', detalhe.contato_telefone_whatsapp],
              ['Retorno real', detalhe.data_retorno_real ? formatarData(detalhe.data_retorno_real) : '—'],
              ['Documento', detalhe.documento_referencia],
              ['E-mail', detalhe.contato_email],
              ['Observações', detalhe.observacoes]
            ].map(([rotulo, valor]) =>
              <div key={rotulo} className={rotulo === 'Observações' ? 'ef-detalhe-observacoes' : ''}>
                <dt>{rotulo}</dt><dd>{valor || '—'}</dd>
              </div>
            )}
          </dl>
          {detalhe.situacao === 'Leaving' && (
            <section className="ef-detalhe-leaving" aria-label="Informações do Leaving">
              <h3>MILITAR EM LEAVING</h3>
              <dl className="ef-detalhe-grade">
                <div><dt>Início do Leaving</dt><dd>{detalhe.leaving_inicio ? formatarData(detalhe.leaving_inicio) : '—'}</dd></div>
                <div><dt>Término do Leaving</dt><dd>{detalhe.leaving_fim ? formatarData(detalhe.leaving_fim) : '—'}</dd></div>
                <div className="ef-detalhe-observacoes"><dt>Provável destino</dt><dd>{detalhe.leaving_destino?.trim() || 'Não informado'}</dd></div>
              </dl>
            </section>
          )}
          <div className="ef-detalhe-acoes">
            {podeEditar && <button type="button" className="botao-primario" onClick={() => { const registro = detalhe; aoFechar(); aoEditar?.(registro) }}>✏️ Editar cadastro</button>}
            <button type="button" className="botao-fechar-modal" onClick={() => aoFechar()}>Fechar</button>
          </div>
        </div>
      </div>
  )
}
