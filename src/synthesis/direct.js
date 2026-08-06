import { logInfo, logWarn } from '../core/logger.js';
import { releaseReadingLock } from '../core/state.js';
import { TTS_VOICE } from '../config/settings.js';
import { sessionHeaders } from './interceptor.js';
import { playWithCustomPlayer } from '../player/audio.js';
import { openLastMessageMenu } from '../ui/menu.js';

/**
 * Extrai o conversation_id da URL atual.
 * Formato esperado: chatgpt.com/c/<uuid>
 * @returns {string|null}
 */
export function getConversationId() {
    const match = location.pathname.match(/\/c\/([a-f0-9-]{36})/i);
    return match ? match[1] : null;
}

/**
 * Extrai o message_id da última mensagem do assistente no DOM.
 * O ChatGPT armazena o ID no atributo data-message-id.
 * @returns {string|null}
 */
export function getLastMessageId() {
    const messages = document.querySelectorAll(
        '[data-message-author-role="assistant"][data-message-id]'
    );
    const last = messages[messages.length - 1];
    return last?.dataset?.messageId ?? null;
}

/**
 * Solicita a síntese de voz diretamente ao backend do ChatGPT,
 * sem precisar simular cliques na UI.
 *
 * Fallback: se o token de autorização ainda não foi capturado,
 * cai para o fluxo de clique na UI (que dispara a síntese e
 * popula sessionHeaders para as próximas chamadas).
 */
export async function requestSynthesisDirect() {
    const conversationId = getConversationId();
    const messageId      = getLastMessageId();

    if (!conversationId || !messageId) {
        logWarn('Não foi possível obter conversation_id ou message_id', { conversationId, messageId });
        releaseReadingLock();
        return;
    }

    if (!sessionHeaders['Authorization']) {
        logWarn('Token de autorização ainda não capturado – usando fallback via UI');
        openLastMessageMenu();
        return;
    }

    const url = 'https://chatgpt.com/backend-api/synthesize'
        + `?message_id=${encodeURIComponent(messageId)}`
        + `&conversation_id=${encodeURIComponent(conversationId)}`
        + `&voice=${encodeURIComponent(TTS_VOICE)}`
        + `&format=aac`;

    logInfo('Requisitando síntese direta:', url);

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization':               sessionHeaders['Authorization'],
                'OAI-Language':                sessionHeaders['OAI-Language']                ?? 'pt-BR',
                'OAI-Session-Id':              sessionHeaders['OAI-Session-Id']              ?? '',
                'OAI-Device-Id':               sessionHeaders['OAI-Device-Id']               ?? '',
                'OAI-Client-Build-Number':     sessionHeaders['OAI-Client-Build-Number']     ?? '',
                'OAI-Client-Version':          sessionHeaders['OAI-Client-Version']          ?? '',
                'X-OAI-IS-Client-Observation': sessionHeaders['X-OAI-IS-Client-Observation'] ?? '',
                'X-OpenAI-Target-Path':        '/backend-api/synthesize',
                'X-OpenAI-Target-Route':       '/backend-api/synthesize',
            },
        });

        if (!response.ok) {
            logWarn(`Erro na síntese: HTTP ${response.status}`);
            releaseReadingLock();
            return;
        }

        const buffer    = await response.arrayBuffer();
        const blob      = new Blob([buffer], { type: 'audio/aac' });
        const objectUrl = URL.createObjectURL(blob);
        playWithCustomPlayer(objectUrl);

    } catch (err) {
        logWarn('Falha ao solicitar síntese:', err);
        releaseReadingLock();
    }
}
