const capa = document.querySelector(".capa-frontal");
const placa = document.querySelector(".placa");

function atualizarLivro(){

    atualizarFisicaLivro();

    desenharLivro();

    capa.style.transform = `rotateY(${-cena.livro.angulo}deg)`;

placa.style.opacity = cena.livro.angulo > 90 ? "0" : "1";
if(cena.livro.animando){

    let alvo = cena.livro.aberto ? 165 : 0;

let forca = (alvo - cena.livro.angulo) * 0.05;

cena.livro.velocidade += forca;

cena.livro.velocidade *= 0.62;

cena.livro.angulo += cena.livro.velocidade;
if(

    Math.abs(alvo - cena.livro.angulo) < 0.2 &&

    Math.abs(cena.livro.velocidade) < 0.2

){

    cena.livro.angulo = alvo;

    cena.livro.velocidade = 0;

    cena.livro.animando = false;

    
            if(cena.livro.aberto){

            capa.style.zIndex = "1";

        }else{

            capa.style.zIndex = "10";

        }

}
}
}
capa.addEventListener("click",()=>{

    if(cena.livro.animando) return;

    if(cena.paginas.animando) return;

    cena.livro.aberto = !cena.livro.aberto;

// Se está fechando, traz a capa para frente antes da animação
if(!cena.livro.aberto){

    capa.style.zIndex = "10";

}

cena.livro.animando = true;

});
function atualizarFisicaLivro(){

}
function desenharLivro(){

    capa.style.transform =
        `rotateY(${-cena.livro.angulo}deg)`;

    placa.style.opacity =
        cena.livro.angulo > 90 ? 0 : 1;

}