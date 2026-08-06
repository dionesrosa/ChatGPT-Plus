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
 * Tenta obter o Bearer token de autorização.
 * Ordem de prioridade:
 *  1. sessionHeaders — capturado pelo interceptor a partir do /synthesize nativo
 *  2. localStorage 'oai/apps/accountSwitchSessions' — disponível em algumas contas
 *     onde o sessionToken é um JWT RS256 (não um JWE criptografado)
 * @returns {string|null}
 */
function resolveAuthToken() {
    // 1. Capturado pelo interceptor (mais confiável)
    if (sessionHeaders['Authorization']) {
        return sessionHeaders['Authorization'];
    }

    // 2. localStorage — só funciona quando sessionToken é JWT RS256
    try {
        const raw      = localStorage.getItem('oai/apps/accountSwitchSessions');
        const sessions = JSON.parse(raw);
        const token    = Array.isArray(sessions)
            ? sessions.find(s => s?.sessionToken?.startsWith('eyJhbGciOiJSUzI1NiI'))?.sessionToken
            : null;
        if (token) {
            logInfo('Token obtido do localStorage');
            return `Bearer ${token}`;
        }
    } catch (_) {}

    return null;
}

/**
 * Solicita a síntese de voz.
 *
 * Se o token já estiver disponível (via interceptor ou localStorage), faz a
 * requisição diretamente ao backend.
 *
 * Caso contrário (primeira resposta, conta com JWE), usa o fluxo de UI para
 * disparar o /synthesize nativo — o interceptor captura o token e o áudio é
 * redirecionado para o player customizado.
 */
export async function requestSynthesisDirect() {
    const authToken = resolveAuthToken();

    if (!authToken) {
        logInfo('Token ainda não disponível – usando UI para capturar na primeira vez');
        openLastMessageMenu();
        return;
    }

    const conversationId = getConversationId();
    const messageId      = getLastMessageId();

    if (!conversationId || !messageId) {
        logWarn('Não foi possível obter conversation_id ou message_id', { conversationId, messageId });
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
                'authorization':               authToken,
                'oai-language':                sessionHeaders['OAI-Language']                ?? 'pt-BR',
                'oai-session-id':              sessionHeaders['OAI-Session-Id']              ?? '',
                'oai-device-id':               sessionHeaders['OAI-Device-Id']               ?? '',
                'oai-client-build-number':     sessionHeaders['OAI-Client-Build-Number']     ?? '',
                'oai-client-version':          sessionHeaders['OAI-Client-Version']          ?? '',
                'x-oai-is-client-observation': sessionHeaders['X-OAI-IS-Client-Observation'] ?? '',
                'x-openai-target-path':        '/backend-api/synthesize',
                'x-openai-target-route':       '/backend-api/synthesize',
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
