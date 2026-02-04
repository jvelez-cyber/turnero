// ===========================
// TURNERO JETSKIS GUATAPÉ
// Aplicación completa con Firebase
// ===========================

import { 
    collection, 
    doc, 
    getDocs, 
    updateDoc,
    onSnapshot,
    writeBatch,
    query,
    orderBy
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

import { 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

// ===========================
// ESTADO DE LA APLICACIÓN
// ===========================

const APP = {
    mode: 'visualizador', // 'visualizador' o 'admin'
    jetskis: [],
    unsubscribe: null,
    clockInterval: null,
    dragMode: false,
    draggedElement: null,
    currentUser: null
};

// ===========================
// INICIALIZACIÓN
// ===========================

async function init() {
    console.log('🚀 Iniciando Turnero Jetskis...');
    
    try {
        // Verificar Firebase
        if (!window.firebaseDB) {
            throw new Error('Firebase no inicializado');
        }
        
        // Escuchar cambios de autenticación
        onAuthStateChanged(window.firebaseAuth, handleAuthChange);
        
        // Renderizar visualizador por defecto
        renderVisualizador();
        
        // Iniciar listener de jetskis
        startRealtimeListener();
        
        // Iniciar reloj
        startClock();
        
        console.log('✅ Turnero inicializado');
        
    } catch (error) {
        console.error('❌ Error inicializando:', error);
        showError('Error de inicialización', error.message);
    }
}

// ===========================
// AUTENTICACIÓN
// ===========================

function handleAuthChange(user) {
    APP.currentUser = user;
    
    if (user) {
        console.log('👤 Usuario autenticado:', user.email);
        // Cambiar a modo admin
        APP.mode = 'admin';
        renderAdmin();
    } else {
        console.log('👤 Usuario no autenticado');
        // Volver a visualizador
        if (APP.mode === 'admin') {
            APP.mode = 'visualizador';
            renderVisualizador();
        }
    }
}

async function login(email, password) {
    try {
        await signInWithEmailAndPassword(window.firebaseAuth, email, password);
        return { success: true };
    } catch (error) {
        console.error('Error en login:', error);
        let message = 'Error al iniciar sesión';
        
        if (error.code === 'auth/invalid-credential') {
            message = 'Email o contraseña incorrectos';
        } else if (error.code === 'auth/too-many-requests') {
            message = 'Demasiados intentos. Intenta más tarde';
        }
        
        return { success: false, message };
    }
}

async function logout() {
    try {
        await signOut(window.firebaseAuth);
        return { success: true };
    } catch (error) {
        console.error('Error en logout:', error);
        return { success: false };
    }
}

// ===========================
// FIREBASE REALTIME LISTENER
// ===========================

function startRealtimeListener() {
    const jetskisRef = collection(window.firebaseDB, 'jetskis');
    const q = query(jetskisRef, orderBy('posicion', 'asc'));
    
    APP.unsubscribe = onSnapshot(q, (snapshot) => {
        APP.jetskis = [];
        
        snapshot.forEach((doc) => {
            APP.jetskis.push({
                firebaseId: doc.id,
                ...doc.data()
            });
        });
        
        console.log(`📊 ${APP.jetskis.length} jetskis cargados`);
        renderJetskis();
    }, (error) => {
        console.error('Error en listener:', error);
        showError('Error de conexión', 'Problemas al cargar los datos');
    });
}

// ===========================
// RENDERIZADO DE VISTAS
// ===========================

function renderVisualizador() {
    const app = document.getElementById('app');
    
    app.innerHTML = `
        <div class="visualizador-container">
            <div class="header">
                <div class="header-left">
                    <div class="header-icon">🚤</div>
                    <div class="header-text">Turnero Jetskis Guatapé</div>
                </div>
                <div class="header-clock" id="headerClock">--:--:--</div>
            </div>

            <div class="main-container">
                <div class="category-header">
                    <i class="fas fa-water"></i>
                    JETSKIS EN TURNO
                </div>
                <div class="jetski-list" id="jetskiList">
                    <div class="no-data">
                        <i class="fas fa-spinner fa-spin"></i>
                        Cargando...
                    </div>
                </div>
            </div>

            <div class="bottom-clock">
                <div class="bottom-date" id="bottomDate">Cargando...</div>
                <div class="bottom-time" id="bottomTime">--:--:--</div>
            </div>

            <button class="admin-access-btn" onclick="window.showLoginScreen()">
                <i class="fas fa-cog"></i>
            </button>
        </div>
    `;
}

function renderAdmin() {
    const app = document.getElementById('app');
    
    app.innerHTML = `
        <div class="admin-container">
            <div class="header">
                <div class="header-left">
                    <div class="header-icon">🚤</div>
                    <div class="header-text">Panel Administrador</div>
                    <span class="role-badge">ADMIN</span>
                </div>
                <div class="header-right">
                    <div class="header-clock" id="headerClock">--:--:--</div>
                    <button class="logout-btn" onclick="window.handleLogout()">
                        <i class="fas fa-sign-out-alt"></i>
                    </button>
                </div>
            </div>

            <div class="controls">
                <button class="control-button" onclick="window.setNextEmbarcando()">
                    <i class="fas fa-play"></i>
                    Siguiente en Turno
                </button>
                <button class="control-button secondary" onclick="window.resetAll()">
                    <i class="fas fa-redo"></i>
                    Resetear Todo
                </button>
                <button class="control-button secondary" id="dragModeBtn" onclick="window.toggleDragMode()">
                    <i class="fas fa-hand-pointer"></i>
                    Modo Arrastrar: OFF
                </button>
                <button class="control-button secondary" onclick="window.switchToVisualizador()">
                    <i class="fas fa-eye"></i>
                    Ver como Público
                </button>
                <span class="info-text">
                    <i class="fas fa-info-circle"></i>
                    Usa los botones ↑↓ o modo arrastrar para reordenar
                </span>
            </div>

            <div class="main-container">
                <div class="category-header">
                    <i class="fas fa-list"></i>
                    GESTIÓN DE JETSKIS
                </div>
                <div class="jetski-list" id="jetskiList">
                    <div class="no-data">
                        <i class="fas fa-spinner fa-spin"></i>
                        Cargando...
                    </div>
                </div>
            </div>

            <div class="bottom-clock">
                <div class="bottom-date" id="bottomDate">Cargando...</div>
                <div class="bottom-time" id="bottomTime">--:--:--</div>
            </div>
        </div>
    `;
}

function renderLoginScreen() {
    const app = document.getElementById('app');
    
    app.innerHTML = `
        <div class="login-container">
            <form class="login-form" id="loginForm">
                <div class="login-header">
                    <h2>🔐 Acceso Administrador</h2>
                    <p>Ingresa tus credenciales</p>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Email</label>
                    <input 
                        type="email" 
                        class="form-input" 
                        id="loginEmail" 
                        placeholder="admin@guatape.com"
                        required
                    >
                </div>
                
                <div class="form-group">
                    <label class="form-label">Contraseña</label>
                    <input 
                        type="password" 
                        class="form-input" 
                        id="loginPassword" 
                        placeholder="••••••••"
                        required
                    >
                </div>
                
                <button type="submit" class="login-submit" id="loginBtn">
                    <i class="fas fa-sign-in-alt"></i>
                    Iniciar Sesión
                </button>
                
                <div class="login-error" id="loginError"></div>
                
                <button type="button" class="btn-secondary" style="width: 100%; margin-top: 15px;" onclick="window.cancelLogin()">
                    <i class="fas fa-arrow-left"></i>
                    Volver
                </button>
            </form>
        </div>
    `;
    
    // Setup form
    const form = document.getElementById('loginForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const btn = document.getElementById('loginBtn');
        const errorDiv = document.getElementById('loginError');
        
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
        errorDiv.classList.remove('active');
        
        const result = await login(email, password);
        
        if (!result.success) {
            errorDiv.textContent = result.message;
            errorDiv.classList.add('active');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Iniciar Sesión';
        }
    });
}

// ===========================
// RENDERIZADO DE JETSKIS
// ===========================

function renderJetskis() {
    const container = document.getElementById('jetskiList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (APP.jetskis.length === 0) {
        container.innerHTML = '<div class="no-data"><i class="fas fa-exclamation-circle"></i><br>No hay jetskis configurados</div>';
        return;
    }
    
    APP.jetskis.forEach((jetski, index) => {
        const row = createJetskiRow(jetski, index);
        container.appendChild(row);
    });
}

function createJetskiRow(jetski, index) {
    const row = document.createElement('div');
    row.className = 'jetski-row';
    row.setAttribute('data-id', jetski.firebaseId);
    
    if (jetski.estado === 'EMBARCANDO') {
        row.classList.add('embarcando');
    }
    
    if (APP.mode === 'visualizador') {
        row.innerHTML = `
            <div class="jetski-number">${index + 1}</div>
            <div class="jetski-name">${jetski.nombre}</div>
            <div class="jetski-status status-${jetski.estado.toLowerCase().replace(' ', '-')}">
                ${jetski.estado}
            </div>
        `;
    } else {
        row.innerHTML = `
            ${APP.dragMode ? '<span class="drag-handle">☰</span>' : ''}
            <div class="jetski-number">${index + 1}</div>
            <div class="jetski-name">${jetski.nombre}</div>
            <div class="jetski-status status-${jetski.estado.toLowerCase().replace(' ', '-')}">
                ${jetski.estado}
            </div>
            <div class="jetski-controls">
                <button class="move-button" onclick="window.moveUp(${index})" ${index === 0 ? 'disabled' : ''}>
                    ↑
                </button>
                <button class="move-button" onclick="window.moveDown(${index})" ${index === APP.jetskis.length - 1 ? 'disabled' : ''}>
                    ↓
                </button>
                <button class="move-button toggle-status" onclick="window.toggleEstado('${jetski.firebaseId}')">
                    ${jetski.estado === 'EN TURNO' ? 'Embarcar' : 'En Turno'}
                </button>
            </div>
        `;
        
        if (APP.dragMode) {
            setupDragAndDrop(row);
        }
    }
    
    return row;
}

// ===========================
// ACCIONES DE ADMIN
// ===========================

async function moveUp(index) {
    if (index <= 0) return;
    
    const batch = writeBatch(window.firebaseDB);
    
    const jetski1 = APP.jetskis[index];
    const jetski2 = APP.jetskis[index - 1];
    
    batch.update(doc(window.firebaseDB, 'jetskis', jetski1.firebaseId), {
        posicion: jetski2.posicion
    });
    
    batch.update(doc(window.firebaseDB, 'jetskis', jetski2.firebaseId), {
        posicion: jetski1.posicion
    });
    
    try {
        await batch.commit();
        console.log('✅ Posiciones actualizadas');
    } catch (error) {
        console.error('Error:', error);
        showError('Error', 'No se pudo actualizar');
    }
}

async function moveDown(index) {
    if (index >= APP.jetskis.length - 1) return;
    
    const batch = writeBatch(window.firebaseDB);
    
    const jetski1 = APP.jetskis[index];
    const jetski2 = APP.jetskis[index + 1];
    
    batch.update(doc(window.firebaseDB, 'jetskis', jetski1.firebaseId), {
        posicion: jetski2.posicion
    });
    
    batch.update(doc(window.firebaseDB, 'jetskis', jetski2.firebaseId), {
        posicion: jetski1.posicion
    });
    
    try {
        await batch.commit();
        console.log('✅ Posiciones actualizadas');
    } catch (error) {
        console.error('Error:', error);
        showError('Error', 'No se pudo actualizar');
    }
}

async function toggleEstado(firebaseId) {
    const jetski = APP.jetskis.find(j => j.firebaseId === firebaseId);
    if (!jetski) return;
    
    const nuevoEstado = jetski.estado === 'EN TURNO' ? 'EMBARCANDO' : 'EN TURNO';
    
    try {
        await updateDoc(doc(window.firebaseDB, 'jetskis', firebaseId), {
            estado: nuevoEstado,
            fechaActualizacion: new Date()
        });
        
        showSuccess('Estado actualizado', `${jetski.nombre} → ${nuevoEstado}`);
    } catch (error) {
        console.error('Error:', error);
        showError('Error', 'No se pudo cambiar el estado');
    }
}

async function setNextEmbarcando() {
    const batch = writeBatch(window.firebaseDB);
    
    // Poner todos EN TURNO
    APP.jetskis.forEach(jetski => {
        batch.update(doc(window.firebaseDB, 'jetskis', jetski.firebaseId), {
            estado: 'EN TURNO'
        });
    });
    
    // El primero EMBARCANDO
    const nextJetski = APP.jetskis.find(j => j.estado === 'EN TURNO') || APP.jetskis[0];
    if (nextJetski) {
        batch.update(doc(window.firebaseDB, 'jetskis', nextJetski.firebaseId), {
            estado: 'EMBARCANDO',
            fechaActualizacion: new Date()
        });
    }
    
    try {
        await batch.commit();
        showSuccess('✅ Siguiente en turno', nextJetski.nombre);
        
        // Scroll al jetski embarcando
        setTimeout(() => {
            const row = document.querySelector('.jetski-row.embarcando');
            if (row) {
                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 300);
    } catch (error) {
        console.error('Error:', error);
        showError('Error', 'No se pudo avanzar');
    }
}

async function resetAll() {
    showConfirmModal(
        '¿Resetear todos los turnos?',
        'Todos los jetskis volverán a "EN TURNO"',
        async () => {
            const batch = writeBatch(window.firebaseDB);
            
            APP.jetskis.forEach(jetski => {
                batch.update(doc(window.firebaseDB, 'jetskis', jetski.firebaseId), {
                    estado: 'EN TURNO',
                    fechaActualizacion: new Date()
                });
            });
            
            try {
                await batch.commit();
                showSuccess('✅ Reiniciado', `${APP.jetskis.length} jetskis en turno`);
            } catch (error) {
                console.error('Error:', error);
                showError('Error', 'No se pudo reiniciar');
            }
        }
    );
}

// ===========================
// DRAG & DROP
// ===========================

function toggleDragMode() {
    APP.dragMode = !APP.dragMode;
    const btn = document.getElementById('dragModeBtn');
    if (btn) {
        btn.innerHTML = APP.dragMode 
            ? '<i class="fas fa-hand-rock"></i> Modo Arrastrar: ON'
            : '<i class="fas fa-hand-pointer"></i> Modo Arrastrar: OFF';
    }
    renderJetskis();
}

function setupDragAndDrop(row) {
    row.setAttribute('draggable', 'true');
    
    row.addEventListener('dragstart', (e) => {
        APP.draggedElement = row;
        row.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    });
    
    row.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (row !== APP.draggedElement) {
            row.classList.add('drag-over');
        }
    });
    
    row.addEventListener('dragleave', () => {
        row.classList.remove('drag-over');
    });
    
    row.addEventListener('drop', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (APP.draggedElement !== row) {
            await handleDrop(APP.draggedElement, row);
        }
        
        row.classList.remove('drag-over');
    });
    
    row.addEventListener('dragend', () => {
        row.classList.remove('dragging');
        document.querySelectorAll('.jetski-row').forEach(r => r.classList.remove('drag-over'));
    });
}

