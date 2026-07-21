const vela = {

    x: window.innerWidth / 2,
    y: window.innerHeight / 2,

    ultimoX: window.innerWidth / 2,
    ultimoY: window.innerHeight / 2,

    velocidade: 0.08,

    movimento: 0

};

function atualizarVela(alvoX, alvoY){

    vela.ultimoX = vela.x;
    vela.ultimoY = vela.y;

    vela.x += (alvoX - vela.x) * vela.velocidade;
    vela.y += (alvoY - vela.y) * vela.velocidade;

    const dx = vela.x - vela.ultimoX;
    const dy = vela.y - vela.ultimoY;

    vela.movimento = Math.sqrt(dx*dx + dy*dy);

}