// adminAuth.js
const ADMIN_KEY = "icmtools_admin";

export function isAdmin() {
  return localStorage.getItem(ADMIN_KEY) === "true";
}

export function loginAdmin(user, pass) {
  // Como o Vite injeta essas variáveis em tempo de build, 
  // vamos usar diretamente a importação do meta env
  const adminUser = import.meta.env.VITE_ADMIN_USER;
  const adminPass = import.meta.env.VITE_ADMIN_PASS;

  if (user.trim() === adminUser && pass === adminPass) {
    localStorage.setItem(ADMIN_KEY, "true");
    return true;
  }
  return false;
}

export function logoutAdmin() {
  localStorage.removeItem(ADMIN_KEY);
}