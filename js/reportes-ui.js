// ===========================
// INTERFAZ DE REPORTES DE VENTAS
// ===========================

import ventasManager from './ventas.js';

export function renderReportes() {
    return `
        <div class="reportes-container">
            <!-- Header Reportes -->
            <div class="reportes-header">
                <h2>
                    <i class="fas fa-chart-line"></i>
                    Reportes de Ventas
                </h2>
                <button class="btn-close-reportes" id="closeReportesBtn">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <!-- Filtros -->
            <div class="reportes-filtros">
                <div class="filtro-group">
                    <label>Rango de Fechas:</label>
                    <div class="date-range">
                        <input type="date" id="fechaInicio" class="form-input-small">
                        <span>hasta</span>
                        <input type="date" id="fechaFin" class="form-input-small">
                    </div>
                </div>
                
                <div class="filtro-group">
                    <label>Filtros Rápidos:</label>
                    <div class="quick-filters">
                        <button class="filter-btn active" data-filter="hoy">Hoy</button>
                        <button class="filter-btn" data-filter="semana">Esta Semana</button>
                        <button class="filter-btn" data-filter="mes">Este Mes</button>
                        <button class="filter-btn" data-filter="todo">Todo</button>
                    </div>
                </div>

                <button class="btn btn-primary" id="aplicarFiltrosBtn">
                    <i class="fas fa-filter"></i>
                    Aplicar Filtros
                </button>
            </div>

            <!-- Estadísticas -->
            <div class="stats-grid" id="statsGrid">
                <div class="stat-card">
                    <div class="stat-icon">💰</div>
                    <div class="stat-content">
                        <div class="stat-label">Ingresos Totales</div>
                        <div class="stat-value" id="statIngresos">$0</div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon">🎫</div>
                    <div class="stat-content">
                        <div class="stat-label">Total Ventas</div>
                        <div class="stat-value" id="statVentas">0</div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon">👥</div>
                    <div class="stat-content">
                        <div class="stat-label">Total Personas</div>
                        <div class="stat-value" id="statPersonas">0</div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon">⏱️</div>
                    <div class="stat-content">
                        <div class="stat-label">Total Horas</div>
                        <div class="stat-value" id="statHoras">0h</div>
                    </div>
                </div>
            </div>

            <!-- Botones de Exportación -->
            <div class="export-buttons">
                <button class="btn btn-export" id="exportCSVBtn">
                    <i class="fas fa-file-csv"></i>
                    Exportar CSV
                </button>
                <button class="btn btn-export" id="exportExcelBtn">
                    <i class="fas fa-file-excel"></i>
                    Exportar Excel
                </button>
            </div>

            <!-- Tabla de Ventas -->
            <div class="ventas-table-container">
                <h3>Detalle de Ventas</h3>
                <div class="table-responsive">
                    <table class="ventas-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Hora</th>
                                <th>Jetski</th>
                                <th>Vendedor</th>
                                <th>Precio</th>
                                <th>Personas</th>
                                <th>Horas</th>
                                <th>Observaciones</th>
                            </tr>
                        </thead>
                        <tbody id="ventasTableBody">
                            <tr>
                                <td colspan="8" class="table-loading">
                                    <div class="spinner"></div>
                                    Cargando ventas...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Top Vendedores -->
            <div class="top-vendedores">
                <h3>Top Vendedores</h3>
                <div id="topVendedores" class="top-list">
                    <!-- Se llena dinámicamente -->
                </div>
            </div>
        </div>
    `;
}

export async function initReportes() {
    console.log('📊 Inicializando reportes...');
    
    // Cargar ventas de hoy por defecto
    await cargarVentas('hoy');
    
    // Event Listeners
    setupReportesEvents();
}

function setupReportesEvents() {
    // Cerrar reportes
    const closeBtn = document.getElementById('closeReportesBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            console.log('🔙 Cerrando reportes, volviendo a admin...');
            // Recargar la página para volver al estado inicial
            window.location.reload();
        });
    }
    
    // Filtros rápidos
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            // Remover active de todos
            filterBtns.forEach(b => b.classList.remove('active'));
            // Agregar active al clickeado
            btn.classList.add('active');
            
            const filter = btn.dataset.filter;
            await cargarVentas(filter);
        });
    });
    
    // Aplicar filtros personalizados
    const aplicarBtn = document.getElementById('aplicarFiltrosBtn');
    if (aplicarBtn) {
        aplicarBtn.addEventListener('click', async () => {
            const fechaInicio = document.getElementById('fechaInicio').value;
            const fechaFin = document.getElementById('fechaFin').value;
            
            if (!fechaInicio || !fechaFin) {
                alert('Selecciona un rango de fechas');
                return;
            }
            
            if (new Date(fechaInicio) > new Date(fechaFin)) {
                alert('La fecha de inicio debe ser menor a la fecha fin');
                return;
            }
            
            await cargarVentas('custom', fechaInicio, fechaFin);
        });
    }
    
    // Exportar CSV
    const exportCSVBtn = document.getElementById('exportCSVBtn');
    if (exportCSVBtn) {
        exportCSVBtn.addEventListener('click', () => {
            const ventas = window.currentVentas || [];
            const fechaActual = new Date().toISOString().split('T')[0];
            ventasManager.exportarCSV(ventas, `ventas_${fechaActual}`);
        });
    }
    
    // Exportar Excel
    const exportExcelBtn = document.getElementById('exportExcelBtn');
    if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', () => {
            const ventas = window.currentVentas || [];
            const fechaActual = new Date().toISOString().split('T')[0];
            ventasManager.exportarExcel(ventas, `ventas_${fechaActual}`);
        });
    }
}

