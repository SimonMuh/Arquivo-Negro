const cena = {

    estado: "escuro",

    inicio: 0,

    mouseX: window.innerWidth / 2,

    mouseY: window.innerHeight / 2,

livro:{

    aberto:false,

    animando:false,

    angulo:0,

    velocidade:0

},

paginas:{

    indice:0,

    angulo:0,

    velocidade:0,

    animando:false

}

};

function iniciarCena(){

    cena.inicio = performance.now();

    document.addEventListener("mousemove", (e)=>{

        cena.mouseX = e.clientX;
        cena.mouseY = e.clientY;

    });

    requestAnimationFrame(loopCena);

}

function loopCena(tempoAtual){

    let tempo = tempoAtual - cena.inicio;

    atualizarCena(tempo);

    atualizarLivro();
    atualizarBlocoPaginas();

    requestAnimationFrame(loopCena);

}
function atualizarCena(t){

    if(t < 1000){

    atualizarEscuridao(1);

    atualizarLuz(
        window.innerWidth/2,
        window.innerHeight/2,
        0
    );

    return;
}

    if(t < 2500){

        let intensidade = (t-1000)/1500;

        atualizarEscuridao(
            1 - intensidade*0.12
        );

        vela.x = window.innerWidth / 2;
vela.y = window.innerHeight / 2;

atualizarLuz(

    vela.x,

    vela.y,

    intensidade

);

        return;

    }

    atualizarEscuridao(0.88);

    atualizarVela(

    cena.mouseX,

    cena.mouseY

    );

atualizarLuz(

    vela.x,

    vela.y,

    1
);
}
