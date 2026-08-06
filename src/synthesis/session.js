/** Headers de sessão capturados das requisições nativas do ChatGPT. */
export const sessionHeaders = {};

const CANONICAL_KEYS = {
    authorization: 'Authorization',
    'oai-language': 'OAI-Language',
    'oai-session-id': 'OAI-Session-Id',
    'oai-device-id': 'OAI-Device-Id',
    'oai-client-build-number': 'OAI-Client-Build-Number',
    'oai-client-version': 'OAI-Client-Version',
    'x-oai-is-client-observation': 'X-OAI-IS-Client-Observation',
};

/** Chaves capturadas de requisições ao backend-api. */
export const CAPTURE_HEADER_KEYS = Object.values(CANONICAL_KEYS);

/**
 * Normaliza um mapa de headers para chaves canônicas.
 * @param {Record<string, string>} headers
 */
export function mergeSessionHeaders(headers) {
    if (!headers) return;

    for (const [rawName, value] of Object.entries(headers)) {
        if (!value) continue;

        const canonical = CANONICAL_KEYS[rawName.toLowerCase()];
        if (canonical) {
            sessionHeaders[canonical] = value;
        }
    }
}

/** @param {string} name - chave canônica, ex.: Authorization */
export function getSessionHeader(name) {
    return sessionHeaders[name] ?? null;
}

/** @returns {string|null} Valor pronto para o header authorization. */
export function getAuthorizationHeader() {
    const auth = getSessionHeader('Authorization');
    if (!auth) return null;
    return auth.startsWith('Bearer ') ? auth : `Bearer ${auth}`;
}
