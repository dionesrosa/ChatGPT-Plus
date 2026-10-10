import { logWarn } from './logger.js';

/** Indica se a leitura está em andamento (evita disparos repetidos) */
export let isReading = false;

/** Último estado observado pelo monitor: 'gerando' | 'idle' | null */
export let lastState = null;

/** Referência ao setInterval do monitor de geração */
export let monitorInterval = null;

/** Timeout de segurança para desbloquear isReading */
let resetTimeout = null;

/** Marca o início do processamento e agenda reset de segurança */
export function acquireReadingLock(safetyMs = 20000) {
    isReading = true;
    resetTimeout = setTimeout(() => {
        logWarn('Timeout de segurança – resetando isReading');
        releaseReadingLock();
    }, safetyMs);
}

/** Libera o bloqueio de leitura de forma segura */
export function releaseReadingLock() {
    clearTimeout(resetTimeout);
    isReading = false;
}

/** Atualiza o último estado observado pelo monitor */
export function setLastState(value) {
    lastState = value;
}

/** Armazena a referência do intervalo do monitor */
export function setMonitorInterval(ref) {
    monitorInterval = ref;
}

/** Indica se uma síntese direta está em andamento */
export let isSynthesizing = false;

/** Define o estado de síntese em andamento */
export function setSynthesizing(value) {
    isSynthesizing = value;
}
