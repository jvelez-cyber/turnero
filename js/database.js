// ===========================
// MÓDULO DE BASE DE DATOS - JETSKIS
// ===========================

import { CONFIG } from './config.js';
import { 
    collection, 
    doc, 
    getDocs, 
    addDoc, 
    updateDoc, 
    deleteDoc,
    query, 
    where, 
    orderBy,
    onSnapshot,
    writeBatch,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

class DatabaseManager {
    constructor() {
        this.listeners = new Map();
        this.cache = new Map();
    }

    // ===========================
    // JETSKIS
    // ===========================
    
    // Obtener todos los jetskis
    async getJetskis() {
        try {
            const jetskisRef = collection(window.firebaseDB, CONFIG.FIREBASE.COLLECTIONS.JETSKIS);
            const q = query(jetskisRef, orderBy('posicion', 'asc'));
            
            const querySnapshot = await getDocs(q);
            const jetskis = [];
            
            querySnapshot.forEach((doc) => {
                jetskis.push({
                    firebaseId: doc.id,
                    ...doc.data()
                });
            });
            
            return jetskis;
            
        } catch (error) {
            console.error('Error obteniendo jetskis:', error);
            throw error;
        }
    }

    // Escuchar cambios en jetskis en tiempo real
    listenToJetskis(callback) {
        const jetskisRef = collection(window.firebaseDB, CONFIG.FIREBASE.COLLECTIONS.JETSKIS);
        const q = query(jetskisRef, orderBy('posicion', 'asc'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const jetskis = [];
            
            querySnapshot.forEach((doc) => {
                jetskis.push({
                    firebaseId: doc.id,
                    ...doc.data()
                });
            });
            
            callback(jetskis);
        }, (error) => {
            console.error('Error en listener de jetskis:', error);
            callback(null, error);
        });

        this.listeners.set('jetskis', unsubscribe);
        return unsubscribe;
    }

    // Inicializar jetskis (primera vez)
    async initializeJetskis() {
        try {
            const jetskisRef = collection(window.firebaseDB, CONFIG.FIREBASE.COLLECTIONS.JETSKIS);
            const querySnapshot = await getDocs(jetskisRef);
            
            // Si ya existen jetskis, no hacer nada
            if (!querySnapshot.empty) {
                console.log('Jetskis ya inicializados');
                return { success: true, message: 'Ya existen jetskis' };
            }
            
            // Crear jetskis iniciales
            const batch = writeBatch(window.firebaseDB);
            
            CONFIG.EMPRESAS.forEach((nombre, index) => {
                const jetskiRef = doc(jetskisRef);
                batch.set(jetskiRef, {
                    id: index + 1,
                    nombre: nombre,
                    estado: CONFIG.ESTADOS.EN_TURNO,
                    posicion: index + 1,
                    fechaCreacion: serverTimestamp(),
                    fechaActualizacion: serverTimestamp()
                });
            });
            
            await batch.commit();
            
            return {
                success: true,
                message: `${CONFIG.EMPRESAS.length} jetskis inicializados`
            };
            
        } catch (error) {
            console.error('Error inicializando jetskis:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Actualizar estado de un jetski
    async updateJetskiEstado(jetskiId, nuevoEstado) {
        try {
            const jetskiRef = doc(window.firebaseDB, CONFIG.FIREBASE.COLLECTIONS.JETSKIS, jetskiId);
            
            await updateDoc(jetskiRef, {
                estado: nuevoEstado,
                fechaActualizacion: serverTimestamp()
            });
            
            return {
                success: true,
                id: jetskiId,
                estado: nuevoEstado
            };
            
        } catch (error) {
            console.error('Error actualizando estado:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Actualizar posición de un jetski
    async updateJetskiPosicion(jetskiId, nuevaPosicion) {
        try {
            const jetskiRef = doc(window.firebaseDB, CONFIG.FIREBASE.COLLECTIONS.JETSKIS, jetskiId);
            
            await updateDoc(jetskiRef, {
                posicion: nuevaPosicion,
                fechaActualizacion: serverTimestamp()
            });
            
            return {
                success: true,
                id: jetskiId,
                posicion: nuevaPosicion
            };
            
        } catch (error) {
            console.error('Error actualizando posición:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Actualizar múltiples jetskis (reorganización)
    async updateMultipleJetskis(updates) {
        try {
            const batch = writeBatch(window.firebaseDB);
            
            updates.forEach(update => {
                const jetskiRef = doc(window.firebaseDB, CONFIG.FIREBASE.COLLECTIONS.JETSKIS, update.firebaseId);
                batch.update(jetskiRef, {
                    ...update.data,
                    fechaActualizacion: serverTimestamp()
                });
            });
            
            await batch.commit();
            
            return {
                success: true,
                updatedCount: updates.length
            };
            
        } catch (error) {
            console.error('Error en actualización múltiple:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Poner todos en "EN TURNO"
    async resetAllToEnTurno() {
        try {
            const jetskis = await this.getJetskis();
            const batch = writeBatch(window.firebaseDB);
            
            jetskis.forEach(jetski => {
                const jetskiRef = doc(window.firebaseDB, CONFIG.FIREBASE.COLLECTIONS.JETSKIS, jetski.firebaseId);
                batch.update(jetskiRef, {
                    estado: CONFIG.ESTADOS.EN_TURNO,
                    fechaActualizacion: serverTimestamp()
                });
            });
            
            await batch.commit();
            
            return {
                success: true,
                updatedCount: jetskis.length
            };
            
        } catch (error) {
            console.error('Error reseteando jetskis:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Avanzar al siguiente jetski
    async setNextEmbarcando() {
        try {
            const jetskis = await this.getJetskis();
            const batch = writeBatch(window.firebaseDB);
            
            // Primero, poner todos en EN TURNO
            jetskis.forEach(jetski => {
                const jetskiRef = doc(window.firebaseDB, CONFIG.FIREBASE.COLLECTIONS.JETSKIS, jetski.firebaseId);
                batch.update(jetskiRef, {
                    estado: CONFIG.ESTADOS.EN_TURNO,
                    fechaActualizacion: serverTimestamp()
                });
            });
            
            // Encontrar el primer jetski que está EN TURNO y ponerlo EMBARCANDO
            const nextJetski = jetskis.find(j => j.estado === CONFIG.ESTADOS.EN_TURNO);
            
            if (nextJetski) {
                const jetskiRef = doc(window.firebaseDB, CONFIG.FIREBASE.COLLECTIONS.JETSKIS, nextJetski.firebaseId);
                batch.update(jetskiRef, {
                    estado: CONFIG.ESTADOS.EMBARCANDO,
                    fechaActualizacion: serverTimestamp()
                });
            }
            
            await batch.commit();
            
            return {
                success: true,
                nextJetski: nextJetski?.nombre || null
            };
            
        } catch (error) {
            console.error('Error avanzando turno:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ===========================
    // HISTORIAL
    // ===========================
    
    // Registrar cambio en historial
    async addHistorial(tipo, detalles) {
        try {
            const historialRef = collection(window.firebaseDB, CONFIG.FIREBASE.COLLECTIONS.HISTORIAL);
            
            const newHistorial = {
                tipo,
                detalles,
                fecha: serverTimestamp(),
                usuario: window.Auth?.getCurrentUser()?.email || 'sistema'
            };
            
            await addDoc(historialRef, newHistorial);
            
            return { success: true };
            
        } catch (error) {
            console.error('Error registrando historial:', error);
            return { success: false, error: error.message };
        }
    }

    // ===========================
    // UTILIDADES
    // ===========================
    
    // Limpiar listeners
    cleanupListeners() {
        this.listeners.forEach((unsubscribe) => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        });
        this.listeners.clear();
    }

    // Limpiar cache
    clearCache() {
        this.cache.clear();
    }

    // Verificar conexión
    async testConnection() {
        try {
            const testRef = collection(window.firebaseDB, CONFIG.FIREBASE.COLLECTIONS.JETSKIS);
            await getDocs(testRef);
            return true;
        } catch (error) {
            console.error('Error de conexión:', error);
            return false;
        }
    }
}

// ===========================
// INSTANCIA GLOBAL
// ===========================
const databaseManager = new DatabaseManager();

// Exportar para uso en otros módulos
export default databaseManager;

// Hacer disponible globalmente
window.Database = databaseManager;
