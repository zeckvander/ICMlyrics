// Exemplo: Buscar o capítulo 1 de Gênesis na versão ACF
const { data, error } = await supabase
  .from('versiculos')
  .select('texto, versiculo')
  .eq('book_abbrev', 'gn')
  .eq('capitulo', 1)
  .eq('versao', 'acf');