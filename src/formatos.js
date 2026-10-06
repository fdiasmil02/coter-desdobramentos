// Formata datas para exibição — mandatos em MM/AAAA, datas completas em DD/MM/AAAA

// "2025-10-01" ou "2025-10" → "10/2025"
export function formatarMesAno(valor) {
  if (!valor) return null
  const partes = String(valor).split('-') // [ano, mes, dia?]
  if (partes.length < 2) return String(valor)
  return `${partes[1]}/${partes[0]}`
}

// "2026-02-01" → "01/02/2026" (para chegada e retorno)
export function formatarData(valor) {
  if (!valor) return '—'
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    const [ano, mes, dia] = valor.split('-')
    return `${dia}/${mes}/${ano}`
  }
  return valor
}