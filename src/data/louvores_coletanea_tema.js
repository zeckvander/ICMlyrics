// 1. Regras específicas para a Coletânea
const TEMAS_COLETANEA = [
  { numero: "0", tema: "Contra-capa", categoria: "Coletânea" },
  ...Array.from({length: 56}, (_, i) => ({ numero: (i + 1).toString(), tema: "Clamor", categoria: "Coletânea" })),
  ...Array.from({length: 40}, (_, i) => ({ numero: (i + 57).toString(), tema: "Invocação e Comunhão", categoria: "Coletânea" })),
  ...Array.from({length: 104}, (_, i) => ({ numero: (i + 97).toString(), tema: "Dedicação", categoria: "Coletânea" })),
  ...Array.from({length: 94}, (_, i) => ({ numero: (i + 201).toString(), tema: "Morte, Ressureição e Salvação", categoria: "Coletânea" })),
  ...Array.from({length: 91}, (_, i) => ({ numero: (i + 295).toString(), tema: "Consolo e Encorajamento", categoria: "Coletânea" })),
  ...Array.from({length: 92}, (_, i) => ({ numero: (i + 386).toString(), tema: "Santificação e Derramamento do Espírito Santo", categoria: "Coletânea" })),
  ...Array.from({length: 94}, (_, i) => ({ numero: (i + 478).toString(), tema: "Volta de Jesus e Eternidade", categoria: "Coletânea" })),
  ...Array.from({length: 78}, (_, i) => ({ numero: (i + 572).toString(), tema: "Louvor", categoria: "Coletânea" })),
  ...Array.from({length: 16}, (_, i) => ({ numero: (i + 650).toString(), tema: "Salmos de Louvor", categoria: "Coletânea" })),
  ...Array.from({length: 65}, (_, i) => ({ numero: (i + 666).toString(), tema: "Grupo de Louvor", categoria: "Coletânea" })),
  ...Array.from({length: 64}, (_, i) => ({ numero: (i + 731).toString(), tema: "Corinhos", categoria: "Coletânea" }))
];

// 2. Regras para "Cias" (Deixamos pronto para você preencher depois)
const TEMAS_CIAS = [
  // Exemplo futuro: 
  // { numero: "1", tema: "Abertura", categoria: "Cias" },
  // ...Array.from({length: 10}, (_, i) => ({ numero: (i + 1).toString(), tema: "Tema Exemplo Cias", categoria: "Cias" }))
];

// 3. Regras para "Avulsos" (Deixamos pronto para você preencher depois)
const TEMAS_AVULSOS = [
  // Exemplo futuro:
  // { numero: "100", tema: "Gratidão", categoria: "Avulsos" }
];

// Juntamos todas as categorias em um único array exportado
export const TEMAS_PADRAO = [
  ...TEMAS_COLETANEA,
  ...TEMAS_CIAS,
  ...TEMAS_AVULSOS
];