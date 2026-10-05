// Painel de números-chave do topo da página
export default function Contadores({ totalEfetivo, totalMissoes, totalMulheres }) {
  return (
    <section className="contadores">
      <div className="contador">
        <span className="valor">{totalEfetivo}</span>
        <span className="rotulo">Efetivo sob comando da ONU</span>
      </div>
      <div className="contador">
        <span className="valor">{totalMissoes}</span>
        <span className="rotulo">Missões ativas</span>
      </div>
      <div className="contador">
        <span className="valor">{totalMulheres}</span>
        <span className="rotulo">Mulheres desdobradas</span>
      </div>
    </section>
  )
}