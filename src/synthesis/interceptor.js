import { logInfo, logWarn } from '../core/logger.js';
import { playWithCustomPlayer } from '../player/audio.js';
import {
    CAPTURE_HEADER_KEYS,
    mergeSessionHeaders,
} from './session.js';

const BRIDGE_EVENT = 'cgpt-plus-session-headers';
const AUDIO_EVENT = 'cgpt-plus-synthesize-audio';
const PAGE_FLAG = '__cgptPlusFetchPatched';

function normalizeHeaders(headers) {
    if (!headers) return null;

    if (typeof headers.entries === 'function') {
        return Object.fromEntries([...headers.entries()]);
    }

    if (Array.isArray(headers)) {
        return Object.fromEntries(headers);
    }

    return { ...headers };
}

function getHeaderValue(headers, key) {
    if (!headers) return undefined;

    const lowerKey = key.toLowerCase();
    for (const [name, value] of Object.entries(headers)) {
        if (name.toLowerCase() === lowerKey) {
            return value;
        }
    }

    return undefined;
}

function captureHeadersFromRequest(url, headers) {
    if (!url.includes('backend-api')) return;

    const normalized = normalizeHeaders(headers);
    if (!normalized) return;

    mergeSessionHeaders(normalized);
}

function handleSynthesisResponse(url, headers, response) {
    const isDirectSynthesis = url.includes('backend-api/synthesize') && (
        getHeaderValue(headers, 'x-openai-target-path') ||
        getHeaderValue(headers, 'x-openai-target-route')
    );

    if (!url.includes('backend-api/synthesize') || isDirectSynthesis || !response.ok) {
        return;
    }

    logInfo('Resposta de síntese capturada:', url);

    const clone = response.clone();
    clone.arrayBuffer()
        .then(buffer => {
            const blob = new Blob([buffer], { type: 'audio/aac' });
            const objectUrl = URL.createObjectURL(blob);
            playWithCustomPlayer(objectUrl);
        })
        .catch(err => {
            logWarn('Falha ao processar resposta de síntese:', err);
        });
}

/**
 * Código executado no contexto da página para interceptar fetch/XHR nativos.
 * Tampermonkey roda isolado por padrão; o ChatGPT usa o fetch da página.
 */
function buildPageInterceptorSource() {
    const keys = JSON.stringify(CAPTURE_HEADER_KEYS.map(k => k.toLowerCase()));
    const headerEvent = JSON.stringify(BRIDGE_EVENT);
    const audioEvent = JSON.stringify(AUDIO_EVENT);
    const pageFlag = JSON.stringify(PAGE_FLAG);

    return `
(function () {
    if (window[${pageFlag}]) return;
    window[${pageFlag}] = true;

    const KEYS = ${keys};

    function normalizeHeaders(headers) {
        if (!headers) return null;
        if (typeof headers.entries === 'function') {
            return Object.fromEntries(Array.from(headers.entries()));
        }
        if (Array.isArray(headers)) {
            return Object.fromEntries(headers);
        }
        return Object.assign({}, headers);
    }

    function getHeader(headers, key) {
        if (!headers) return undefined;
        const lower = key.toLowerCase();
        for (const name of Object.keys(headers)) {
            if (name.toLowerCase() === lower) return headers[name];
        }
        return undefined;
    }

    function publishHeaders(headers) {
        if (!headers) return;
        const payload = {};
        for (const key of KEYS) {
            const value = getHeader(headers, key);
            if (value) payload[key] = value;
        }
        if (Object.keys(payload).length === 0) return;
        window.dispatchEvent(new CustomEvent(${headerEvent}, { detail: payload }));
    }

    function publishAudio(buffer) {
        const blob = new Blob([buffer], { type: 'audio/aac' });
        const objectUrl = URL.createObjectURL(blob);
        window.dispatchEvent(new CustomEvent(${audioEvent}, { detail: { objectUrl } }));
    }

    const originalFetch = window.fetch;
    window.fetch = async function (resource, options) {
        const url = typeof resource === 'string' ? resource : (resource && resource.url) || '';
        const normalizedHeaders = normalizeHeaders(options && options.headers);

        if (url.includes('backend-api')) {
            publishHeaders(normalizedHeaders);
        }

        const response = await originalFetch.apply(this, arguments);

        const isDirectSynthesis = url.includes('backend-api/synthesize') && (
            getHeader(normalizedHeaders, 'x-openai-target-path') ||
            getHeader(normalizedHeaders, 'x-openai-target-route')
        );

        if (url.includes('backend-api/synthesize') && !isDirectSynthesis && response.ok) {
            response.clone().arrayBuffer()
                .then(publishAudio)
                .catch(function () {});
        }

        return response;
    };

    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;
    const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

    XMLHttpRequest.prototype.open = function (method, url) {
        this.__cgptUrl = typeof url === 'string' ? url : String(url);
        this.__cgptHeaders = {};
        return originalOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.setRequestHeader = function (name, value) {
        this.__cgptHeaders = this.__cgptHeaders || {};
        this.__cgptHeaders[name.toLowerCase()] = value;
        return originalSetRequestHeader.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function () {
        if (this.__cgptUrl && this.__cgptUrl.includes('backend-api')) {
            publishHeaders(this.__cgptHeaders);
        }
        return originalSend.apply(this, arguments);
    };
})();
`;
}

function injectPageInterceptor() {
    if (window[PAGE_FLAG]) return;

    const source = buildPageInterceptorSource();
    const blob = new Blob([source], { type: 'application/javascript' });
    const blobUrl = URL.createObjectURL(blob);
    const script = document.createElement('script');

    script.src = blobUrl;
    script.onload = () => {
        URL.revokeObjectURL(blobUrl);
        script.remove();
    };
    script.onerror = () => {
        URL.revokeObjectURL(blobUrl);
        script.remove();
        logWarn('Falha ao injetar interceptor no contexto da página');
    };

    (document.documentElement || document.head || document.body).appendChild(script);
}

function installBridgeListeners() {
    window.addEventListener(BRIDGE_EVENT, event => {
        mergeSessionHeaders(event.detail);
    });

    window.addEventListener(AUDIO_EVENT, event => {
        const objectUrl = event.detail?.objectUrl;
        if (objectUrl) {
            playWithCustomPlayer(objectUrl);
        }
    });
}

function patchLocalFetch() {
    if (window.__cgptPlusLocalFetchPatched) return;
    window.__cgptPlusLocalFetchPatched = true;

    const originalFetch = window.fetch;

    window.fetch = async function (resource, options) {
        const url = typeof resource === 'string' ? resource : resource?.url ?? '';
        captureHeadersFromRequest(url, options?.headers);

        const response = await originalFetch.apply(this, arguments);
        handleSynthesisResponse(url, normalizeHeaders(options?.headers), response);

        return response;
    };
}

/**
 * Instala interceptores para:
 *  1. Capturar Authorization e headers de sessão das requisições nativas.
 *  2. Redirecionar /synthesize nativo para o player customizado.
 */
export function installFetchInterceptor() {
    installBridgeListeners();
    injectPageInterceptor();
    patchLocalFetch();
    logInfo('Interceptor de fetch instalado');
}
