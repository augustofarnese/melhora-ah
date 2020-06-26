// ==UserScript==
// @name         MelhoraAH
// @namespace    http://tampermonkey.net/
// @version      0.5.2
// @description  Para facilitar a gestão do banco de horas, o MelhoraAH adiciona ao menu do AH informações sobre o banco de horas e as horas trabalhadas no dia.
// @author       Augusto Farnese e JMMCCota
// @match        http*://ah.synergia.dcc.ufmg.br/ah/*
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @require      http://code.jquery.com/jquery-latest.js
// @resource     animateCSS https://cdn.jsdelivr.net/npm/animate.css@3.5.2/animate.min.css
// @updateURL    https://raw.githubusercontent.com/synergia-labs/melhora-ah/master/melhoraAh.user.js
// @downloadURL  https://raw.githubusercontent.com/synergia-labs/melhora-ah/master/melhoraAh.user.js
// @run-at document-start
// ==/UserScript==

var newCSS = GM_getResourceText("animateCSS");
GM_addStyle(newCSS);

GM_addStyle( `


body > table > tbody > tr > td:nth-child(1) > table > tbody > tr > td hr{
border: none;
}

body > table > tbody > tr > td:nth-child(1) > table > tbody > tr > td {
font-family: Helvetica;
    font-size: 15px;
    line-height: 1.6em;
}

body > table > tbody > tr > td:nth-child(1) > table > tbody > tr > td a:hover{
text-decoration: underline;
}
body > table > tbody > tr > td:nth-child(1) > table > tbody > tr > td a{

    color: black;
    font-weight: initial ;
    TEXT-DECORATION: none;
}

body > table > tbody > tr > td:nth-child(1) > table > tbody > tr > td a.ativo{
font-weight: bold;
}

.tickbg {content:"\\00a0";
         border: solid 8px #649917;
         border-radius: 9px;
         -moz-border-radius: 9px;
         -webkit-border-radius: 9px;
         height: 0;
         width: 0;
         display: inline-block;
position:relative;
top: 3px;
left: 3px;}


.tick {height: 6px;
       width: 3px;
       border: solid #FFFFFF;
       border-width: 0px 2px 2px 0px;
       -webkit-transform: rotate(45deg);
       -moz-transform: rotate(45deg);
       -o-transform: rotate(45deg);
       display: block;
        margin-top: -5px;
        margin-left: -2px;}


.btn,
body > table > tbody > tr > td:nth-child(1) > table > tbody > tr > td > a:nth-child(4),
body > table > tbody > tr > td:nth-child(1) > table > tbody > tr > td > a:nth-child(6){
width: 230px !important;
font-family: "Helvetica Neue",Helvetica,Arial,sans-serif !important;
padding: 6px 12px !important;
margin-bottom: 0 !important;
font-size: 14px !important;
font-weight: 400 !important;
line-height: 1.42857143 !important;
text-align: center !important;
white-space: nowrap !important;
vertical-align: middle !important;
-ms-touch-action: manipulation !important;
touch-action: manipulation !important;
cursor: pointer !important;
-webkit-user-select: none !important;
-moz-user-select: none !important;
-ms-user-select: none !important;
user-select: none !important;
background-image: none !important;
border: 1px solid !important;
border-radius: 4px !important;
margin-bottom: 10px !important;
}

.btn:hover{
text-decoration:none !important;
}

.btn-iniciar,
body > table > tbody > tr > td:nth-child(1) > table > tbody > tr > td > a:nth-child(4){
background-color: #337ab7 ;
border-color: #2e6da4 ;
display: inline-block;
color: #fff !important;
}

.btn-iniciar:hover{
background-color: #286090 !important;
    border-color: #204d74 !important;

}

.btn-finalizar,
body > table > tbody > tr > td:nth-child(1) > table > tbody > tr > td > a:nth-child(6){
color: #333  !important;
    background-color: #fff;
    border-color: #ccc;
display: inline-block;
}

.btn-finalizar:hover{
color: #333  !important;
    background-color: #e6e6e6  !important;
    border-color: #adadad  !important;
}
            `);

