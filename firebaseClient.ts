import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, doc, setDoc, onSnapshot, Firestore } from 'firebase/firestore';
import { SchoolData } from './types';

// --- CONFIGURACIÓN GLOBAL (PARA QUE FUNCIONE EN TODOS LOS DISPOSITIVOS) ---
const HARDCODED_CONFIG: any = {
  apiKey: "AIzaSyC_f_epTUpgQv2Vg8Uzj66GiOY90HXhnac",
  authDomain: "secundaria-27.firebaseapp.com",
  projectId: "secundaria-27",
  storageBucket: "secundaria-27.firebasestorage.app",
  messagingSenderId: "596299020769",
  appId: "1:596299020769:web:03e10a0247c70736ab7aa0",
  measurementId: "G-M56M1KDZD2"
};

let db: Firestore | null = null;
let app: FirebaseApp | null = null;

// Función de inicialización robusta (Modular SDK)
const initFirebase = () => {
    let configToUse = null;

    // 1. Verificar si hay configuración global en el código
    if (HARDCODED_CONFIG && HARDCODED_CONFIG.apiKey && !HARDCODED_CONFIG.apiKey.includes('TU_API_KEY')) {
        configToUse = HARDCODED_CONFIG;
    } 
    // 2. Si no, verificar LocalStorage
    else if (typeof window !== 'undefined') {
        const savedConfig = localStorage.getItem('school_firebase_config');
        if (savedConfig) {
            try {
                configToUse = JSON.parse(savedConfig);
            } catch (e) {
                console.error("Configuración local corrupta");
            }
        }
    }

    // Inicializar si tenemos configuración
    if (configToUse) {
        try {
            // Verificar si ya existe una instancia para evitar errores de duplicidad
            if (getApps().length === 0) {
                app = initializeApp(configToUse);
            } else {
                app = getApp();
            }
            
            // Pasamos la instancia 'app' explícitamente a Firestore para evitar errores
            db = getFirestore(app);
            console.log(`🔥 Firebase conectado exitosamente.`);
        } catch (e) {
            console.error("Error crítico inicializando Firebase:", e);
        }
    }
};

// Ejecutar inicialización al cargar
initFirebase();

export const configureFirebase = (config: any) => {
    try {
        localStorage.setItem('school_firebase_config', JSON.stringify(config));
        window.location.reload();
        return true;
    } catch (e) {
        console.error("Configuración inválida", e);
        return false;
    }
};

export const getDb = () => db;

export const isHardcodedConfig = () => {
    return (HARDCODED_CONFIG && HARDCODED_CONFIG.apiKey && !HARDCODED_CONFIG.apiKey.includes('TU_API_KEY'));
};

export const disconnectFirebase = () => {
    localStorage.removeItem('school_firebase_config');
    db = null;
    window.location.reload();
};

export const saveToFirebase = async (data: SchoolData) => {
    if (!db) return;
    try {
        // SANITIZACIÓN: Elimina valores 'undefined' que rompen Firebase
        // Esto arregla el error "Unsupported field value: undefined"
        const cleanData = JSON.parse(JSON.stringify(data));
        await setDoc(doc(db, "schools", "default"), { ...cleanData, lastUpdated: new Date().toISOString() });
    } catch (e) {
        console.error("Error guardando en Firebase:", e);
        throw e; // Lanzar el error para que la UI se entere
    }
};

export const subscribeToData = (callback: (data: SchoolData) => void, onError?: (error: any) => void) => {
    if (!db) return () => {};
    
    // Usamos onSnapshot para escuchar cambios en tiempo real
    const unsub = onSnapshot(doc(db, "schools", "default"), (docSnap) => {
        if (docSnap.exists()) {
            callback(docSnap.data() as SchoolData);
        }
    }, (error) => {
        console.error("Error en suscripción:", error);
        if (onError) onError(error);
    });
    return unsub;
};