const fs = require('fs');

// Carrega o arquivo acf.json
const biblia = require('./aa.json');

// Função para remover acentos e espaços para nomes de arquivos
const slugify = (text) => {
    return text.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/\s/g, '');
};

biblia.forEach((livro, index) => {
    const nomeSlug = slugify(livro.name);
    
    // O Antigo Testamento compreende os primeiros 39 livros (índices 0 a 38)
    // O Novo Testamento compreende os 27 restantes (índices 39 a 65)
    const pasta = (index < 39) ? 'antigo-testamento' : 'novo-testamento';
    const dir = `./public/data/biblia/${pasta}`;

    // Cria a pasta se não existir
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    // Estrutura que será salva no arquivo individual
    const conteudoLivro = {
        nome: livro.name,
        abbrev: livro.abbrev,
        capitulos: livro.chapters
    };

    const caminho = `${dir}/${nomeSlug}.json`;

    // Salva o arquivo
    fs.writeFileSync(caminho, JSON.stringify(conteudoLivro, null, 2));
    console.log(`Gerado: ${dir}/${nomeSlug}.json`);
});

console.log("Processo concluído com sucesso!");