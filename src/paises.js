// Países (códigos ISO de 3 letras) usados nas missões — nome pt-BR para exibição
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

// Lista ordenada para dropdowns de formulário (código + nome)
export const LISTA_PAISES = Object.entries(NOMES_PAISES)
  .map(([codigo, nome]) => ({ codigo, nome }))
  .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))

export function nomePais(codigo) {
  return NOMES_PAISES[codigo] ?? codigo
}