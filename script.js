// ==UserScript==
// @name         ChatGPT Web Extras
// @namespace    https://github.com/dionesrosa
// @version      0.1.1
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

(function () {
    'use strict';

    let statusSistema = true;
    let statusGerando = false;
    let statusLeitura = false;
    let ultimoEstado = null;

    console.log('ChatGPT Web Extras carregado!');

    function onRespostaFinalizada() {
        if (statusLeitura) return;

        statusLeitura = true;

        setTimeout(() => {
            abrirMenuUltimaMensagem();
        }, 400);
    }

    function abrirMenuUltimaMensagem() {
        const botoes = document.querySelectorAll('button[aria-label="Mais ações"]');
        const ultimaMensagem = document.querySelectorAll('[data-message-author-role="assistant"]');
        const ultima = ultimaMensagem[ultimaMensagem.length - 1];

        const btn = ultima?.querySelector('button[aria-label="Mais ações"]')
            || botoes[botoes.length - 1];

        if (!btn) {
            statusLeitura = false;
            return;
        }

        btn.click();

        setTimeout(() => {
            clicarLeitura();
        }, 400);
    }

    function clicarLeitura() {
        const btnPlay = document.querySelector('[data-testid="voice-play-turn-action-button"]');

        if (!btnPlay) {
            statusLeitura = false;
            return;
        }

        const estado = btnPlay.textContent?.trim();

        // Se já estiver tocando
        if (estado === "Parar") {
            btnPlay.click();

            setTimeout(() => clicarLeitura(), 400);
            return;
        }

        btnPlay.click();

        setTimeout(() => {
            document.querySelector('#prompt-textarea')?.focus();
        }, 500);

        statusLeitura = false;
    }

    function initialize() {
        if (!statusSistema) return;

        setInterval(() => {
            const stopBtn = document.querySelector('[data-testid="stop-button"]');
            const estado = stopBtn ? "gerando" : "idle";

            if (ultimoEstado === "gerando" && estado === "idle") {
                console.log("TRANSIÇÃO: FINALIZOU");
                onRespostaFinalizada();
            }

            ultimoEstado = estado;
        }, 700);
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        initialize();
    } else {
        window.addEventListener('DOMContentLoaded', initialize);
    }
})();