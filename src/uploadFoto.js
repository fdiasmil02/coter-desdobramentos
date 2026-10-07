import { supabase } from '../supabaseClient' 

export async function uploadFoto(blob) {
  const nomeArquivo = `integrantes/${Date.now()}.jpg`

  const { error } = await supabase.storage
    .from('fotos')
    .upload(nomeArquivo, blob, { contentType: 'image/jpeg' })

  if (error) {
    console.error('Erro no upload:', error)
    throw error
  }

  const { data } = supabase.storage.from('fotos').getPublicUrl(nomeArquivo)
  return data.publicUrl
}