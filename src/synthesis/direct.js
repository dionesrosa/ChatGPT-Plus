import { logInfo, logWarn } from '../core/logger.js';
import { releaseReadingLock } from '../core/state.js';
import { TTS_VOICE } from '../config/settings.js';
import { sessionHeaders } from './interceptor.js';
import { playWithCustomPlayer } from '../player/audio.js';

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
 * Tenta obter o token Bearer de autorização.
 * Ordem de prioridade:
 *  1. sessionHeaders — capturado pelo interceptor de fetch
 *  2. window.__NEXT_DATA__ — injetado pelo Next.js no HTML da página
 *  3. endpoint /api/auth/session — chamada leve que retorna a sessão atual
 * @returns {Promise<string|null>}
 */
async function resolveAuthToken() {
    // 1. Já capturado pelo interceptor
    if (sessionHeaders['Authorization']) {
        return sessionHeaders['Authorization'];
    }

    // 2. Token injetado pelo Next.js no HTML
    try {
        const token = window.__NEXT_DATA__?.props?.pageProps?.user?.accessToken;
        if (token) return `Bearer ${token}`;
    } catch (_) {}

    // 3. Endpoint de sessão leve
    try {
        const res  = await fetch('/api/auth/session');
        const data = await res.json();
        const token = data?.accessToken;
        if (token) return `Bearer ${token}`;
    } catch (_) {}

    return null;
}

/**
 * Solicita a síntese de voz diretamente ao backend do ChatGPT,
 * sem simular cliques na UI.
 */
export async function requestSynthesisDirect() {
    const conversationId = getConversationId();
    const messageId      = getLastMessageId();

    if (!conversationId || !messageId) {
        logWarn('Não foi possível obter conversation_id ou message_id', { conversationId, messageId });
        releaseReadingLock();
        return;
    }

    const authToken = await resolveAuthToken();

    if (!authToken) {
        logWarn('Token de autorização não disponível — abortando síntese direta');
        releaseReadingLock();
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
                'Authorization':               authToken,
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
