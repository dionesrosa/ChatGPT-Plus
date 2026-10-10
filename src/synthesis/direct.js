import { logInfo, logWarn } from '../core/logger.js';
import { releaseReadingLock, setSynthesizing } from '../core/state.js';
import { TTS_VOICE } from '../config/settings.js';
import {
    getAuthorizationHeader,
    getSessionHeader,
    mergeSessionHeaders,
} from './session.js';
import { playWithCustomPlayer } from '../player/audio.js';
import { openLastMessageMenu } from '../ui/menu.js';
import { showLoadingIndicator, hideLoadingIndicator } from '../player/controls.js';

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
 * Ordem:
 *  1. Headers capturados pelo interceptor (fetch/XHR nativos)
 *  2. localStorage accountSwitchSessions (JWT RS256 em algumas contas)
 * @returns {string|null}
 */
function resolveAuthToken() {
    const captured = getAuthorizationHeader();
    if (captured) {
        return captured;
    }

    try {
        const raw = localStorage.getItem('oai/apps/accountSwitchSessions');
        const sessions = JSON.parse(raw);
        const token = Array.isArray(sessions)
            ? sessions.find(s => s?.sessionToken?.startsWith('eyJhbGciOiJSUzI1NiI'))?.sessionToken
            : null;

        if (token) {
            logInfo('Token obtido do localStorage');
            mergeSessionHeaders({ authorization: `Bearer ${token}` });
            return `Bearer ${token}`;
        }
    } catch (_) {}

    return null;
}

function buildSynthesisHeaders(authToken) {
    const headers = {
        authorization:     authToken,
        'accept':          '*/*',
        'accept-language': 'pt-BR,pt-PT;q=0.9,pt;q=0.8,en-US;q=0.7,en;q=0.6',
        'origin':          'https://chatgpt.com',
        'referer':         'https://chatgpt.com/',
        'oai-language':    getSessionHeader('OAI-Language') ?? 'pt-BR',
    };

    const accountId = getSessionHeader('Chatgpt-Account-Id');
    if (accountId) headers['chatgpt-account-id'] = accountId;

    const oaiDid = getSessionHeader('OAI-DID');
    if (oaiDid) headers['oai-did'] = oaiDid;

    const originator = getSessionHeader('Originator');
    if (originator) headers['originator'] = originator;

    const webFrontend = getSessionHeader('X-OpenAI-Web-Frontend');
    if (webFrontend) headers['x-openai-web-frontend'] = webFrontend;

    return headers;
}

/**
 * Solicita a síntese de voz via /backend-api/synthesize e reproduz no player.
 * Se o token ainda não existir, usa a UI nativa para capturá-lo na primeira vez.
 */
export async function requestSynthesisDirect() {
    const authToken = resolveAuthToken();

    if (!authToken) {
        logInfo('Token ainda não disponível – aguardando requisição nativa ou usando UI');
        openLastMessageMenu();
        return;
    }

    const conversationId = getConversationId();
    const messageId = getLastMessageId();

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

    showLoadingIndicator();

    try {
        setSynthesizing(true);
        window.__cgptIsSynthesizing = true;

        const response = await fetch(url, {
            method: 'GET',
            credentials: 'include',
            headers: buildSynthesisHeaders(authToken),
        });

        if (!response.ok) {
            logWarn(`Erro na síntese: HTTP ${response.status}`);
            hideLoadingIndicator();
            releaseReadingLock();
            return;
        }

        const contentType = response.headers.get('content-type') ?? '';
        if (contentType.includes('application/json')) {
            logWarn('Resposta inesperada (JSON) em vez de áudio');
            hideLoadingIndicator();
            releaseReadingLock();
            return;
        }

        const buffer = await response.arrayBuffer();
        if (!buffer.byteLength) {
            logWarn('Resposta de áudio vazia');
            hideLoadingIndicator();
            releaseReadingLock();
            return;
        }

        const blob = new Blob([buffer], { type: 'audio/aac' });
        const objectUrl = URL.createObjectURL(blob);
        playWithCustomPlayer(objectUrl);
    } catch (err) {
        hideLoadingIndicator();
        logWarn('Falha ao solicitar síntese:', err);
        releaseReadingLock();
    } finally {
        setSynthesizing(false);
        window.__cgptIsSynthesizing = false;
    }
}
