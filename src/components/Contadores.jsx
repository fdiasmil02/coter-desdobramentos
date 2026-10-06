// Painel de números-chave — 5 cartões com faixas de cores distintas (estilo Skip)
export default function Contadores({
  totalEfetivo, totalEb, totalPm, totalMulheres, totalLeaving, totalMissoes
}) {
  const pct = parte => (totalEfetivo > 0 ? Math.round((parte / totalEfetivo) * 100) : 0)

  return (
    <section className="contadores">
      <div className="contador acc-ciano">
        <span className="rotulo">🌐 Total Desdobrado</span>
        <span className="valor">{totalEfetivo}</span>
        <span className="contexto">Em {totalMissoes} missões da ONU</span>
      </div>
      <div className="contador acc-azul">
        <span className="rotulo">⚓ Militares do EB</span>
        <span className="valor">{totalEb}</span>
        <span className="contexto">{pct(totalEb)}% do efetivo total</span>
      </div>
      <div className="contador acc-roxo">
        <span className="rotulo">🛡️ Policiais Militares</span>
        <span className="valor">{totalPm}</span>
        <span className="contexto">{pct(totalPm)}% do efetivo total</span>
      </div>
      <div className="contador acc-rosa">
        <span className="rotulo">♀ Mulheres Desdobradas</span>
        <span className="valor">{totalMulheres}</span>
        <span className="contexto">{pct(totalMulheres)}% do total (Meta ONU)</span>
      </div>
      <div className="contador acc-laranja">
        <span className="rotulo">⏳ Em Leaving Agora</span>
        <span className="valor">{totalLeaving}</span>
        <span className="contexto">Desmobilização ou transição</span>
      </div>
    </section>
  )
}