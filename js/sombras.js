const livro = document.getElementById("livro");

function atualizarSombras(){

    const centroLivroX = window.innerWidth / 2;
    const centroLivroY = window.innerHeight / 2;

    const dx = centroLivroX - vela.x;
    const dy = centroLivroY - vela.y;

    const sombraX = dx * 0.05;
    const sombraY = dy * 0.05;

    const desfoque = 50;
    const espalhamento = 10;

    livro.style.boxShadow = `
        ${sombraX}px
        ${sombraY}px
        ${desfoque}px
        rgba(0,0,0,0.55)
    `;

}