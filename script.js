// ==UserScript==
// @name         ChatGPT Web Extras
// @namespace    https://github.com/dionesrosa
// @version      0.1
// @description  Ajustes especificos para o ChatGPT Web, como reprodução de mensagens de voz e outras funcionalidades extras.
// @author       Diones Souza
// @license      MIT
// @icon         https://chatgpt.com/favicon.ico
// @homepageURL  https://github.com/dionesrosa/ChatGPT-Web-Extras
// @supportURL   https://github.com/dionesrosa/ChatGPT-Web-Extras/issues
// @updateURL    https://raw.githubusercontent.com/dionesrosa/ChatGPT-Web-Extras/master/script.js
// @downloadURL  https://raw.githubusercontent.com/dionesrosa/ChatGPT-Web-Extras/master/script.js
// @match        *://chatgpt.com/*
// @run-at       document-idle
// @grant        GM_addStyle
// @noframes
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @connect      localhost
// ==/UserScript==

(function() {
    'use strict';
    
    // Variáveis de controle de estado
    let statusSistema = true;
    let statusGerando = false;
    let statusLeitura = false;
    let listenerGeracao = null;

    console.log('ChatGPT Web Extras carregado!');

    // Função para lidar com a finalização da resposta
    function onRespostaFinalizada() {
        if (statusLeitura) return;

        statusLeitura = true;

        setTimeout(() => {
            abrirMenuUltimaMensagem();
        }, 300);
    }

    // Função para abrir o menu da última mensagem
    function abrirMenuUltimaMensagem() {
        const botoes = document.querySelectorAll('button[aria-label="Mais ações"]');
        const ultimo = botoes[botoes.length - 1];

        if (!ultimo) {
            statusLeitura = false;
            return;
        }

        ultimo.click();

        setTimeout(clicarLeitura, 300);
    }

    // Função para clicar no botão de leitura da mensagem
    function clicarLeitura() {
        const btn = document.querySelector('[data-testid="voice-play-turn-action-button"]');

        if (!btn) {
            statusLeitura = false;
            return;
        }

        if (btn.textContent?.includes("Parar")) {
            btn.click();
            setTimeout(clicarLeitura, 300);
            return;
        }

        btn.click();
        statusLeitura = false;
    }

    // Função de inicialização do script
    function initialize() {
        if (!statusSistema) {
            console.log('O sistema de extras está desativado. Ative para usar as funcionalidades extras.');
            return;
        }

        listenerGeracao = setInterval(() => {
            const stopBtn = [...document.querySelectorAll("button")].find(btn => btn.textContent?.includes("Parar geração"));

            if (stopBtn) {
                statusGerando = true;
                console.log('Resposta em geração detectada. Aguardando finalização...');
            } else {
                if (statusGerando) {
                    statusGerando = false;
                    onRespostaFinalizada();
                }
            }
        }, 800);
    }

    // Espera o DOM estar completamente carregado antes de inicializar
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        initialize();
    } else {
        window.addEventListener('DOMContentLoaded', initialize);
    }
})();