(function () {
  'use strict';
  /*global localStorage: false, console: false, $: false, prompt: false, window: false, document: false */
  /*
      // Mudanças no estilo
      $("head").append('<link href="https://fonts.googleapis.com/css?family=Roboto" rel="stylesheet">'); //Importa Roboto

      GM_addStyle( "                                     \
      table {                                   \
          font-family: Roboto !important; \
          font-size: 12px !important; \
         }                                               \
  " );
  */



  var horasNoBancoDeHorasGeral, saldoDeHorasDoMes, horasTrabalhadasDoDia, dedicacaoDiaria;

  if (!localStorage.dedicacaoDiaria) {
    localStorage.dedicacaoDiaria = prompt("Quantas horas você trabalha por dia?");
  }
  dedicacaoDiaria = localStorage.dedicacaoDiaria;


  function converteDecimalParaHoras(horaDecimal) {
    var horasString = parseInt(horaDecimal, 10) + ':' + ("0" + parseInt(Math.abs(horaDecimal) % 1 * 60, 10)).slice(-2);
    if(horaDecimal < 0 && horaDecimal > -1) {
      return '-' + horasString;
    }
    return horasString;
  }


  function verificaBancoDeHoras() {
    $.ajax({
      url: '//ah.synergia.dcc.ufmg.br/ah/Banco_de_horas.jsp',
      success: function (data) {
        var d, mesAtual, anoAtual;
        horasNoBancoDeHorasGeral = parseFloat($('b:last', data).parent().contents().filter(function () { return this.nodeType === 3; })[1].data);

        d = new Date();
        mesAtual = d.getMonth() + 1;
        anoAtual = d.getYear() + 1900;

        mesAtual = ("0" + mesAtual).slice(-2); //Garante que tem 2 dígitos
        $.ajax({
          url: '//ah.synergia.dcc.ufmg.br/ah/horas_trabalhadas.jsp',
          data: {
            dataInicio: '01/' + mesAtual + '/' + anoAtual,
            dataFim: '',
            projeto: '-1',
            txtDescricao: ''
          },
          success: function (data) {
            var textosDaPagina, style;
            textosDaPagina = $('b:last', data).parent().contents().filter(function () { return this.nodeType === 3; });
            saldoDeHorasDoMes = parseFloat((textosDaPagina[textosDaPagina.length - 2].data).replace(' hrs','').replace(',','.'));
            saldoDeHorasDoMes += horasNoBancoDeHorasGeral;
            if (Math.abs(saldoDeHorasDoMes) > dedicacaoDiaria * 2) {
              if (saldoDeHorasDoMes > 0) {
                style = {
                  color: "blue",
                  fontWeight: "bold"
                };
              } else {
                style = {
                  color: "red",
                  fontWeight: "bold"
                };
              }
            } else {
              style = {
                color: "black",
                fontWeight: "normal"
              };
            }
            $('#saldoBancoDeHoras').css(style).text('(' + converteDecimalParaHoras(saldoDeHorasDoMes) + ')');
          }
        });
      }
    });

    $.ajax({
      url: '//ah.synergia.dcc.ufmg.br/ah/horas_trabalhadas_do_dia.jsp',
      success: function (data) {
        var textosDaPagina = $('b:last', data).parent().contents().filter(function () {return (this.nodeType === 3 && this.nodeValue.endsWith("hrs ")); });
        var horaDeInicio = $('b:last', data).parent().contents().filter(function () {return (this.nodeType === 3); });
        horasTrabalhadasDoDia = parseFloat(textosDaPagina[0].data);
        $('#horasTrabalhadasDoDia').text('(' + converteDecimalParaHoras(horasTrabalhadasDoDia) + ')');
        console.log($('.tickbg'));
        if((horasTrabalhadasDoDia > dedicacaoDiaria) && ($('.tickbg').length == 0)){
          $('#horasTrabalhadasDoDia').after('<div class="tickbg animated bounceIn"><div class="tick"></div></div>');
        }
        $('.btn-finalizar').text('Finalizar Tarefa (' + horaDeInicio[1].data.substring(15, 20) + ')');
      }
    });
  }

  $(window).on("blur focus", function (e) {
    var prevType = $(this).data("prevType");

    if (prevType !== e.type) {   //  reduce double fire issues
      switch (e.type) {
        case "blur":
          break;
        case "focus":
          verificaBancoDeHoras();
          break;
      }
    }



    $(this).data("prevType", e.type);
  });

  function verificaSeTemTarefaAtiva(){
    $.ajax({
      url: '//ah.synergia.dcc.ufmg.br/ah/remove_tarefa.jsp',
      success: function (data) {
        //console.log(data);
        var textoDeNenhumaTarefaAtiva = $(data).text();
        //console.log(textoDeNenhumaTarefaAtiva);
        if (textoDeNenhumaTarefaAtiva.indexOf("Tarefa Ativa iniciada em:") >= 0) {
          $('body > table > tbody a:contains("Finaliza Tarefa")').show().addClass('btn btn-finalizar');
          $('body > table > tbody a:contains("Inicia Tarefa")').hide();
          $('body > table > tbody a:contains("Inicia Tarefa")').next().hide();
        } else {
          $('body > table > tbody a:contains("Finaliza Tarefa")').hide();
          $('body > table > tbody a:contains("Finaliza Tarefa")').next().hide();
          $('body > table > tbody a:contains("Inicia Tarefa")').show().addClass('btn btn-iniciar').html('Iniciar Tarefa');
        }
      }
    });
  }

  $(document).ready(function () {

    verificaSeTemTarefaAtiva();
    $('a[href="Banco_de_horas.jsp"]').after(' <span id="saldoBancoDeHoras"></span>');
    $('a[href="horas_trabalhadas_do_dia.jsp"]').after(' <span id="horasTrabalhadasDoDia"></span>');
    $('body > table > tbody > tr > td:nth-child(1) > table > tbody > tr > td > a:contains("Suporte e contato")').hide();

    verificaBancoDeHoras();

    // Facilita o preenchimento das horas com duplo clique
    $('.relatorio input[type=text]').dblclick(function () {
      if (parseFloat($('input[name=horasAapropriar]').val(), 10) > 0) {
        $(this).val($('input[name=horasAapropriar]').val());
      }
    });

    //Adicionar links para as tasks do Jira e arruma formato das horas
    const padraoIssueJira = /((?!([A-Z0-9a-z]{1,10})-?$)[A-Z]{1}[A-Z0-9]+-\d+)/g;
    const padraoHoraDecimal = /^[+-]?\d+(\.\d+)?$/;

    for(var i = 0; i < $('td.relatorio').length; i++){
      var $elemento = $(`td.relatorio:eq(${i})`);
      var idJira = $elemento.text().match(padraoIssueJira);
      var horaDecimal = $elemento.text().match(padraoHoraDecimal);
      if(idJira !== null){
        $elemento.wrapInner(`<a href="//jira.synergia.dcc.ufmg.br/browse/${idJira[0]}"></a>`);
      }
      if(horaDecimal !== null) {
        let horaPadraoNormal = converteDecimalParaHoras(horaDecimal[0]);
        $elemento.text(horaPadraoNormal);
      }
    }
  });
})();
