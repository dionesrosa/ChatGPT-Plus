import { logInfo, logWarn } from '../core/logger.js';
import { releaseReadingLock } from '../core/state.js';

function findVoiceButton(container) {
    return (
        container?.querySelector('button[aria-label="Ler em voz alta"]') ||
        container?.querySelector('button[aria-label="Read aloud"]') ||
        container?.querySelector('[data-testid="voice-play-turn-action-button"]')
    );
}

function findVoiceButtonGlobal() {
    return (
        document.querySelector('button[aria-label="Ler em voz alta"]') ||
        document.querySelector('button[aria-label="Read aloud"]') ||
        document.querySelector('[data-testid="voice-play-turn-action-button"]')
    );
}

export function openLastMessageMenu() {
    const assistantMessages = document.querySelectorAll('[data-message-author-role="assistant"]');
    const lastMessage       = assistantMessages[assistantMessages.length - 1];

    const directBtn = findVoiceButton(lastMessage);
    if (directBtn) {
        logInfo('Botão de voz encontrado diretamente na mensagem');
        clickPlayButton();
        return;
    }

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
        const playBtn = findVoiceButtonGlobal();
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

export function clickPlayButton() {
    const playBtn = findVoiceButtonGlobal();
    if (!playBtn) {
        logWarn('Botão de leitura sumiu');
        releaseReadingLock();
        return;
    }

    const isPlaying = playBtn.getAttribute('aria-pressed') === 'true'
                   || playBtn.textContent?.trim() === 'Parar'
                   || playBtn.textContent?.trim() === 'Stop';

    if (isPlaying) {
        playBtn.click();

        const waitForIdle = (retries = 0) => {
            const btn = findVoiceButtonGlobal();
            const stillPlaying = btn?.getAttribute('aria-pressed') === 'true'
                              || btn?.textContent?.trim() === 'Parar'
                              || btn?.textContent?.trim() === 'Stop';
            if (btn && !stillPlaying) {
                startReadingUI(btn);
            } else if (retries < 4) {
                setTimeout(() => waitForIdle(retries + 1), 500);
            } else {
                logWarn('Não foi possível iniciar leitura após parar');
                releaseReadingLock();
            }
        };

        setTimeout(() => waitForIdle(), 500);
        return;
    }

    startReadingUI(playBtn);
}

export function startReadingUI(button) {
    button.click();
    setTimeout(() => document.querySelector('#prompt-textarea')?.focus(), 500);
    releaseReadingLock();
}
