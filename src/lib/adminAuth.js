// adminAuth.js
const ADMIN_KEY = "icmtools_admin";

export function isAdmin() {
  return localStorage.getItem(ADMIN_KEY) === "true";
}

export function loginAdmin(user, pass) {
  // Agora o código lê as variáveis que você acabou de configurar na Vercel
  if (user.trim() === process.env.NEXT_PUBLIC_ADMIN_USER && 
      pass === process.env.NEXT_PUBLIC_ADMIN_PASS) {
    localStorage.setItem(ADMIN_KEY, "true");
    return true;
  }
  return false;
}

export function logoutAdmin() {
  localStorage.removeItem(ADMIN_KEY);
}