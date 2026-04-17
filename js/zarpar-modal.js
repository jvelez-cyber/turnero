// ===========================
// MODAL DE ZARPAR CON DATOS DE VENTA
// ===========================

export function showZarparModal(jetski, onConfirm) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'zarparModal';
    
    modal.innerHTML = `
        <div class="modal-content modal-zarpar">
            <div class="modal-header">
                <div class="modal-icon">🚤</div>
                <h2 class="modal-title">Zarpar Jetski</h2>
                <p class="modal-subtitle">${jetski.nombre}</p>
            </div>
            
            <form id="zarparForm" class="zarpar-form">
                <!-- Precio -->
                <div class="form-group">
                    <label class="form-label">
                        <i class="fas fa-dollar-sign"></i>
                        Precio de Venta *
                    </label>
                    <div class="input-with-prefix">
                        <span class="input-prefix">$</span>
                        <input 
                            type="number" 
                            id="precioVenta" 
                            class="form-input"
                            placeholder="80000"
                            min="1000"
                            step="1000"
                            required
                        >
                    </div>
                </div>

                <!-- Número de Personas -->
                <div class="form-group">
                    <label class="form-label">
                        <i class="fas fa-users"></i>
                        Número de Personas *
                    </label>
                    <input
                        type="number"
                        id="numPersonas"
                        class="form-input"
                        placeholder="2"
                        min="1"
                        max="10"
                        required
                    >
                </div>

                <!-- Cantidad de Motos -->
                <div class="form-group">
                    <label class="form-label">
                        <i class="fas fa-motorcycle"></i>
                        Cantidad de Motos *
                    </label>
                    <input
                        type="number"
                        id="cantidadMotos"
                        class="form-input"
                        placeholder="1"
                        min="1"
                        max="10"
                        value="1"
                        required
                    >
                </div>

                <!-- Cilindraje por Moto (dinámico) -->
                <div id="cilindrajes-container">
                    <div class="form-group">
                        <label class="form-label">
                            <i class="fas fa-tachometer-alt"></i>
                            Cilindraje — Moto 1 *
                        </label>
                        <div class="input-with-suffix">
                            <input
                                type="number"
                                id="cilindraje_0"
                                class="form-input"
                                placeholder="Ej: 1000"
                                min="50"
                                required
                            >
                            <span class="input-suffix">cc</span>
                        </div>
                    </div>
                </div>

                <!-- Horas de Alquiler -->
                <div class="form-group">
                    <label class="form-label">
                        <i class="fas fa-clock"></i>
                        Horas de Alquiler *
                    </label>
                    <select id="horasAlquiler" class="form-input" required>
                        <option value="">Seleccionar...</option>
                        <option value="0.5">30 minutos</option>
                        <option value="1">1 hora</option>
                        <option value="1.5">1 hora 30 min</option>
                        <option value="2">2 horas</option>
                        <option value="2.5">2 horas 30 min</option>
                        <option value="3">3 horas</option>
                        <option value="4">4 horas</option>
                        <option value="5">5 horas</option>
                        <option value="6">6 horas</option>
                        <option value="8">Todo el día (8h)</option>
                    </select>
                </div>

                <!-- Vendedor/Entrador -->
                <div class="form-group">
                    <label class="form-label">
                        <i class="fas fa-user-tie"></i>
                        Vendedor/Entrador *
                    </label>
                    <input 
                        type="text" 
                        id="vendedor" 
                        class="form-input"
                        placeholder="Nombre del vendedor"
                        maxlength="50"
                        required
                    >
                </div>

                <!-- Observaciones (opcional) -->
                <div class="form-group">
                    <label class="form-label">
                        <i class="fas fa-comment"></i>
                        Observaciones (opcional)
                    </label>
                    <textarea 
                        id="observaciones" 
                        class="form-input form-textarea"
                        placeholder="Notas adicionales..."
                        maxlength="200"
                        rows="3"
                    ></textarea>
                </div>

                <!-- Resumen -->
                <div class="venta-resumen">
                    <div class="resumen-row">
                        <span>Jetski:</span>
                        <strong>${jetski.nombre}</strong>
                    </div>
                    <div class="resumen-row">
                        <span>Posición:</span>
                        <strong>#${jetski.posicion}</strong>
                    </div>
                </div>

                <!-- Botones -->
                <div class="modal-buttons">
                    <button type="button" class="btn btn-secondary" id="cancelarBtn">
                        <i class="fas fa-times"></i>
                        Cancelar
                    </button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-ship"></i>
                        Confirmar Zarpar
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Focus en el primer input
    setTimeout(() => {
        document.getElementById('precioVenta').focus();
    }, 100);

    // Función para renderizar los selects de cilindraje según la cantidad
    function renderCilindrajes(cantidad) {
        const container = document.getElementById('cilindrajes-container');
        container.innerHTML = '';
        for (let i = 0; i < cantidad; i++) {
            container.innerHTML += `
                <div class="form-group">
                    <label class="form-label">
                        <i class="fas fa-tachometer-alt"></i>
                        Cilindraje — Moto ${i + 1} *
                    </label>
                    <div class="input-with-suffix">
                        <input
                            type="number"
                            id="cilindraje_${i}"
                            class="form-input"
                            placeholder="Ej: 1000"
                            min="50"
                            required
                        >
                        <span class="input-suffix">cc</span>
                    </div>
                </div>
            `;
        }
    }

    // Listener para actualizar cilindrajes cuando cambia la cantidad
    document.getElementById('cantidadMotos').addEventListener('input', (e) => {
        const cantidad = Math.min(Math.max(parseInt(e.target.value) || 1, 1), 10);
        renderCilindrajes(cantidad);
    });

    // Event Listeners
    const form = document.getElementById('zarparForm');
    const cancelarBtn = document.getElementById('cancelarBtn');
    
    // Cancelar
    cancelarBtn.addEventListener('click', () => {
        closeZarparModal();
    });
    
    // Click fuera del modal
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeZarparModal();
        }
    });
    
    // ESC para cerrar
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            closeZarparModal();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
    
    // Submit del formulario
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const cantidadMotos = parseInt(document.getElementById('cantidadMotos').value) || 1;
        const cilindrajes = [];
        for (let i = 0; i < cantidadMotos; i++) {
            const sel = document.getElementById(`cilindraje_${i}`);
            cilindrajes.push(sel ? parseInt(sel.value) || 0 : 0);
        }

        const ventaData = {
            jetskiId: jetski.firebaseId,
            jetskiNombre: jetski.nombre,
            precioVenta: parseFloat(document.getElementById('precioVenta').value),
            numPersonas: parseInt(document.getElementById('numPersonas').value),
            horasAlquiler: parseFloat(document.getElementById('horasAlquiler').value),
            vendedor: document.getElementById('vendedor').value.trim(),
            observaciones: document.getElementById('observaciones').value.trim(),
            cantidadMotos: cantidadMotos,
            cilindrajes: cilindrajes,
            fechaVenta: new Date(),
            timestamp: Date.now()
        };

        // Validaciones
        if (ventaData.precioVenta < 1000) {
            alert('El precio debe ser mayor a $1,000');
            return;
        }

        if (ventaData.numPersonas < 1 || ventaData.numPersonas > 10) {
            alert('El número de personas debe estar entre 1 y 10');
            return;
        }

        if (!ventaData.vendedor || ventaData.vendedor.length < 3) {
            alert('Ingrese el nombre del vendedor (mínimo 3 caracteres)');
            return;
        }

        if (cilindrajes.some(c => !c)) {
            alert('Selecciona el cilindraje de cada moto');
            return;
        }
        
        closeZarparModal();
        
        // Callback con los datos
        if (onConfirm) {
            onConfirm(ventaData);
        }
    });
}

export function closeZarparModal() {
    const modal = document.getElementById('zarparModal');
    if (modal) {
        modal.classList.add('fade-out');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

// ===========================
// ESTILOS DEL MODAL ZARPAR
// ===========================

export const zarparModalStyles = `
/* Modal Zarpar */
.modal-zarpar {
    max-width: 500px;
    width: 95%;
    max-height: 90vh;
    overflow-y: auto;
}

