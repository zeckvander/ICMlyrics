const FAVORITES_PREFIX = "icmlyrics_favoritos_";

export function getFavorites(usuario) {
  if (!usuario || typeof usuario !== "string") return [];
  const key = FAVORITES_PREFIX + usuario.trim();
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Erro ao ler favoritos do localStorage:", error);
    return [];
  }
}

export function isFavorite(usuario, louvorId) {
  if (!usuario || !louvorId && louvorId !== 0) return false;
  return getFavorites(usuario).includes(String(louvorId));
}

export function toggleFavorite(usuario, louvorId) {
  if (!usuario || (louvorId !== 0 && !louvorId)) return false;
  
  const key = FAVORITES_PREFIX + usuario.trim();
  const favs = getFavorites(usuario);
  
  const idString = String(louvorId);
  const isFav = favs.includes(idString);
  
  const newFavs = isFav 
    ? favs.filter((id) => id !== idString) 
    : [...favs, idString];
    
  try {
    localStorage.setItem(key, JSON.stringify(newFavs));

    window.dispatchEvent(new Event("storage"));
    return !isFav;
  } catch (error) {
    console.error("Erro ao salvar favoritos no localStorage:", error);
    return isFav;
  }
}