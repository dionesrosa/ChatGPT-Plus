// ==UserScript==
// @name         ChatGPT Plus
// @namespace    https://github.com/dionesrosa
// @version      0.2.2
// @description  Reprodução automática de voz ao finalizar resposta no chat do ChatGPT.
// @author       Diones Souza
// @license      MIT
// @icon         data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAIAAeIhvAAAAAElFTkSuQmCC
// @homepageURL  https://github.com/dionesrosa/ChatGPT-Plus
// @supportURL   https://github.com/dionesrosa/ChatGPT-Plus/issues
// @updateURL    https://raw.githubusercontent.com/dionesrosa/ChatGPT-Plus/main/dist/chatgpt-plus.user.js
// @downloadURL  https://raw.githubusercontent.com/dionesrosa/ChatGPT-Plus/main/dist/chatgpt-plus.user.js
// @match        *://chatgpt.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-idle
// @noframes
// ==/UserScript==

(function() {
    'use strict';

    // ============================
    //  Configurações do script
    // ============================
    const SCRIPT_NAME    = 'ChatGPT Plus';
    const SCRIPT_VERSION = '0.2.1';
    
    // ============================
    //  Estado interno
    // ============================
    let isReading = false;          // Indica se a leitura está em andamento (evita disparos repetidos)
    let lastState = null;           // Último estado observado ('gerando' ou 'idle')
    let monitorInterval = null;     // Referência ao setInterval do monitor
    let resetTimeout = null;        // Timeout de segurança para desbloquear isReading
    
    // ============================
    //  Funções auxiliares de log
    // ============================
    function logInfo(...args) {
        console.log(`[${SCRIPT_NAME} v${SCRIPT_VERSION}]`, ...args);
    }
    function logWarn(...args) {
        console.warn(`[${SCRIPT_NAME} v${SCRIPT_VERSION}]`, ...args);
    }
    
    // ============================
    //  Gerenciamento do bloqueio (isReading)
    // ============================
    
    /** Reseta o bloqueio de forma segura (limpa timeout e libera a flag) */
    function resetReadingLock() {
        clearTimeout(resetTimeout);
        isReading = false;
    }
    
    /**
     * Agenda um timeout de segurança para desbloquear isReading
     * @param {number} ms - tempo em milissegundos (padrão 15000)
     */
    function scheduleSafetyReset(ms = 15000) {
        resetTimeout = setTimeout(() => {
            logWarn('Timeout de segurança – resetando isReading');
            resetReadingLock();
        }, ms);
    }
    
    // ============================
    //  Lógica principal de interação com a UI
    // ============================
    
    /** Chamado quando a resposta termina de ser gerada */
    function onResponseFinished() {
        if (isReading) return;              // já está processando
        isReading = true;
        scheduleSafetyReset(15000);         // trava por até 15s, caso algo falhe
    
        // Pequena pausa para garantir que o menu de ações esteja disponível
        setTimeout(() => openLastMessageMenu(), 400);
    }
    
    /** Abre o menu de "Mais ações" da última mensagem do assistente */
    function openLastMessageMenu() {
        // Localiza todas as mensagens do assistente
        const assistantMessages = document.querySelectorAll('[data-message-author-role="assistant"]');
        const lastMessage = assistantMessages[assistantMessages.length - 1];
    
        // Tenta obter o botão "Mais ações" dentro da última mensagem
        let moreActionsBtn = lastMessage?.querySelector('button[aria-label="Mais ações"]');
        // Fallback: se não encontrou, pega o último botão "Mais ações" da página
        if (!moreActionsBtn) {
            const allButtons = document.querySelectorAll('button[aria-label="Mais ações"]');
            moreActionsBtn = allButtons[allButtons.length - 1];
        }
    
        if (!moreActionsBtn) {
            logWarn('Nenhum botão "Mais ações" encontrado');
            resetReadingLock();
            return;
        }
    
        // Abre o menu
        moreActionsBtn.click();
    
        // Aguarda o botão de leitura aparecer no menu (com tentativas)
        const attemptToFindPlayButton = (retries = 0) => {
            const playBtn = document.querySelector('[data-testid="voice-play-turn-action-button"]');
            if (playBtn) {
                clickPlayButton();
            } else if (retries < 5) {
                setTimeout(() => attemptToFindPlayButton(retries + 1), 250);
            } else {
                logWarn('Botão de leitura não apareceu após abrir o menu');
                resetReadingLock();
            }
        };
    
        // Espera um pouco antes de começar a procurar
        setTimeout(() => attemptToFindPlayButton(), 300);
    }
    
    /** Gerencia o clique no botão de leitura, tratando o estado "Parar" */
    function clickPlayButton() {
        const playBtn = document.querySelector('[data-testid="voice-play-turn-action-button"]');
        if (!playBtn) {
            logWarn('Botão de leitura sumiu');
            resetReadingLock();
            return;
        }
    
        const currentState = playBtn.textContent?.trim();
    
        // Se estiver tocando ("Parar"), interrompe para poder reiniciar
        if (currentState === 'Parar') {
            playBtn.click(); // para a reprodução
    
            // Aguarda a transição e tenta novamente (máximo 2 tentativas)
            setTimeout(() => {
                const btnAfterStop = document.querySelector('[data-testid="voice-play-turn-action-button"]');
                if (btnAfterStop && btnAfterStop.textContent?.trim() !== 'Parar') {
                    startReading(btnAfterStop);
                } else {
                    // Segunda tentativa
                    setTimeout(() => {
                        const btnAfterSecond = document.querySelector('[data-testid="voice-play-turn-action-button"]');
                        if (btnAfterSecond && btnAfterSecond.textContent?.trim() !== 'Parar') {
                            startReading(btnAfterSecond);
                        } else {
                            logWarn('Não foi possível iniciar leitura após parar');
                            resetReadingLock();
                        }
                    }, 500);
                }
            }, 500);
            return;
        }
    
        // Estado já pronto para tocar
        startReading(playBtn);
    }
    
    /** Executa o clique no botão de leitura e foca no campo de texto */
    function startReading(button) {
        button.click();
        setTimeout(() => {
            document.querySelector('#prompt-textarea')?.focus();
        }, 500);
        resetReadingLock(); // libera o bloqueio após iniciar
    }
    
    // ============================
    //  Monitoramento do estado de geração
    // ============================
    
    /** Verifica se a resposta terminou de ser gerada */
    function checkGenerationState() {
        const stopButton = document.querySelector('[data-testid="stop-button"]');
        const currentState = stopButton ? 'gerando' : 'idle';
    
        // Se mudou de 'gerando' para 'idle', a resposta finalizou
        if (lastState === 'gerando' && currentState === 'idle') {
            logInfo('Resposta finalizada – iniciando reprodução automática');
            onResponseFinished();
        }
    
        lastState = currentState;
    }
    
    /** Inicia o monitoramento periódico do estado */
    function startMonitoring() {
        if (monitorInterval) return; // evita múltiplos intervalos
        monitorInterval = setInterval(checkGenerationState, 700);
        logInfo('Monitoramento iniciado');
    }
    
    // ============================
    //  Inicialização
    // ============================
    
    // Garante que o monitoramento comece quando o DOM estiver pronto
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        startMonitoring();
    } else {
        window.addEventListener('DOMContentLoaded', startMonitoring);
    }
    
    logInfo('Script carregado');
})();