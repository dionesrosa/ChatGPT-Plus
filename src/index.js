import { PLAY_MODE, SCRIPT_NAME, SCRIPT_VERSION } from './config/settings.js';
import { logInfo } from './core/logger.js';
import { installFetchInterceptor } from './synthesis/interceptor.js';
import { startMonitoring } from './monitor/generation.js';

if (PLAY_MODE === 'player') {
    installFetchInterceptor();
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    startMonitoring();
} else {
    window.addEventListener('DOMContentLoaded', startMonitoring);
}

logInfo(`Script carregado – modo: ${PLAY_MODE}`);