async function handleDrop(draggedRow, targetRow) {
    const draggedId = draggedRow.getAttribute('data-id');
    const targetId = targetRow.getAttribute('data-id');
    
    const draggedIndex = APP.jetskis.findIndex(j => j.firebaseId === draggedId);
    const targetIndex = APP.jetskis.findIndex(j => j.firebaseId === targetId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    // Reordenar localmente
    const [removed] = APP.jetskis.splice(draggedIndex, 1);
    APP.jetskis.splice(targetIndex, 0, removed);
    
    // Actualizar todas las posiciones
    const batch = writeBatch(window.firebaseDB);
    
    APP.jetskis.forEach((jetski, index) => {
        batch.update(doc(window.firebaseDB, 'jetskis', jetski.firebaseId), {
            posicion: index + 1
        });
    });
    
    try {
        await batch.commit();
        console.log('✅ Orden actualizado');
    } catch (error) {
        console.error('Error:', error);
        showError('Error', 'No se pudo reordenar');
    }
}

// ===========================
// RELOJ
// ===========================

function startClock() {
    updateClock();
    APP.clockInterval = setInterval(updateClock, 1000);
}

function updateClock() {
    const now = new Date();
    const time = now.toLocaleTimeString('es-CO', { hour12: false });
    const date = now.toLocaleDateString('es-CO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const headerClock = document.getElementById('headerClock');
    const bottomDate = document.getElementById('bottomDate');
    const bottomTime = document.getElementById('bottomTime');
    
    if (headerClock) headerClock.textContent = time;
    if (bottomDate) bottomDate.textContent = date.charAt(0).toUpperCase() + date.slice(1);
    if (bottomTime) bottomTime.textContent = time;
}

// ===========================
// MODALES Y ALERTAS
// ===========================

function showConfirmModal(title, message, onConfirm) {
    const modalsContainer = document.getElementById('modals');
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
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
    
    modal.querySelector('#confirmBtn').onclick = () => {
        onConfirm();
        closeModal(modal);
    };
    
    modal.querySelector('#cancelBtn').onclick = () => {
        closeModal(modal);
    };
    
    modal.onclick = (e) => {
        if (e.target === modal) closeModal(modal);
    };
}

function closeModal(modal) {
    modal.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => modal.remove(), 300);
}

function showSuccess(title, message) {
    showAlert('success', title, message, 3000);
}

function showError(title, message) {
    showAlert('error', title, message, 5000);
}

function showAlert(type, title, message, duration) {
    const alertsContainer = document.getElementById('alerts');
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
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
    
    alert.querySelector('.alert-close').onclick = () => {
        closeAlert(alert);
    };
    
    setTimeout(() => closeAlert(alert), duration);
}

function closeAlert(alert) {
    alert.style.animation = 'slideInRight 0.3s ease reverse';
    setTimeout(() => alert.remove(), 300);
}

// ===========================
// FUNCIONES GLOBALES
// ===========================

window.showLoginScreen = renderLoginScreen;
window.cancelLogin = () => {
    APP.mode = 'visualizador';
    renderVisualizador();
};
window.switchToVisualizador = () => {
    APP.mode = 'visualizador';
    renderVisualizador();
};
window.handleLogout = async () => {
    const result = await logout();
    if (result.success) {
        APP.mode = 'visualizador';
        renderVisualizador();
    }
};
window.moveUp = moveUp;
window.moveDown = moveDown;
window.toggleEstado = toggleEstado;
window.setNextEmbarcando = setNextEmbarcando;
window.resetAll = resetAll;
window.toggleDragMode = toggleDragMode;

// ===========================
// INICIAR APP
// ===========================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
