

import React, { useState } from 'react';
import { Lock, User as UserIcon, Calendar, Loader2 } from 'lucide-react';
import { User } from '../types';

const LOGO_URL = "https://cdn1.sharemyimage.com/smi/2025/10/05/27tv.png";

interface LoginViewProps {
  onLogin: (user: User, selectedCycle: string) => void;
  users: User[];
  isLoading?: boolean;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin, users, isLoading = false }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState(''); 
  const [error, setError] = useState('');
  const [cycle, setCycle] = useState('2025-2026');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    // Authentication Logic
    const user = users.find(u => u.username === username);
    
    if (user) {
      if (user.password === password) {
        onLogin(user, cycle);
      } else {
        setError('Contraseña incorrecta.');
      }
    } else {
      setError('Usuario no encontrado.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-blue-600 p-8 text-center">
          <div className="bg-white w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg p-2">
            <img src={LOGO_URL} alt="Logo Escuela" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-white">Escuela Secundaria 27</h1>
          <p className="text-blue-100 mt-2">Sistema de Gestión Escolar</p>
        </div>
        
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Ciclo Escolar</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <select 
                    value={cycle}
                    onChange={(e) => setCycle(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white appearance-none disabled:bg-slate-100 disabled:text-slate-500"
                    disabled={isLoading}
                >
                    <option value="2025-2026">2025-2026</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Usuario</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:bg-slate-100 disabled:text-slate-500"
                  placeholder="Ingresa tu usuario"
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:bg-slate-100 disabled:text-slate-500"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className={`w-full bg-slate-900 text-white py-3 rounded-xl font-bold transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2 ${isLoading ? 'opacity-70 cursor-wait' : 'hover:bg-slate-800'}`}
            >
              {isLoading && <Loader2 className="animate-spin" size={20} />}
              {isLoading ? 'Conectando...' : 'Iniciar Sesión'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginView;