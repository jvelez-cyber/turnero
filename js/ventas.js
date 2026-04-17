// ===========================
// SISTEMA DE GESTIÓN DE VENTAS
// ===========================

import { 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    where, 
    orderBy,
    serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

class VentasManager {
    constructor() {
        this.COLLECTION = 'ventas';
    }

    // ===========================
    // REGISTRAR VENTA
    // ===========================
    
    async registrarVenta(ventaData) {
        try {
            console.log('💰 Registrando venta:', ventaData);
            
            const ventasRef = collection(window.firebaseDB, this.COLLECTION);
            
            const venta = {
                // Datos del jetski
                jetskiId: ventaData.jetskiId,
                jetskiNombre: ventaData.jetskiNombre,
                
                // Datos de la venta
                precioVenta: ventaData.precioVenta,
                numPersonas: ventaData.numPersonas,
                horasAlquiler: ventaData.horasAlquiler,
                vendedor: ventaData.vendedor,
                observaciones: ventaData.observaciones || '',
                cantidadMotos: ventaData.cantidadMotos || 1,
                cilindrajes: ventaData.cilindrajes || [],
                
                // Timestamps
                fechaVenta: serverTimestamp(),
                timestamp: Date.now(),
                
                // Usuario que registra (si existe)
                usuarioRegistro: window.Auth?.getCurrentUser()?.email || 'sistema',
                
                // Estado
                estado: 'completada'
            };
            
            const docRef = await addDoc(ventasRef, venta);
            
            console.log('✅ Venta registrada con ID:', docRef.id);
            
            return {
                success: true,
                id: docRef.id,
                message: 'Venta registrada correctamente'
            };
            
        } catch (error) {
            console.error('❌ Error registrando venta:', error);
            return {
                success: false,
                error: error.message,
                message: 'Error al registrar la venta'
            };
        }
    }

    // ===========================
    // OBTENER VENTAS
    // ===========================
    
    async getVentas(filtros = {}) {
        try {
            const ventasRef = collection(window.firebaseDB, this.COLLECTION);
            let q = query(ventasRef, orderBy('timestamp', 'desc'));
            
            // Filtros opcionales
            if (filtros.fechaInicio && filtros.fechaFin) {
                q = query(
                    ventasRef,
                    where('timestamp', '>=', filtros.fechaInicio),
                    where('timestamp', '<=', filtros.fechaFin),
                    orderBy('timestamp', 'desc')
                );
            }
            
            if (filtros.vendedor) {
                q = query(
                    ventasRef,
                    where('vendedor', '==', filtros.vendedor),
                    orderBy('timestamp', 'desc')
                );
            }
            
            if (filtros.jetskiId) {
                q = query(
                    ventasRef,
                    where('jetskiId', '==', filtros.jetskiId),
                    orderBy('timestamp', 'desc')
                );
            }
            
            const querySnapshot = await getDocs(q);
            const ventas = [];
            
            querySnapshot.forEach((doc) => {
                ventas.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            console.log(`📊 ${ventas.length} ventas obtenidas`);
            
            return ventas;
            
        } catch (error) {
            console.error('❌ Error obteniendo ventas:', error);
            console.error('Código de error:', error.code);
            console.error('Mensaje:', error.message);
            
            // Si es error de permisos, mostrar mensaje claro
            if (error.code === 'permission-denied') {
                console.error('🔒 ERROR DE PERMISOS: Verifica las reglas de Firestore');
                console.error('Necesitas configurar las reglas en Firebase Console');
            }
            
            // Retornar array vacío en lugar de fallar
            return [];
        }
    }

    // ===========================
    // OBTENER VENTAS DE HOY
    // ===========================
    
    async getVentasHoy() {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        const manana = new Date(hoy);
        manana.setDate(manana.getDate() + 1);
        
        return await this.getVentas({
            fechaInicio: hoy.getTime(),
            fechaFin: manana.getTime()
        });
    }

    // ===========================
    // OBTENER VENTAS POR RANGO DE FECHAS
    // ===========================
    
    async getVentasPorRango(fechaInicio, fechaFin) {
        return await this.getVentas({
            fechaInicio: new Date(fechaInicio).getTime(),
            fechaFin: new Date(fechaFin).setHours(23, 59, 59, 999)
        });
    }

    // ===========================
    // ESTADÍSTICAS
    // ===========================
    
    calcularEstadisticas(ventas) {
        if (!ventas || ventas.length === 0) {
            return {
                totalVentas: 0,
                totalIngresos: 0,
                promedioVenta: 0,
                totalPersonas: 0,
                totalHoras: 0,
                ventasPorVendedor: {},
                ventasPorJetski: {}
            };
        }
        
        const stats = {
            totalVentas: ventas.length,
            totalIngresos: 0,
            totalPersonas: 0,
            totalHoras: 0,
            ventasPorVendedor: {},
            ventasPorJetski: {}
        };
        
        ventas.forEach(venta => {
            // Ingresos
            stats.totalIngresos += venta.precioVenta || 0;
            
            // Personas
            stats.totalPersonas += venta.numPersonas || 0;
            
            // Horas
            stats.totalHoras += venta.horasAlquiler || 0;
            
            // Por vendedor
            const vendedor = venta.vendedor || 'Sin vendedor';
            if (!stats.ventasPorVendedor[vendedor]) {
                stats.ventasPorVendedor[vendedor] = {
                    cantidad: 0,
                    ingresos: 0
                };
            }
            stats.ventasPorVendedor[vendedor].cantidad++;
            stats.ventasPorVendedor[vendedor].ingresos += venta.precioVenta || 0;
            
            // Por jetski
            const jetski = venta.jetskiNombre || 'Sin nombre';
            if (!stats.ventasPorJetski[jetski]) {
                stats.ventasPorJetski[jetski] = {
                    cantidad: 0,
                    ingresos: 0
                };
            }
            stats.ventasPorJetski[jetski].cantidad++;
            stats.ventasPorJetski[jetski].ingresos += venta.precioVenta || 0;
        });
        
        // Promedio
        stats.promedioVenta = Math.round(stats.totalIngresos / stats.totalVentas);
        
        return stats;
    }

    // ===========================
    // EXPORTAR A CSV
    // ===========================
    
    exportarCSV(ventas, nombreArchivo = 'ventas') {
        if (!ventas || ventas.length === 0) {
            alert('No hay ventas para exportar');
            return;
        }
        
        // Headers
        const headers = [
            'Fecha',
            'Hora',
            'Jetski',
            'Vendedor',
            'Precio',
            'Personas',
            'Horas',
            'Cant. Motos',
            'Cilindrajes (cc)',
            'Observaciones'
        ];

        // Convertir ventas a filas CSV
        const rows = ventas.map(venta => {
            const fecha = venta.fechaVenta?.toDate?.() || new Date(venta.timestamp);
            const cilindrajes = Array.isArray(venta.cilindrajes)
                ? venta.cilindrajes.map(c => c + 'cc').join(' / ')
                : '';

            return [
                this.formatFecha(fecha),
                this.formatHora(fecha),
                venta.jetskiNombre || '',
                venta.vendedor || '',
                venta.precioVenta || 0,
                venta.numPersonas || 0,
                venta.horasAlquiler || 0,
                venta.cantidadMotos || 1,
                cilindrajes,
                (venta.observaciones || '').replace(/,/g, ';')
            ];
        });
        
        // Crear CSV
        let csv = headers.join(',') + '\n';
        rows.forEach(row => {
            csv += row.join(',') + '\n';
        });
        
        // Descargar
        this.descargarArchivo(csv, `${nombreArchivo}.csv`, 'text/csv');
        
        console.log('✅ CSV exportado:', nombreArchivo);
    }

    // ===========================
    // EXPORTAR A EXCEL (XLSX)
    // ===========================
    
    async exportarExcel(ventas, nombreArchivo = 'ventas') {
        if (!ventas || ventas.length === 0) {
            alert('No hay ventas para exportar');
            return;
        }
        
        // Crear tabla HTML
        let html = `
            <table>
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Hora</th>
                        <th>Jetski</th>
                        <th>Vendedor</th>
                        <th>Precio</th>
                        <th>Personas</th>
                        <th>Horas</th>
                        <th>Cant. Motos</th>
                        <th>Cilindrajes (cc)</th>
                        <th>Observaciones</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        ventas.forEach(venta => {
            const fecha = venta.fechaVenta?.toDate?.() || new Date(venta.timestamp);
            const cilindrajes = Array.isArray(venta.cilindrajes)
                ? venta.cilindrajes.map(c => c + 'cc').join(' / ')
                : '';

            html += `
                <tr>
                    <td>${this.formatFecha(fecha)}</td>
                    <td>${this.formatHora(fecha)}</td>
                    <td>${venta.jetskiNombre || ''}</td>
                    <td>${venta.vendedor || ''}</td>
                    <td>$${(venta.precioVenta || 0).toLocaleString('es-CO')}</td>
                    <td>${venta.numPersonas || 0}</td>
                    <td>${venta.horasAlquiler || 0}h</td>
                    <td>${venta.cantidadMotos || 1}</td>
                    <td>${cilindrajes}</td>
                    <td>${venta.observaciones || ''}</td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
        `;
        
        // Descargar como XLSX
        this.descargarArchivo(html, `${nombreArchivo}.xls`, 'application/vnd.ms-excel');
        
        console.log('✅ Excel exportado:', nombreArchivo);
    }

    // ===========================
    // UTILIDADES
    // ===========================
    
    formatFecha(fecha) {
        return new Intl.DateTimeFormat('es-CO', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(fecha);
    }
    
    formatHora(fecha) {
        return new Intl.DateTimeFormat('es-CO', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).format(fecha);
    }
    
    formatMoneda(valor) {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(valor);
    }
    
    descargarArchivo(contenido, nombreArchivo, tipo) {
        const blob = new Blob([contenido], { type: tipo });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = nombreArchivo;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }
}

// ===========================
// INSTANCIA GLOBAL
// ===========================
const ventasManager = new VentasManager();

export default ventasManager;

// Hacer disponible globalmente
window.Ventas = ventasManager;