async function cargarVentas(filtro = 'hoy', fechaInicio = null, fechaFin = null) {
    console.log('🔄 Cargando ventas:', filtro);
    
    let ventas = [];
    
    try {
        switch (filtro) {
            case 'hoy':
                ventas = await ventasManager.getVentasHoy();
                break;
            
            case 'semana':
                const inicioSemana = new Date();
                inicioSemana.setDate(inicioSemana.getDate() - 7);
                ventas = await ventasManager.getVentasPorRango(inicioSemana, new Date());
                break;
            
            case 'mes':
                const inicioMes = new Date();
                inicioMes.setDate(1);
                ventas = await ventasManager.getVentasPorRango(inicioMes, new Date());
                break;
            
            case 'custom':
                if (fechaInicio && fechaFin) {
                    ventas = await ventasManager.getVentasPorRango(fechaInicio, fechaFin);
                }
                break;
            
            case 'todo':
            default:
                ventas = await ventasManager.getVentas();
                break;
        }
        
        // Guardar ventas actuales
        window.currentVentas = ventas;
        
        // Actualizar UI
        actualizarEstadisticas(ventas);
        renderVentasTable(ventas);
        renderTopVendedores(ventas);
        
    } catch (error) {
        console.error('Error cargando ventas:', error);
        alert('Error cargando ventas: ' + error.message);
    }
}

function actualizarEstadisticas(ventas) {
    const stats = ventasManager.calcularEstadisticas(ventas);
    
    document.getElementById('statIngresos').textContent = ventasManager.formatMoneda(stats.totalIngresos);
    document.getElementById('statVentas').textContent = stats.totalVentas;
    document.getElementById('statPersonas').textContent = stats.totalPersonas;
    document.getElementById('statHoras').textContent = stats.totalHoras.toFixed(1) + 'h';
}

function renderVentasTable(ventas) {
    const tbody = document.getElementById('ventasTableBody');
    
    if (!ventas || ventas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="table-empty">
                    <i class="fas fa-inbox"></i>
                    <p>No hay ventas en este período</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = ventas.map(venta => {
        const fecha = venta.fechaVenta?.toDate?.() || new Date(venta.timestamp);
        
        return `
            <tr>
                <td>${ventasManager.formatFecha(fecha)}</td>
                <td>${ventasManager.formatHora(fecha)}</td>
                <td><strong>${venta.jetskiNombre}</strong></td>
                <td>${venta.vendedor}</td>
                <td class="precio-cell">${ventasManager.formatMoneda(venta.precioVenta)}</td>
                <td class="centered">${venta.numPersonas}</td>
                <td class="centered">${venta.horasAlquiler}h</td>
                <td class="obs-cell">${venta.observaciones || '-'}</td>
            </tr>
        `;
    }).join('');
}

function renderTopVendedores(ventas) {
    const stats = ventasManager.calcularEstadisticas(ventas);
    const topDiv = document.getElementById('topVendedores');
    
    // Ordenar vendedores por ingresos
    const vendedoresArray = Object.entries(stats.ventasPorVendedor)
        .map(([nombre, data]) => ({
            nombre,
            ...data
        }))
        .sort((a, b) => b.ingresos - a.ingresos)
        .slice(0, 5); // Top 5
    
    if (vendedoresArray.length === 0) {
        topDiv.innerHTML = '<p class="no-data">No hay datos de vendedores</p>';
        return;
    }
    
    topDiv.innerHTML = vendedoresArray.map((vendedor, index) => `
        <div class="top-item">
            <div class="top-rank">${index + 1}</div>
            <div class="top-info">
                <div class="top-nombre">${vendedor.nombre}</div>
                <div class="top-stats">
                    ${vendedor.cantidad} ventas • ${ventasManager.formatMoneda(vendedor.ingresos)}
                </div>
            </div>
        </div>
    `).join('');
}

// Exportar funciones
window.ReportesUI = {
    render: renderReportes,
    init: initReportes,
    cargarVentas
};
