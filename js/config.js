// ===========================
// CONFIGURACIÓN TURNERO JETSKIS
// ===========================

export const CONFIG = {
    // Estados de jetskis
    ESTADOS: {
        EN_TURNO: 'EN TURNO',
        EMBARCANDO: 'EMBARCANDO'
    },

    // Roles de usuario
    ROLES: {
        ADMIN: 'admin',
        VISUALIZADOR: 'visualizador'
    },

    // Empresas de Jetskis
    EMPRESAS: [
        'Jovi extreme',
        'Aqua sport',
        'Nauticas Guatape',
        'La ola del jetski',
        'Motonáutica',
        'Imperial jet ski',
        'Jet ski tours',
        'Timon',
        'Merak guatape',
        'Yates premium',
        'Servi jet ski',
        'Guatape extremo',
        'Gotravel',
        'Los colores',
        'Travel gold',
        'Esto es guatape',
        'Adventure Guatape',
        'Náuticos recreacion',
        'Jet ski aventura',
        'Casa corona',
        'Plus travel',
        'Dinococo',
        'Embarcar',
        'Jet ski Arai',
        'Diversiones náuticas guatape',
        'Hydro',
        'Zarpe náutico',
        'Acuátic rental'
    ],

    // Configuración de UI
    UI: {
        ANIMATION_DURATION: 300,
        TOAST_DURATION: 5000,
        AUTO_ADVANCE_ENABLED: true,
        AUTO_ADVANCE_DELAY: 30000 // 30 segundos
    },

    // Configuración de Firebase
    FIREBASE: {
        COLLECTIONS: {
            JETSKIS: 'jetskis',
            USERS: 'users',
            HISTORIAL: 'historial_jetskis'
        }
    },

    // Mensajes del sistema
    MESSAGES: {
        LOGIN: {
            SUCCESS: '✅ Sesión iniciada correctamente',
            ERROR: '❌ Error al iniciar sesión',
            INVALID_CREDENTIALS: '🔐 Credenciales inválidas'
        },
        JETSKIS: {
            ESTADO_CHANGED: '🔄 Estado actualizado',
            POSITION_CHANGED: '📍 Posición actualizada',
            ORDEN_CHANGED: '✅ Orden actualizado correctamente',
            SIGUIENTE_SUCCESS: '▶️ Siguiente jetski en turno',
            RESET_SUCCESS: '🔄 Turnos reiniciados'
        },
        VALIDATION: {
            REQUIRED_FIELDS: '⚠️ Complete todos los campos requeridos',
            CONSECUTIVE_ERROR: '⚠️ Solo se puede embarcar de forma consecutiva'
        }
    },

    // Configuración de PWA
    PWA: {
        THEME_COLOR: '#FFD700',
        BACKGROUND_COLOR: '#000000',
        DISPLAY: 'standalone',
        ORIENTATION: 'portrait'
    }
};

// Iconos por estado
export const ESTADO_ICONS = {
    [CONFIG.ESTADOS.EN_TURNO]: 'fas fa-clock',
    [CONFIG.ESTADOS.EMBARCANDO]: 'fas fa-water'
};

// Colores por estado
export const ESTADO_COLORS = {
    [CONFIG.ESTADOS.EN_TURNO]: '#FFD700',
    [CONFIG.ESTADOS.EMBARCANDO]: '#0066ff'
};

// Configuración de dispositivos
export const DEVICE = {
    isMobile: () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    isIOS: () => /iPad|iPhone|iPod/.test(navigator.userAgent),
    isAndroid: () => /Android/.test(navigator.userAgent),
    supportsVibration: () => 'vibrate' in navigator,
    supportsNotifications: () => 'Notification' in window
};

// Exportar configuración global
window.APP_CONFIG = CONFIG;
