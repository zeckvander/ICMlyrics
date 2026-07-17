export function logoutAdmin() {
  localStorage.removeItem("icmlyrics_admin");
  localStorage.removeItem("icmlyrics_role");
  
  localStorage.removeItem("icmlyrics_user");
  localStorage.removeItem("icmlyrics_user_nuvem");
  
  window.location.reload();
}
export function isAdmin() {
  return false; 
}