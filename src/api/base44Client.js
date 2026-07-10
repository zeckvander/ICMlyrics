// base44client.js - Gerenciador de Sessão Local
export const base44 = {
  auth: {
    me: async () => null,
    logout: () => {
      localStorage.removeItem("icmtools_musico");
      window.location.href = "/";
    },
    redirectToLogin: () => {
      window.location.href = "/";
    }
  }
};