// ==UserScript==
// @name         MelhoraAH
// @namespace    http://tampermonkey.net/
// @version      0.3.7
// @description  Para facilitar a gestão do banco de horas, o MelhoraAH adiciona ao menu do AH informações sobre o banco de horas e as horas trabalhadas no dia.
// @author       Joao Cota
// @match        http://ah.synergia.dcc.ufmg.br/*
// @grant        none
// @require http://code.jquery.com/jquery-latest.js
// @updateURL  https://raw.githubusercontent.com/jmmccota/melhora-ah/master/melhoraAh.user.js
// @downloadURL  https://raw.githubusercontent.com/jmmccota/melhora-ah/master/melhoraAh.user.js
// ==/UserScript==

(function () {
    'use strict';
    /*global localStorage: false, console: false, $: false, prompt: false, window: false, document: false */

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
            url: 'http://ull/ah/Banco_de_horas.jsp',
            success: function (data) {
                var d, mesAtual, anoAtual;
                horasNoBancoDeHorasGeral = parseFloat($('b:last', data).parent().contents().filter(function () { return this.nodeType === 3; })[1].data);

                d = new Date();
                mesAtual = d.getMonth() + 1;
                anoAtual = d.getYear() + 1900;

                mesAtual = ("0" + mesAtual).slice(-2); //Garante que tem 2 dígitos
                $.ajax({
                    url: 'http://ull/ah/horas_trabalhadas.jsp',
                    data: {
                        dataInicio: '01/' + mesAtual + '/' + anoAtual,
                        dataFim: '',
                        projeto: '-1',
                        txtDescricao: ''
                    },
                    success: function (data) {
                        var textosDaPagina, style;
                        textosDaPagina = $('b:last', data).parent().contents().filter(function () { return this.nodeType === 3; });
                        saldoDeHorasDoMes = parseFloat(textosDaPagina[textosDaPagina.length - 2].data);
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
            url: 'http://ull/ah/horas_trabalhadas_do_dia.jsp',
            success: function (data) {
                var textosDaPagina = $('b:last', data).parent().contents().filter(function () {return (this.nodeType === 3 && this.nodeValue.endsWith("hrs ")); });
                horasTrabalhadasDoDia = parseFloat(textosDaPagina[0].data);
                $('#horasTrabalhadasDoDia').text('(' + converteDecimalParaHoras(horasTrabalhadasDoDia) + ')');
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
    $(document).ready(function () {
        $('a[href="Banco_de_horas.jsp"]').after(' <span id="saldoBancoDeHoras"></span>');
        $('a[href="horas_trabalhadas_do_dia.jsp"]').after(' <span id="horasTrabalhadasDoDia"></span>');

        verificaBancoDeHoras();

        // Facilita o preenchimento das horas com duplo clique
        $('.relatorio input[type=text]').dblclick(function () {
            if (parseFloat($('input[name=horasAapropriar]').val(), 10) > 0) {
                $(this).val($('input[name=horasAapropriar]').val());
            }
        });
        var verificar = function(arr, str){
            for(var i = 0; i < arr.length; i++){
                if(str.includes(arr[i])) {
                    return true;
                }
            }
            return false;
        };
        var incluir = ['PC', 'PROC', 'WCC', 'SING', 'MYL'];
        var excluir = ['Esforco'];
        for(var i = 0; i < incluir.length; i++){
            excluir.push('name="'+incluir[i]);
        }
        if($(location).attr('pathname').includes('finaliza_tarefa')){
            for(var i = 0; i < $('td .relatorio').length; i++){
                var comp = $('td .relatorio')[i];
                if(verificar(incluir, $(comp).html()) && !verificar(excluir, $(comp).html())){
         //       console.log($(comp).html());
                    $(comp).html('<a href="https://jira.synergia.dcc.ufmg.br/browse/'+$(comp).html()+'">'+$(comp).html()+'</a>');
                }
            }
        }
    });
})();
