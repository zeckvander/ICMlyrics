const ADMIN_KEY = "icmtools_admin";
const ADMIN_USER = "Ezequiel";
const ADMIN_PASS = "551290";

export function isAdmin() {
  return localStorage.getItem(ADMIN_KEY) === "true";
}

export function loginAdmin(user, pass) {
  if (user.trim() === ADMIN_USER && pass === ADMIN_PASS) {
    localStorage.setItem(ADMIN_KEY, "true");
    return true;
  }
  return false;
}

export function logoutAdmin() {
  localStorage.removeItem(ADMIN_KEY);
}