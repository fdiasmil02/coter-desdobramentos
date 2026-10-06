// Tradução pt-BR dos códigos ISO (3 letras) usados nas missões.
// Países fora da lista exibem o próprio código.
const NOMES_PAISES = {
  LBN: 'Líbano',
  SSD: 'Sudão do Sul',
  CAF: 'República Centro-Africana',
  SYR: 'Síria',
  ESH: 'Saara Ocidental',
  CYP: 'Chipre',
  SDN: 'Sudão',
  ISR: 'Israel',
  EGY: 'Egito',
  HTI: 'Haiti',
  COL: 'Colômbia',
  COD: 'República Democrática do Congo'
}

export function nomePais(codigo) {
  return NOMES_PAISES[codigo] ?? codigo
}