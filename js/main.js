// ===========================
// MÓDULO PRINCIPAL - TURNERO JETSKIS
// ===========================

import { CONFIG } from './config.js';
import { Viewport, Haptics } from './utils.js';
import authManager from './auth.js';
import databaseManager from './database.js';
import uiManager from './ui.js';
import jetskisManager from './jetskis.js';

class AppManager {
    constructor() {
        this.isInitialized = false;
        this.currentUser = null;
        this.currentRole = null;
    }

    // ===========================
    // INICIALIZACIÓN
    // ===========================
    
    async init() {
        try {
            console.log('🚀 Iniciando Turnero Jetskis Guatapé...');
            
            // Configurar viewport
            Viewport.init();
            
            // Mostrar visualizador público
            uiManager.renderVisualizador();
            
            // Inicializar Firebase y Auth
            await this.initializeAuth();
            
            // Inicializar jetskis (sin autenticación requerida para visualizar)
            await jetskisManager.init();
            
            // Configurar eventos globales
            this.setupGlobalEvents();
            
            this.isInitialized = true;
            console.log('✅ Aplicación inicializada');
            
        } catch (error) {
            console.error('❌ Error inicializando aplicación:', error);
            this.showError(error);
        }
    }

    // ===========================
    // AUTENTICACIÓN
    // ===========================
    
    async initializeAuth() {
        try {
            await authManager.init();
            
            authManager.onAuthChange((isAuthenticated, user, role) => {
                this.handleAuthChange(isAuthenticated, user, role);
            });
            
        } catch (error) {
            console.error('Error inicializando auth:', error);
        }
    }

    handleAuthChange(isAuthenticated, user, role) {
        this.currentUser = user;
        this.currentRole = role;
        
        if (isAuthenticated && role === CONFIG.ROLES.ADMIN) {
            // Usuario autenticado como admin
            this.onAdminLogin();
        } else {
            // Usuario no autenticado o no es admin
            this.onLogout();
        }
    }

    async onAdminLogin() {
        console.log('👤 Admin autenticado');
        Haptics.success();
        
        // Mostrar panel de administración
        uiManager.renderAdmin();
        
        uiManager.showSuccess(
            '👋 Bienvenido Administrador',
            'Panel de control activado',
            3000
        );
    }

    onLogout() {
        // Volver a mostrar visualizador público
        if (uiManager.currentView !== 'visualizador') {
            uiManager.renderVisualizador();
        }
    }

    // ===========================
    // EVENTOS GLOBALES
    // ===========================
    
    setupGlobalEvents() {
        // ESC para cerrar modales
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modals = document.querySelectorAll('.modal-overlay');
                modals.forEach(modal => uiManager.closeModal(modal));
            }
        });
        
        // Detectar pérdida de conexión
        window.addEventListener('offline', () => {
            uiManager.showError(
                '🌐 Sin Conexión',
                'Verifica tu conexión a internet',
                10000
            );
        });
        
        window.addEventListener('online', () => {
            uiManager.showSuccess(
                '✅ Conectado',
                'Conexión restablecida',
                3000
            );
        });
        
        // Prevenir comportamientos móviles no deseados
        this.preventMobileDefaults();
    }

    preventMobileDefaults() {
        // Prevenir zoom en inputs
        document.addEventListener('touchstart', function() {}, { passive: true });
        
        // Prevenir pull-to-refresh
        document.body.addEventListener('touchstart', (e) => {
            if (e.touches.length !== 1) return;
            
            const startY = e.touches[0].pageY;
            
            if (startY <= 10) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    // ===========================
    // MANEJO DE ERRORES
    // ===========================
    
    showError(error) {
        const app = document.querySelector('#app');
        if (app) {
            app.innerHTML = `
                <div class="error-container">
                    <div class="error-icon">❌</div>
                    <h2>Error de Inicialización</h2>
                    <p>${error.message || 'Error desconocido'}</p>
                    <button onclick="window.location.reload()" class="control-button">
                        <i class="fas fa-refresh"></i>
                        Reintentar
                    </button>
                </div>
            `;
        }
    }

    // ===========================
    // DEBUG
    // ===========================
    
    getDebugInfo() {
        return {
            isInitialized: this.isInitialized,
            currentUser: this.currentUser?.email || null,
            currentRole: this.currentRole,
            jetskisCount: jetskisManager.jetskis.length,
            currentView: uiManager.currentView,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };
    }

    debug() {
        console.table(this.getDebugInfo());
    }
}

// ===========================
// INICIALIZACIÓN AUTOMÁTICA
// ===========================

const app = new AppManager();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app.init();
    });
} else {
    app.init();
}

// ===========================
// EXPORTACIONES GLOBALES
// ===========================

window.App = app;
window.DEBUG = () => app.debug();

export default app;

// Cleanup antes de cerrar
window.addEventListener('beforeunload', () => {
    jetskisManager.cleanup();
    uiManager.cleanup();
});
