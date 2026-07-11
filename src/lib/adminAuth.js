// adminAuth.js
const ADMIN_KEY = "icmtools_admin";

export function isAdmin() {
  return localStorage.getItem(ADMIN_KEY) === "true";
}

export function loginAdmin(user, pass) {
  // O Vite usa import.meta.env, a Vercel usa process.env
  const adminUser = import.meta.env.VITE_ADMIN_USER || process.env.NEXT_PUBLIC_ADMIN_USER;
  const adminPass = import.meta.env.VITE_ADMIN_PASS || process.env.NEXT_PUBLIC_ADMIN_PASS;

  if (user.trim() === adminUser && pass === adminPass) {
    localStorage.setItem(ADMIN_KEY, "true");
    return true;
  }
  return false;
}

export function logoutAdmin() {
  localStorage.removeItem(ADMIN_KEY);
}