.modal-header {
    text-align: center;
    margin-bottom: 25px;
}

.modal-icon {
    font-size: 48px;
    margin-bottom: 10px;
}

.modal-subtitle {
    color: #FFD700;
    font-size: 18px;
    font-weight: 600;
    margin-top: 5px;
}

.zarpar-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.form-label {
    color: #FFD700;
    font-size: 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
}

.form-input {
    background: rgba(0, 0, 0, 0.5);
    border: 2px solid #555;
    border-radius: 5px;
    color: #fff;
    padding: 12px;
    font-size: 16px;
    transition: all 0.3s ease;
}

.form-input:focus {
    outline: none;
    border-color: #FFD700;
    background: rgba(0, 0, 0, 0.7);
}

.form-input::placeholder {
    color: #999;
}

.form-textarea {
    resize: vertical;
    min-height: 60px;
    font-family: inherit;
}

.input-with-prefix {
    position: relative;
    display: flex;
    align-items: center;
}

.input-prefix {
    position: absolute;
    left: 12px;
    color: #FFD700;
    font-size: 18px;
    font-weight: bold;
    pointer-events: none;
}

.input-with-prefix .form-input {
    padding-left: 35px;
}

.input-with-suffix {
    position: relative;
    display: flex;
    align-items: center;
}

.input-suffix {
    position: absolute;
    right: 12px;
    color: #FFD700;
    font-size: 14px;
    font-weight: bold;
    pointer-events: none;
}

.input-with-suffix .form-input {
    padding-right: 40px;
}

.venta-resumen {
    background: rgba(255, 215, 0, 0.1);
    border: 1px solid #FFD700;
    border-radius: 5px;
    padding: 15px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.resumen-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #fff;
}

.resumen-row span {
    color: #999;
}

.resumen-row strong {
    color: #FFD700;
    font-size: 16px;
}

/* Animación de cierre */
.modal-overlay.fade-out {
    animation: fadeOut 0.3s ease forwards;
}

@keyframes fadeOut {
    to {
        opacity: 0;
    }
}

/* Responsive */
@media (max-width: 768px) {
    .modal-zarpar {
        max-width: 100%;
        width: 100%;
        max-height: 100vh;
        border-radius: 0;
    }
    
    .form-input {
        font-size: 16px; /* Evita zoom en iOS */
    }
}
`;
