// ===========================
// MÓDULO DE INTERFAZ DE USUARIO
// ===========================

import { CONFIG } from './config.js';
import { DOM, Animate, Format, Time } from './utils.js';
import authManager from './auth.js';
import jetskisManager from './jetskis.js';

class UIManager {
    constructor() {
        this.currentView = null;
        this.clockInterval = null;
    }

    // ===========================
    // VISUALIZADOR (PÚBLICO)
    // ===========================
    
    renderVisualizador() {
        const app = DOM.find('#app');
        
        app.innerHTML = `
            <div class="visualizador-container">
                <!-- Header -->
                <div class="header">
                    <div class="header-left">
                        <div class="header-icon">🚤</div>
                        <div class="header-text">Turnero Jetskis Guatapé</div>
                    </div>
                    <div class="header-clock" id="headerClock">--:--:--</div>
                </div>

                <!-- Contenido Principal -->
                <div class="main-container">
                    <div class="category-header">
                        <i class="fas fa-water"></i>
                        JETSKIS EN TURNO
                    </div>
                    <div class="jetski-list" id="jetskiList"></div>
                </div>

                <!-- Reloj Inferior -->
                <div class="bottom-clock">
                    <div class="bottom-date" id="bottomDate">Cargando...</div>
                    <div class="bottom-time" id="bottomTime">--:--:--</div>
                </div>

                <!-- Botón Admin -->
                <button class="admin-access-btn" id="adminAccessBtn">
                    <i class="fas fa-cog"></i>
                </button>
            </div>
        `;

        // Configurar acceso a admin
        const adminBtn = DOM.find('#adminAccessBtn');
        if (adminBtn) {
            adminBtn.addEventListener('click', () => {
                this.renderLoginScreen();
            });
        }

        // Iniciar reloj
        this.startClock();

        // Renderizar jetskis en modo visualizador
        jetskisManager.setMode('visualizador');

        // Habilitar CSS de visualizador
        this.enableStyles('visualizador');

        this.currentView = 'visualizador';
    }

    // ===========================
    // ADMINISTRADOR
    // ===========================
    
    renderAdmin() {
        const app = DOM.find('#app');
        
        app.innerHTML = `
            <div class="admin-container">
                <!-- Header Admin -->
                <div class="header admin-header">
                    <div class="header-left">
                        <div class="header-icon">🚤</div>
                        <div class="header-text">Panel Administrador</div>
                        <span class="role-badge">ADMIN</span>
                    </div>
                    <div class="header-right">
                        <div class="header-clock" id="headerClock">--:--:--</div>
                        <button class="logout-btn" id="logoutBtn">
                            <i class="fas fa-sign-out-alt"></i>
                        </button>
                    </div>
                </div>

                <!-- Controles Admin -->
                <div class="controls">
                    <button class="control-button" id="nextBtn">
                        <i class="fas fa-play"></i>
                        Siguiente en Turno
                    </button>
                    <button class="control-button secondary" id="resetBtn">
                        <i class="fas fa-redo"></i>
                        Resetear Todo
                    </button>
                    <button class="control-button secondary" id="dragModeBtn">
                        <i class="fas fa-hand-pointer"></i>
                        Modo Arrastrar: OFF
                    </button>
                    <button class="control-button secondary" id="viewModeBtn">
                        <i class="fas fa-eye"></i>
                        Ver como Público
                    </button>
                    <span class="info-text">
                        <i class="fas fa-info-circle"></i>
                        Usa los botones ↑↓ o activa el modo arrastrar para reordenar
                    </span>
                </div>

                <!-- Lista de Jetskis -->
                <div class="main-container">
                    <div class="category-header">
                        <i class="fas fa-list"></i>
                        GESTIÓN DE JETSKIS
                    </div>
                    <div class="jetski-list" id="jetskiList"></div>
                </div>

                <!-- Reloj Inferior -->
                <div class="bottom-clock">
                    <div class="bottom-date" id="bottomDate">Cargando...</div>
                    <div class="bottom-time" id="bottomTime">--:--:--</div>
                </div>
            </div>
        `;

        // Configurar botones
        this.setupAdminButtons();

        // Iniciar reloj
        this.startClock();

        // Renderizar jetskis en modo admin
        jetskisManager.setMode('admin');

        // Habilitar CSS de admin
        this.enableStyles('admin');

        this.currentView = 'admin';
    }

