import { logInfo } from '../core/logger.js';
import { playWithCustomPlayer } from '../player/audio.js';

/**
 * Headers de sessão coletados ao interceptar requisições ao backend do ChatGPT.
 * Preenchidos automaticamente por installFetchInterceptor().
 */
export const sessionHeaders = {};

/** Chaves de header de sessão que devem ser coletadas */
const SESSION_HEADER_KEYS = [
    'Authorization',
    'OAI-Language',
    'OAI-Session-Id',
    'OAI-Device-Id',
    'OAI-Client-Build-Number',
    'OAI-Client-Version',
    'X-OAI-IS-Client-Observation',
];

/**
 * Faz uma chamada leve ao backend para forçar a captura dos headers de sessão
 * antes que qualquer síntese seja solicitada. Chamado uma vez na inicialização.
 */
export async function warmUpSessionHeaders() {
    try {
        await fetch('https://chatgpt.com/backend-api/me');
        logInfo('Headers de sessão capturados no warm-up');
    } catch (_) {}
}

/**
 * Instala um interceptor no fetch nativo com dois objetivos:
 *  1. Coletar headers de sessão OAI de qualquer requisição ao backend.
 *  2. Capturar a resposta do endpoint /synthesize e redirecionar o áudio
 *     para o player customizado.
 */
export function installFetchInterceptor() {
    const originalFetch = window.fetch;

    window.fetch = async function (resource, options) {
        const url = typeof resource === 'string' ? resource : resource?.url ?? '';

        // 1. Coleta headers de sessão
        if (url.includes('chatgpt.com/backend-api') && options?.headers) {
            const h = options.headers;
            SESSION_HEADER_KEYS.forEach(key => {
                const val = typeof h.get === 'function' ? h.get(key) : h[key];
                if (val) sessionHeaders[key] = val;
            });
        }

        const response = await originalFetch.apply(this, arguments);

        // 2. Captura a resposta de síntese
        if (url.includes('backend-api/synthesize')) {
            logInfo('Resposta de síntese capturada:', url);
            const clone     = response.clone();
            const buffer    = await clone.arrayBuffer();
            const blob      = new Blob([buffer], { type: 'audio/aac' });
            const objectUrl = URL.createObjectURL(blob);
            playWithCustomPlayer(objectUrl);
        }

        return response;
    };

    logInfo('Interceptor de fetch instalado');
}
