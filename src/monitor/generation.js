import { logInfo } from '../core/logger.js';
import { isReading, lastState, monitorInterval, acquireReadingLock, setLastState, setMonitorInterval } from '../core/state.js';
import { PLAY_MODE } from '../config/settings.js';
import { requestSynthesisDirect } from '../synthesis/direct.js';
import { openLastMessageMenu } from '../ui/menu.js';

/** Chamado quando a geração de resposta é concluída */
function onResponseFinished() {
    if (isReading) return;
    acquireReadingLock(20000);

    // Pequena pausa para o DOM finalizar a renderização da mensagem
    if (PLAY_MODE === 'player') {
        setTimeout(() => requestSynthesisDirect(), 400);
    } else {
        setTimeout(() => openLastMessageMenu(), 400);
    }
}

/** Localiza o botão de parar geração com múltiplos seletores de fallback */
function findStopButton() {
    return (
        document.querySelector('[data-testid="stop-button"]') ||
        document.querySelector('[data-testid="composer-cancel-button"]') ||
        document.querySelector('button[aria-label="Stop generating"]') ||
        document.querySelector('button[aria-label="Parar de gerar"]') ||
        document.querySelector('button[data-testid*="stop"]')
    );
}

/** Verifica se a resposta terminou de ser gerada comparando estados consecutivos */
export function checkGenerationState() {
    const stopButton   = findStopButton();
    const currentState = stopButton ? 'gerando' : 'idle';

    if (lastState === 'gerando' && currentState === 'idle') {
        logInfo('Resposta finalizada – iniciando reprodução automática');
        onResponseFinished();
    }

    setLastState(currentState);
}

/** Inicia o monitoramento periódico do estado de geração */
export function startMonitoring() {
    if (monitorInterval) return;
    setMonitorInterval(setInterval(checkGenerationState, 700));
    logInfo('Monitoramento iniciado');
}
