export const TEMAS_PADRAO = [
    { numero: "0", nome: "Contra-capa", tema: "Contra-capa" },
  ...Array.from({length: 56}, (_, i) => ({ numero: (i + 1).toString(), tema: "Clamor" })),
  ...Array.from({length: 40}, (_, i) => ({ numero: (i + 57).toString(), tema: "Invocação e Comunhão" })),
  ...Array.from({length: 104}, (_, i) => ({ numero: (i + 97).toString(), tema: "Dedicação" })),
  ...Array.from({length: 94}, (_, i) => ({ numero: (i + 201).toString(), tema: "Morte, Ressureição e Salvação" })),
  ...Array.from({length: 91}, (_, i) => ({ numero: (i + 295).toString(), tema: "Consolo e Encorajamento" })),
  ...Array.from({length: 92}, (_, i) => ({ numero: (i + 386).toString(), tema: "Santificação e Derramamento do Espírito Santo" })),
  ...Array.from({length: 94}, (_, i) => ({ numero: (i + 478).toString(), tema: "Volta de Jesus e Eternidade" })),
  ...Array.from({length: 78}, (_, i) => ({ numero: (i + 572).toString(), tema: "Louvor" })),
  ...Array.from({length: 16}, (_, i) => ({ numero: (i + 650).toString(), tema: "Salmos de Louvor" })),
  ...Array.from({length: 65}, (_, i) => ({ numero: (i + 666).toString(), tema: "Grupo de Louvor" })),
  ...Array.from({length: 64}, (_, i) => ({ numero: (i + 731).toString(), tema: "Corinhos" }))
];