import React, { useState, useEffect } from 'react';
import { Cloud, Save, CheckCircle, WifiOff, ExternalLink, Flame, Lock, AlertTriangle, Users, Pencil, Key } from 'lucide-react';
import { configureFirebase, getDb, disconnectFirebase, isHardcodedConfig } from '../firebaseClient';
import { SchoolData, User } from '../types';

interface ConfigViewProps {
  data: SchoolData;
  onUpdateData: (newData: SchoolData) => void;
  currentUser: User;
}

const ConfigView: React.FC<ConfigViewProps> = ({ data, onUpdateData, currentUser }) => {
  const [configJson, setConfigJson] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  // States for Authorities (Manual Text Input)
  const [directorName, setDirectorName] = useState(data.director || '');
  const [subGestionName, setSubGestionName] = useState(data.subdirectorGestion || '');
  const [subAcadName, setSubAcadName] = useState(data.subdirectorAcademico || '');
  const [authSaveMsg, setAuthSaveMsg] = useState(false);

  const isConnected = !!getDb();
  const isGlobal = isHardcodedConfig();
  const isAdmin = currentUser.role === 'admin';

  // Sync state if data updates externally
  useEffect(() => {
      setDirectorName(data.director || '');
      setSubGestionName(data.subdirectorGestion || '');
      setSubAcadName(data.subdirectorAcademico || '');
  }, [data]);

  const handleSaveAuthorities = () => {
      if (!isAdmin) return;
      onUpdateData({
          ...data,
          director: directorName,
          subdirectorGestion: subGestionName,
          subdirectorAcademico: subAcadName,
          // Legacy support
          subdirector: subGestionName 
      });
      setAuthSaveMsg(true);
      setTimeout(() => setAuthSaveMsg(false), 3000);
  };

  const handleSaveFirebase = (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const cleanJson = configJson.replace(/const firebaseConfig = /g, '').replace(/;/g, '');
        const config = JSON.parse(cleanJson);
        
        if (configureFirebase(config)) {
            setStatus('success');
        } else {
            setStatus('error');
        }
    } catch (e) {
        setStatus('error');
    }
  };

  const handleDisconnect = () => {
    if (isGlobal) {
        alert("No se puede desconectar porque la configuración está fija en el código del sistema.");
        return;
    }
    if (confirm('¿Desconectar base de datos? Volverás al modo local.')) {
        disconnectFirebase();
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-slate-800">Configuración del Sistema</h2>
        <p className="text-slate-500">Gestión de autoridades escolares y conexión a base de datos.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* COLUMNA 1: AUTORIDADES ESCOLARES (SOLO ADMIN) */}
        {isAdmin ? (
            <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center text-blue-600">
                        <Users size={20} className="mr-2" />
                        Autoridades y Firmas
                    </h3>
                    <p className="text-sm text-slate-500 mb-6">
                        Escribe los nombres y títulos exactamente como deseas que aparezcan en los formatos oficiales (ej. "Lic. Juan Pérez").
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Director del Plantel</label>
                            <div className="relative">
                                <Key size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"/>
                                <input 
                                    type="text" 
                                    value={directorName} 
                                    onChange={e => setDirectorName(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                                    placeholder="Nombre completo del Director..."
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1 italic">Firma en: Todos los documentos oficiales.</p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Subdirector de Gestión</label>
                            <div className="relative">
                                <Pencil size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"/>
                                <input 
                                    type="text" 
                                    value={subGestionName} 
                                    onChange={e => setSubGestionName(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                                    placeholder="Nombre completo del Subdirector de Gestión..."
                                />
                            </div>
                            <p className="text-[10px] text-blue-600 font-bold mt-1 italic">Firma en: Citatorios, Bitácoras y Reportes de Asistencia.</p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Subdirector Académico</label>
                            <div className="relative">
                                <Pencil size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"/>
                                <input 
                                    type="text" 
                                    value={subAcadName} 
                                    onChange={e => setSubAcadName(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                                    placeholder="Nombre completo del Subdirector Académico..."
                                />
                            </div>
                            <p className="text-[10px] text-blue-600 font-bold mt-1 italic">Firma en: Cuadros de Concentración de Inasistencia y Evaluación.</p>
                        </div>

                        <button 
                            onClick={handleSaveAuthorities}
                            className="w-full py-2 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900 transition-colors flex justify-center items-center gap-2 mt-4"
                        >
                            <Save size={18} /> Guardar Autoridades
                        </button>

                        {authSaveMsg && (
                            <div className="p-2 bg-green-50 text-green-700 text-xs rounded-lg flex items-center gap-2 justify-center animate-fade-in">
                                <CheckCircle size={14}/> Cambios guardados correctamente.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        ) : (
            <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2"><Lock size={18}/> Panel Restringido</h3>
                    <p className="text-sm text-blue-700">La configuración de autoridades escolares y base de datos solo está disponible para el Director.</p>
                </div>
            </div>
        )}

        {/* COLUMNA 2: BASE DE DATOS */}
        <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center text-orange-600">
                     <Flame size={20} className="mr-2" />
                     Conexión a Base de Datos
                </h3>
                
                {isGlobal ? (
                    <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm mb-4 border border-blue-200">
                        <p className="font-bold flex items-center gap-2"><Lock size={16}/> Configuración Global Activa</p>
                        <p className="mt-2">El sistema está conectado mediante credenciales internas. Todos los usuarios comparten esta conexión automáticamente.</p>
                        <div className="mt-3 flex items-center gap-2 text-xs bg-white/50 p-2 rounded">
                            <CheckCircle size={14} className="text-green-600"/>
                            <span>Base de datos operativa</span>
                        </div>
                    </div>
                ) : (
                    <div className="text-sm text-slate-600 space-y-4">
                        <p className="flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                            Estado: <strong>{isConnected ? 'Conectado' : 'Modo Local (Sin sincronizar)'}</strong>
                        </p>
                        
                        <div className="border-t border-slate-100 pt-4">
                            <h4 className="font-bold text-slate-800 mb-2">Instrucciones:</h4>
                            <ol className="list-decimal list-inside space-y-2 text-xs">
                                <li>Ve a <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center">Firebase Console <ExternalLink size={10} className="ml-1"/></a>.</li>
                                <li>Crea una <strong>"App Web"</strong> y una <strong>Firestore Database</strong>.</li>
                                <li>Copia el objeto <code>firebaseConfig</code> y pégalo abajo.</li>
                            </ol>
                        </div>
                    </div>
                )}
            </div>

            {isConnected && !isGlobal && (
                 <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center animate-fade-in">
                    <CheckCircle size={40} className="text-green-600 mx-auto mb-2" />
                    <h4 className="text-xl font-bold text-green-800 mb-2">Dispositivo Conectado</h4>
                    <p className="text-green-700 mb-4 text-sm">Los datos se guardan en la nube.</p>
                    <button 
                        onClick={handleDisconnect}
                        className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm font-bold flex items-center justify-center mx-auto"
                    >
                        <WifiOff size={16} className="mr-2"/> Desconectar este dispositivo
                    </button>
                </div>
            )}

            {/* Formulario (Solo si no es global y es admin o no conectado) */}
            {!isGlobal && (
                <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-6 ${isConnected ? 'opacity-50 pointer-events-none' : ''}`}>
                    <form onSubmit={handleSaveFirebase} className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="block text-xs font-bold text-slate-500 uppercase">
                                Configuración JSON
                            </label>
                            <span className="text-[10px] text-slate-400">Pegar objeto entre llaves {'{...}'}</span>
                        </div>
                        
                        <textarea 
                            value={configJson}
                            onChange={e => setConfigJson(e.target.value)}
                            placeholder={'{ \n  "apiKey": "AIzaSy...", \n  "authDomain": "...", \n  "projectId": "..." \n}'}
                            className="w-full h-40 p-4 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-orange-500 outline-none bg-slate-50"
                        />
                        
                        {status === 'error' && (
                            <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg flex items-center gap-2">
                                <AlertTriangle size={16}/> Error en el formato JSON.
                            </div>
                        )}

                        {status === 'success' && (
                            <div className="p-3 bg-green-50 text-green-600 text-xs rounded-lg flex items-center gap-2">
                                <CheckCircle size={16}/> ¡Conexión exitosa! Recargando...
                            </div>
                        )}
                        
                        <button 
                            type="submit"
                            className="w-full py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 shadow-lg flex items-center justify-center gap-2"
                        >
                            <Cloud size={20} /> Conectar Escuela
                        </button>
                    </form>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default ConfigView;