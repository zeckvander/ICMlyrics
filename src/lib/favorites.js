const FAVORITES_PREFIX = "icmtools_favoritos_";

export function getFavorites(musico) {
  if (!musico) return [];
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_PREFIX + musico) || "[]");
  } catch {
    return [];
  }
}

export function isFavorite(musico, louvorId) {
  return getFavorites(musico).includes(louvorId);
}

// Returns true if the louvor is now a favorite
export function toggleFavorite(musico, louvorId) {
  const favs = getFavorites(musico);
  const isFav = favs.includes(louvorId);
  const newFavs = isFav ? favs.filter((id) => id !== louvorId) : [...favs, louvorId];
  localStorage.setItem(FAVORITES_PREFIX + musico, JSON.stringify(newFavs));
  return !isFav;
}