const escuridao = document.getElementById("escuridao");
const brilho = document.getElementById("brilho");
let intensidadeChama = 0;

let alvoChama = 0;

let deslocamentoX = 0;
let deslocamentoY = 0;

let chamaX = 0;
let chamaY = 0;

let alvoX = 0;
let alvoY = 0;

let energiaChama = 1;
let respiracao = 0;
function atualizarChama(){
    
// Perde energia quando a vela se move
energiaChama -= vela.movimento * 0.001;

// Limite mínimo
if (energiaChama < 0.35) {
    energiaChama = 0.35;
}

// Recupera lentamente
energiaChama += (1 - energiaChama) * 0.02;

    if(Math.abs(intensidadeChama - alvoChama) < 0.3){

        alvoChama = (Math.random() * 12) - 6;

        alvoX = (Math.random() * 6) - 3;

        alvoY = (Math.random() * 4) - 2;

    }

    intensidadeChama += (alvoChama - intensidadeChama) * 0.08;

chamaX += (alvoX - chamaX) * 0.08;

chamaY += (alvoY - chamaY) * 0.08;
respiracao += 0.05;
}

function atualizarEscuridao(valor){

    escuridao.style.opacity = valor;

}
function atualizarLuz(x,y,intensidade){
    atualizarChama();

x += chamaX;
y += chamaY;
    if(intensidade <= 0){

    escuridao.style.maskImage = "none";
    escuridao.style.webkitMaskImage = "none";

    brilho.style.background = "transparent";

    return;

}
let intensidadeFinal = intensidade * energiaChama;

    let tremor = intensidadeChama;

let raio = 30 + intensidadeFinal * 400 + tremor;

const borda = 80 + Math.sin(respiracao * 0.8) * 2;

const mascara = `
radial-gradient(
    circle ${raio}px at ${x}px ${y}px,
    transparent 0%,
    rgba(0,0,0,0.15) ${borda - 18}%,
    rgba(0,0,0,0.45) ${borda - 8}%,
    black ${borda}%
)
`;

    escuridao.style.maskImage = mascara;
escuridao.style.webkitMaskImage = mascara;

    brilho.style.background =

`radial-gradient(circle ${raio+40}px at ${x}px ${y}px,

rgba(255,220,120,${(0.18 + intensidadeChama * 0.0025) * intensidadeFinal}),

transparent 75%)`;

}