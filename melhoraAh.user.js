// ==UserScript==
// @name         MelhoraAH
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Para facilitar a gestão do banco de horas, o MelhoraAH adiciona ao menu do AH informações sobre o banco de horas e as horas trabalhadas no dia.
// @author       Augusto Farnese
// @match        http://ull/ah/*
// @grant        none
// @require http://code.jquery.com/jquery-latest.js
// @updateURL  https://raw.githubusercontent.com/augustofarnese/melhora-ah/master/melhoraAh.user.js
// @downloadURL  https://raw.githubusercontent.com/augustofarnese/melhora-ah/master/melhoraAh.user.js
// ==/UserScript==

(function () {
    'use strict';
    /*global localStorage: false, console: false, $: false, prompt: false */

    function converteDecimalParaHoras(horaDecimal) {
        return parseInt(horaDecimal, 10) + ':' + ("0" + parseInt(Math.abs(horaDecimal) % 1 * 60, 10)).slice(-2);
    }

    var horasNoBancoDeHorasGeral, saldoDeHorasDoMes, horasTrabalhadasDoDia, dedicacaoDiaria;

    if (!localStorage.dedicacaoDiaria) {
        localStorage.dedicacaoDiaria = prompt("Quantas horas você trabalha por dia?");
    }
    dedicacaoDiaria = localStorage.dedicacaoDiaria;

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
                    var textosDaPagina, estiloDoAlerta;
                    textosDaPagina = $('b:last', data).parent().contents().filter(function () { return this.nodeType === 3; });

                    saldoDeHorasDoMes = parseFloat(textosDaPagina[textosDaPagina.length - 2].data);
                    if (Math.abs(saldoDeHorasDoMes) > dedicacaoDiaria * 2) {
                        estiloDoAlerta = saldoDeHorasDoMes > 0 ? "color:red; font-weight:bold;" : "color:blue;  font-weight:bold;";
                    }
                    $('a[href="Banco_de_horas.jsp"]').after(' <span style="' + estiloDoAlerta + '">(' + converteDecimalParaHoras(horasNoBancoDeHorasGeral + saldoDeHorasDoMes) + ')</span>');
                }
            });
        }
    });

    $.ajax({
        url: 'http://ull/ah/horas_trabalhadas_do_dia.jsp',
        success: function (data) {
            var textosDaPagina = $('b:last', data).parent().contents().filter(function () {return (this.nodeType === 3 && this.nodeValue.endsWith("hrs ")); });
            horasTrabalhadasDoDia = parseFloat(textosDaPagina[0].data);
            $('a[href="horas_trabalhadas_do_dia.jsp"]').after(' <span>(' + converteDecimalParaHoras(horasTrabalhadasDoDia) + ')</span>');
        }
    });
})();
