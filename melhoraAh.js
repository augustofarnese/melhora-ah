// ==UserScript==
// @name         MelhoraAH
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Adiciona informações importantes ao AH!
// @author       Augusto Farnese
// @match        http://ull/ah/*
// @grant        none
// @require http://code.jquery.com/jquery-latest.js
// ==/UserScript==

(function() {
    'use strict';    

    var horasNoBancoDeHorasGeral;
    var saldoDeHorasDoMes;
    var horasTrabalhadasDoDia;

		$.ajax({
			url: 'http://ull/ah/Banco_de_horas.jsp',
			success: function(data){
				horasNoBancoDeHorasGeral = parseFloat($('b:last', data).parent().contents().filter(function(){return this.nodeType === 3;})[1].data);
				
				var d = new Date();
				var mesAtual = d.getMonth() + 1;
				var anoAtual = d.getYear() + 1900;
				mesAtual = ("0" + mesAtual).slice(-2); //Garante que tem 2 dígitos
				$.ajax({
					url: 'http://ull/ah/horas_trabalhadas.jsp',
					data: {
						dataInicio: '01/' + mesAtual + '/' + anoAtual,
						dataFim: '',
						projeto: '-1',
						txtDescricao: ''
					},
					success: function(data){
						
				console.log($('b:last', data).parent().contents().filter(function(){return this.nodeType === 3;}));
						saldoDeHorasDoMes = parseFloat($('b:last', data).parent().contents().filter(function(){return this.nodeType === 3;})[4].data);
						$('a[href="Banco_de_horas.jsp"]').after(' <span>(' + converteDecimalParaHoras(horasNoBancoDeHorasGeral + saldoDeHorasDoMes) + ')</span>');
					}
				});
			}
		});


    $.ajax({
        url: 'http://ull/ah/horas_trabalhadas_do_dia.jsp',
        success: function(data){
            horasTrabalhadasDoDia = parseFloat($('b:last', data).parent().contents().filter(function(){return this.nodeType === 3;})[2].data);
            $('a[href="horas_trabalhadas_do_dia.jsp"]').after(' <span>(' + converteDecimalParaHoras(horasTrabalhadasDoDia) + ')</span>');
        }
    });

    function converteDecimalParaHoras (horaDecimal) {
        return parseInt(horaDecimal) + ':' + ("0" + parseInt(Math.abs(horaDecimal) % 1 * 60)).slice(-2);;
    }



})();