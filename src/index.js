import { PLAY_MODE, SCRIPT_NAME, SCRIPT_VERSION } from './config/settings.js';
import { logInfo } from './core/logger.js';
import { installFetchInterceptor } from './synthesis/interceptor.js';
import { startMonitoring } from './monitor/generation.js';

if (PLAY_MODE === 'player') {
    installFetchInterceptor();
}

function boot() {
    startMonitoring();
    logInfo(`Script carregado – modo: ${PLAY_MODE}`);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
    boot();
}
