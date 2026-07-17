const FAVORITES_PREFIX = "icmlyrics_favoritos_";

/**
 * Obtém a lista de IDs de louvores favoritos de um usuário.
 */
export function getFavorites(usuario) {
  if (!usuario || typeof usuario !== "string") return [];
  const key = FAVORITES_PREFIX + usuario.trim();
  try {
    const saved = localStorage.getItem(key);
    // Garantimos que a lista armazenada seja sempre um array de strings
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Erro ao ler favoritos do localStorage:", error);
    return [];
  }
}

/**
 * Verifica se um louvor específico está favoritado por um usuário.
 */
export function isFavorite(usuario, louvorId) {
  if (!usuario || !louvorId && louvorId !== 0) return false;
  // Convertemos o ID para string para comparar com a lista
  return getFavorites(usuario).includes(String(louvorId));
}

/**
 * Alterna o estado de favorito de um louvor (adiciona ou remove).
 */
export function toggleFavorite(usuario, louvorId) {
  if (!usuario || (louvorId !== 0 && !louvorId)) return false;
  
  const key = FAVORITES_PREFIX + usuario.trim();
  const favs = getFavorites(usuario);
  
  // Normaliza o ID para string antes de qualquer operação
  const idString = String(louvorId);
  const isFav = favs.includes(idString);
  
  const newFavs = isFav 
    ? favs.filter((id) => id !== idString) 
    : [...favs, idString];
    
  try {
    localStorage.setItem(key, JSON.stringify(newFavs));
    // Dispara evento para que componentes na tela saibam que o storage mudou
    window.dispatchEvent(new Event("storage"));
    return !isFav;
  } catch (error) {
    console.error("Erro ao salvar favoritos no localStorage:", error);
    return isFav;
  }
}