// ===========================
// MÓDULO DE GESTIÓN DE JETSKIS
// ===========================

import { CONFIG } from './config.js';
import { Haptics, DOM } from './utils.js';
import databaseManager from './database.js';
import uiManager from './ui.js';

class JetskisManager {
    constructor() {
        this.jetskis = [];
        this.currentMode = 'visualizador'; // 'visualizador' o 'admin'
        this.unsubscribe = null;
        this.draggedElement = null;
        this.dragMode = false;
    }

    // ===========================
    // INICIALIZACIÓN
    // ===========================
    
    async init() {
        try {
            console.log('🚤 Inicializando gestor de jetskis...');
            
            // Verificar si existen jetskis, si no, inicializarlos
            await this.ensureJetskisExist();
            
            // Escuchar cambios en tiempo real
            this.startRealtimeListener();
            
            console.log('✅ Gestor de jetskis inicializado');
            
        } catch (error) {
            console.error('❌ Error inicializando jetskis:', error);
            throw error;
        }
    }

    async ensureJetskisExist() {
        const jetskis = await databaseManager.getJetskis();
        
        if (jetskis.length === 0) {
            console.log('📝 Inicializando jetskis por primera vez...');
            const result = await databaseManager.initializeJetskis();
            
            if (result.success) {
                console.log('✅ Jetskis inicializados:', result.message);
            } else {
                throw new Error('No se pudieron inicializar los jetskis');
            }
        }
    }

    startRealtimeListener() {
        this.unsubscribe = databaseManager.listenToJetskis((jetskis, error) => {
            if (error) {
                console.error('Error en listener:', error);
                uiManager.showError('Error de Conexión', 'Problemas conectando con el servidor');
                return;
            }
            
            this.jetskis = jetskis;
            this.renderJetskis();
        });
    }

    // ===========================
    // RENDERIZADO
    // ===========================
    
    renderJetskis() {
        const container = DOM.find('#jetskiList');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!this.jetskis || this.jetskis.length === 0) {
            container.innerHTML = '<div class="no-data">No hay jetskis configurados</div>';
            return;
        }
        