    setupAdminButtons() {
        const nextBtn = DOM.find('#nextBtn');
        const resetBtn = DOM.find('#resetBtn');
        const dragModeBtn = DOM.find('#dragModeBtn');
        const viewModeBtn = DOM.find('#viewModeBtn');
        const logoutBtn = DOM.find('#logoutBtn');

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                jetskisManager.setNextEmbarcando();
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.showConfirmModal(
                    '¿Resetear todos los turnos?',
                    'Todos los jetskis volverán a estado "EN TURNO"',
                    () => jetskisManager.resetAll()
                );
            });
        }

        if (dragModeBtn) {
            dragModeBtn.addEventListener('click', () => {
                jetskisManager.toggleDragMode();
            });
        }

        if (viewModeBtn) {
            viewModeBtn.addEventListener('click', () => {
                this.renderVisualizador();
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                const result = await authManager.logout();
                if (result.success) {
                    this.renderVisualizador();
                }
            });
        }
    }

    // ===========================
    // LOGIN
    // ===========================
    
    renderLoginScreen() {
        const app = DOM.find('#app');
        app.innerHTML = authManager.renderLoginForm();
        authManager.setupLoginForm();
        this.enableStyles('visualizador');
    }

    // ===========================
    // RELOJ
    // ===========================
    
    startClock() {
        this.stopClock();
        this.updateClock();
        this.clockInterval = setInterval(() => this.updateClock(), 1000);
    }

    stopClock() {
        if (this.clockInterval) {
            clearInterval(this.clockInterval);
            this.clockInterval = null;
        }
    }

    updateClock() {
        const now = new Date();
        
        const headerClock = DOM.find('#headerClock');
        const bottomDate = DOM.find('#bottomDate');
        const bottomTime = DOM.find('#bottomTime');
        
        const timeString = Format.time(now);
        const dateString = Format.date(now);
        
        if (headerClock) {
            headerClock.textContent = timeString;
        }
        
        if (bottomDate) {
            bottomDate.textContent = dateString;
        }
        
        if (bottomTime) {
            bottomTime.textContent = timeString;
        }
    }

    // ===========================
    // ESTILOS
    // ===========================
    
    enableStyles(mode) {
        const visualizadorStyles = DOM.find('#visualizador-styles');
        const adminStyles = DOM.find('#admin-styles');

        if (mode === 'visualizador') {
            if (visualizadorStyles) visualizadorStyles.disabled = false;
            if (adminStyles) adminStyles.disabled = true;
        } else {
            if (visualizadorStyles) visualizadorStyles.disabled = true;
            if (adminStyles) adminStyles.disabled = false;
        }
    }

    // ===========================
    // MODALES Y ALERTAS
    // ===========================
    
    showConfirmModal(title, message, onConfirm) {
        const modalsContainer = DOM.find('#modals');
        
        const modal = DOM.create('div', 'modal-overlay');
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-title">${title}</div>
                <p>${message}</p>
                <div class="modal-buttons">
                    <button class="btn btn-primary" id="confirmBtn">Confirmar</button>
                    <button class="btn btn-secondary" id="cancelBtn">Cancelar</button>
                </div>
            </div>
        `;
        
        modalsContainer.appendChild(modal);
        
        const confirmBtn = modal.querySelector('#confirmBtn');
        const cancelBtn = modal.querySelector('#cancelBtn');
        
        confirmBtn.addEventListener('click', () => {
            onConfirm();
            this.closeModal(modal);
        });
        
        cancelBtn.addEventListener('click', () => {
            this.closeModal(modal);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modal);
            }
        });
        
        Animate.fadeIn(modal);
    }

    closeModal(modal) {
        Animate.fadeOut(modal);
        setTimeout(() => DOM.remove(modal), 300);
    }

    showSuccess(title, message, duration = 3000) {
        this.showAlert('success', title, message, duration);
    }

    showError(title, message, duration = 5000) {
        this.showAlert('error', title, message, duration);
    }

    showAlert(type, title, message, duration) {
        const alertsContainer = DOM.find('#alerts');
        
        const alert = DOM.create('div', `alert alert-${type}`);
        alert.innerHTML = `
            <div class="alert-icon">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}"></i>
            </div>
            <div class="alert-content">
                <div class="alert-title">${title}</div>
                <div class="alert-message">${message}</div>
            </div>
            <button class="alert-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        alertsContainer.appendChild(alert);
        
        const closeBtn = alert.querySelector('.alert-close');
        closeBtn.addEventListener('click', () => {
            this.closeAlert(alert);
        });
        
        Animate.slideIn(alert, 'right');
        
        setTimeout(() => {
            this.closeAlert(alert);
        }, duration);
    }

    closeAlert(alert) {
        Animate.slideOut(alert, 'right');
        setTimeout(() => DOM.remove(alert), 300);
    }

    // ===========================
    // LIMPIEZA
    // ===========================
    
    cleanup() {
        this.stopClock();
        this.currentView = null;
    }
}

// ===========================
// INSTANCIA GLOBAL
// ===========================
const uiManager = new UIManager();

export default uiManager;

window.UI = uiManager;
