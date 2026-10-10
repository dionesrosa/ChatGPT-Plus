import { logWarn } from '../core/logger.js';
import { releaseReadingLock } from '../core/state.js';

/**
 * Retorna o botão de voz diretamente visível dentro de um container, se existir.
 * @param {Element|null} container
 * @returns {Element|null}
 */
function findVoiceButton(container) {
    return container?.querySelector('[data-testid="voice-play-turn-action-button"]');
}

/**
 * Abre o menu de "Mais ações" da última mensagem do assistente
 * e aguarda o botão de leitura em voz alta aparecer.
 * Tenta o botão de voz diretamente antes de recorrer ao menu.
 */
export function openLastMessageMenu() {
    const assistantMessages = document.querySelectorAll('[data-message-author-role="assistant"]');
    const lastMessage       = assistantMessages[assistantMessages.length - 1];

    // NOVO: Tenta o botão direto antes do menu
    const directBtn = findVoiceButton(lastMessage);
    if (directBtn) {
        clickPlayButton();
        return;
    }

    // Fallback: abre o menu "Mais ações"
    let moreActionsBtn = lastMessage?.querySelector('button[aria-label="Mais ações"], button[aria-label="More actions"]');
    if (!moreActionsBtn) {
        const allButtons = document.querySelectorAll('button[aria-label="Mais ações"], button[aria-label="More actions"]');
        moreActionsBtn   = allButtons[allButtons.length - 1];
    }

    if (!moreActionsBtn) {
        logWarn('Nenhum botão "Mais ações" encontrado');
        releaseReadingLock();
        return;
    }

    moreActionsBtn.click();

    const attemptToFindPlayButton = (retries = 0) => {
        const playBtn = document.querySelector('[data-testid="voice-play-turn-action-button"]');
        if (playBtn) {
            clickPlayButton();
        } else if (retries < 5) {
            setTimeout(() => attemptToFindPlayButton(retries + 1), 250);
        } else {
            logWarn('Botão de leitura não apareceu após abrir o menu');
            releaseReadingLock();
        }
    };

    setTimeout(() => attemptToFindPlayButton(), 300);
}

/**
 * Gerencia o clique no botão de leitura, tratando o estado "Parar"
 * (quando já existe uma leitura em andamento).
 */
export function clickPlayButton() {
    const playBtn = document.querySelector('[data-testid="voice-play-turn-action-button"]');
    if (!playBtn) {
        logWarn('Botão de leitura sumiu');
        releaseReadingLock();
        return;
    }

    if (playBtn.textContent?.trim() === 'Parar') {
        playBtn.click();

        setTimeout(() => {
            const btn = document.querySelector('[data-testid="voice-play-turn-action-button"]');
            if (btn && btn.textContent?.trim() !== 'Parar') {
                startReadingUI(btn);
            } else {
                setTimeout(() => {
                    const btn2 = document.querySelector('[data-testid="voice-play-turn-action-button"]');
                    if (btn2 && btn2.textContent?.trim() !== 'Parar') {
                        startReadingUI(btn2);
                    } else {
                        logWarn('Não foi possível iniciar leitura após parar');
                        releaseReadingLock();
                    }
                }, 500);
            }
        }, 500);

        return;
    }

    startReadingUI(playBtn);
}

/** Clica no botão de leitura e foca o campo de texto */
export function startReadingUI(button) {
    button.click();
    setTimeout(() => document.querySelector('#prompt-textarea')?.focus(), 500);
    releaseReadingLock();
}