        this.jetskis.forEach((jetski, index) => {
            const row = this.createJetskiRow(jetski, index);
            container.appendChild(row);
        });
    }

    createJetskiRow(jetski, index) {
        const row = DOM.create('div', 'jetski-row');
        row.setAttribute('data-id', jetski.firebaseId);
        
        // Clase especial si está embarcando
        if (jetski.estado === CONFIG.ESTADOS.EMBARCANDO) {
            row.classList.add('embarcando');
        }
        
        // Contenido diferente según el modo
        if (this.currentMode === 'visualizador') {
            row.innerHTML = this.getVisualizadorRowHTML(jetski, index);
        } else {
            row.innerHTML = this.getAdminRowHTML(jetski, index);
            this.attachAdminEventListeners(row, jetski, index);
            
            // Configurar drag & drop si está activo
            if (this.dragMode) {
                this.setupDragAndDrop(row);
            }
        }
        
        return row;
    }

    getVisualizadorRowHTML(jetski, index) {
        return `
            <div class="jetski-number">${(index + 1).toString().padStart(2, '0')}</div>
            <div class="jetski-name">${jetski.nombre}</div>
            <div class="jetski-status ${this.getStatusClass(jetski.estado)}">
                ${jetski.estado}
            </div>
        `;
    }

    getAdminRowHTML(jetski, index) {
        return `
            ${this.dragMode ? '<span class="drag-handle">☰</span>' : ''}
            <div class="jetski-number">${(index + 1).toString().padStart(2, '0')}</div>
            <div class="jetski-name">${jetski.nombre}</div>
            <div class="jetski-status ${this.getStatusClass(jetski.estado)}">
                ${jetski.estado}
            </div>
            <div class="jetski-controls">
                <button class="move-button" data-action="up" ${index === 0 ? 'disabled' : ''}>
                    ↑
                </button>
                <button class="move-button" data-action="down" ${index === this.jetskis.length - 1 ? 'disabled' : ''}>
                    ↓
                </button>
                <button class="move-button toggle-status" data-action="toggle" style="min-width: 90px;">
                    ${jetski.estado === CONFIG.ESTADOS.EN_TURNO ? 'Embarcar' : 'En Turno'}
                </button>
            </div>
        `;
    }

    attachAdminEventListeners(row, jetski, index) {
        // Botón subir
        const upBtn = row.querySelector('[data-action="up"]');
        if (upBtn) {
            upBtn.addEventListener('click', () => this.moveUp(index));
        }
        
        // Botón bajar
        const downBtn = row.querySelector('[data-action="down"]');
        if (downBtn) {
            downBtn.addEventListener('click', () => this.moveDown(index));
        }
        
        // Botón toggle estado
        const toggleBtn = row.querySelector('[data-action="toggle"]');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleEstado(jetski.firebaseId));
        }
    }

    getStatusClass(estado) {
        return estado === CONFIG.ESTADOS.EMBARCANDO ? 'status-embarcando' : 'status-en-turno';
    }

    // ===========================
    // ACCIONES DEL ADMINISTRADOR
    // ===========================
    
    async moveUp(index) {
        if (index <= 0) return;
        
        Haptics.light();
        
        const updates = [
            {
                firebaseId: this.jetskis[index].firebaseId,
                data: { posicion: this.jetskis[index - 1].posicion }
            },
            {
                firebaseId: this.jetskis[index - 1].firebaseId,
                data: { posicion: this.jetskis[index].posicion }
            }
        ];
        
        const result = await databaseManager.updateMultipleJetskis(updates);
        
        if (result.success) {
            Haptics.success();
            await databaseManager.addHistorial('reorden', {
                jetski: this.jetskis[index].nombre,
                accion: 'subir'
            });
        } else {
            Haptics.error();
            uiManager.showError('Error', 'No se pudo actualizar la posición');
        }
    }

    async moveDown(index) {
        if (index >= this.jetskis.length - 1) return;
        
        Haptics.light();
        
        const updates = [
            {
                firebaseId: this.jetskis[index].firebaseId,
                data: { posicion: this.jetskis[index + 1].posicion }
            },
            {
                firebaseId: this.jetskis[index + 1].firebaseId,
                data: { posicion: this.jetskis[index].posicion }
            }
        ];
        
        const result = await databaseManager.updateMultipleJetskis(updates);
        
        if (result.success) {
            Haptics.success();
            await databaseManager.addHistorial('reorden', {
                jetski: this.jetskis[index].nombre,
                accion: 'bajar'
            });
        } else {
            Haptics.error();
            uiManager.showError('Error', 'No se pudo actualizar la posición');
        }
    }

    async toggleEstado(jetskiId) {
        Haptics.medium();
        
        const jetski = this.jetskis.find(j => j.firebaseId === jetskiId);
        if (!jetski) return;
        
        const nuevoEstado = jetski.estado === CONFIG.ESTADOS.EN_TURNO 
            ? CONFIG.ESTADOS.EMBARCANDO 
            : CONFIG.ESTADOS.EN_TURNO;
        
        const result = await databaseManager.updateJetskiEstado(jetskiId, nuevoEstado);
        
        if (result.success) {
            Haptics.success();
            uiManager.showSuccess(
                CONFIG.MESSAGES.JETSKIS.ESTADO_CHANGED,
                `${jetski.nombre} → ${nuevoEstado}`,
                2000
            );
            
            await databaseManager.addHistorial('cambio_estado', {
                jetski: jetski.nombre,
                estado_anterior: jetski.estado,
                estado_nuevo: nuevoEstado
            });
        } else {
            Haptics.error();
            uiManager.showError('Error', 'No se pudo cambiar el estado');
        }
    }

    async setNextEmbarcando() {
        Haptics.medium();
        
        const result = await databaseManager.setNextEmbarcando();
        
        if (result.success) {
            Haptics.success();
            uiManager.showSuccess(
                CONFIG.MESSAGES.JETSKIS.SIGUIENTE_SUCCESS,
                result.nextJetski || 'Actualizado',
                2000
            );
            
            await databaseManager.addHistorial('siguiente_turno', {
                jetski: result.nextJetski
            });
            
            // Scroll al jetski embarcando
            setTimeout(() => {
                const embarcandoRow = DOM.find('.jetski-row.embarcando');
                if (embarcandoRow) {
                    embarcandoRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 300);
        } else {
            Haptics.error();
            uiManager.showError('Error', 'No se pudo avanzar el turno');
        }
    }

    async resetAll() {
        Haptics.medium();
        
        const result = await databaseManager.resetAllToEnTurno();
        
        if (result.success) {
            Haptics.success();
            uiManager.showSuccess(
                CONFIG.MESSAGES.JETSKIS.RESET_SUCCESS,
                `${result.updatedCount} jetskis reiniciados`,
                2000
            );
            
            await databaseManager.addHistorial('reset', {
                cantidad: result.updatedCount
            });
        } else {
            Haptics.error();
            uiManager.showError('Error', 'No se pudo reiniciar');
        }
    }

    // ===========================
    // DRAG & DROP
    // ===========================
    
    toggleDragMode() {
        this.dragMode = !this.dragMode;
        Haptics.light();
        this.renderJetskis();
        
        const btn = DOM.find('#dragModeBtn');
        if (btn) {
            btn.innerHTML = this.dragMode 
                ? '<i class="fas fa-hand-rock"></i> Modo Arrastrar: ON'
                : '<i class="fas fa-hand-pointer"></i> Modo Arrastrar: OFF';
        }
    }

    setupDragAndDrop(row) {
        row.setAttribute('draggable', 'true');
        
        row.addEventListener('dragstart', (e) => {
            this.draggedElement = row;
            row.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });
        
        row.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            if (row !== this.draggedElement) {
                row.classList.add('drag-over');
            }
        });
        
        row.addEventListener('dragleave', () => {
            row.classList.remove('drag-over');
        });
        
        row.addEventListener('drop', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (this.draggedElement !== row) {
                await this.handleDrop(this.draggedElement, row);
            }
            
            row.classList.remove('drag-over');
        });
        
        row.addEventListener('dragend', () => {
            row.classList.remove('dragging');
            DOM.findAll('.jetski-row').forEach(r => r.classList.remove('drag-over'));
        });
    }

    async handleDrop(draggedRow, targetRow) {
        const draggedId = draggedRow.getAttribute('data-id');
        const targetId = targetRow.getAttribute('data-id');
        
        const draggedIndex = this.jetskis.findIndex(j => j.firebaseId === draggedId);
        const targetIndex = this.jetskis.findIndex(j => j.firebaseId === targetId);
        
        if (draggedIndex === -1 || targetIndex === -1) return;
        
        Haptics.medium();
        
        // Reordenar localmente
        const [removed] = this.jetskis.splice(draggedIndex, 1);
        this.jetskis.splice(targetIndex, 0, removed);
        
        // Actualizar posiciones en Firebase
        const updates = this.jetskis.map((jetski, index) => ({
            firebaseId: jetski.firebaseId,
            data: { posicion: index + 1 }
        }));
        
        const result = await databaseManager.updateMultipleJetskis(updates);
        
        if (result.success) {
            Haptics.success();
            await databaseManager.addHistorial('reorden_drag', {
                jetski: removed.nombre,
                posicion_anterior: draggedIndex + 1,
                posicion_nueva: targetIndex + 1
            });
        } else {
            Haptics.error();
            uiManager.showError('Error', 'No se pudo reordenar');
        }
    }

    // ===========================
    // CAMBIO DE MODO
    // ===========================
    
    setMode(mode) {
        this.currentMode = mode;
        this.dragMode = false;
        this.renderJetskis();
    }

    // ===========================
    // LIMPIEZA
    // ===========================
    
    cleanup() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
        this.jetskis = [];
    }
}

// ===========================
// INSTANCIA GLOBAL
// ===========================
const jetskisManager = new JetskisManager();

export default jetskisManager;

window.Jetskis = jetskisManager;
