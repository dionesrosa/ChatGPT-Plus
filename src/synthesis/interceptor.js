import { logInfo, logWarn } from '../core/logger.js';
import { playWithCustomPlayer } from '../player/audio.js';

/**
 * Headers de sessão coletados ao interceptar a requisição /synthesize nativa.
 * O Authorization só aparece nessa requisição — não nas outras chamadas ao backend.
 */
export const sessionHeaders = {};

/** Chaves a capturar da requisição /synthesize */
const SYNTHESIZE_HEADER_KEYS = [
    'Authorization',
    'OAI-Language',
    'OAI-Session-Id',
    'OAI-Device-Id',
    'OAI-Client-Build-Number',
    'OAI-Client-Version',
    'X-OAI-IS-Client-Observation',
];

/**
 * Instala um interceptor no fetch nativo com dois objetivos:
 *  1. Capturar os headers da requisição /synthesize (onde o Authorization aparece)
 *     para uso nas próximas chamadas diretas.
 *  2. Redirecionar o áudio da resposta /synthesize para o player customizado.
 */
export function installFetchInterceptor() {
    const originalFetch = window.fetch;

    window.fetch = async function (resource, options) {
        const url = typeof resource === 'string' ? resource : resource?.url ?? '';

        // Captura headers de sessão de qualquer chamada ao backend que os contenha
        if (url.includes('chatgpt.com/backend-api') && options?.headers) {
            const h = options.headers;
            const normalizedHeaders = typeof h.entries === 'function'
                ? Object.fromEntries([...h.entries()])
                : h;
            const lowerMap = Object.fromEntries(
                Object.entries(normalizedHeaders).map(([k, v]) => [k.toLowerCase(), v])
            );
            SYNTHESIZE_HEADER_KEYS.forEach(key => {
                const val = lowerMap[key.toLowerCase()];
                if (val) sessionHeaders[key] = val;
            });
        }

        const response = await originalFetch.apply(this, arguments);

        // Redireciona o áudio da resposta /synthesize para o player customizado
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
