/**
 * Configurações centrais do script.
 * Edite aqui para alterar comportamento sem precisar mexer na lógica.
 */

export const SCRIPT_NAME    = 'ChatGPT Plus';
export const SCRIPT_VERSION = '0.3.0';

/**
 * Modos de reprodução:
 *  'ui'     – simula cliques na interface nativa do ChatGPT
 *  'player' – requisição direta ao backend + player próprio
 */
export const PLAY_MODE = 'player'; // 'ui' | 'player'

/** Voz usada no modo 'player'. Ex: cove, ember, breeze, juniper */
export const TTS_VOICE = 'cove';
