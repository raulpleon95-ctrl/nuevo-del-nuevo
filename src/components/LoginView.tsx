
import React, { useState } from 'react';
import { Lock, User as UserIcon, Calendar, Loader2, GraduationCap, Users } from 'lucide-react';
import { User, Student } from '../types';

const LOGO_URL = "https://cdn1.sharemyimage.com/smi/2025/10/05/27tv.png";

interface LoginViewProps {
  onLogin: (user: User, selectedCycle: string) => void;
  users: User[];
  studentsData?: Student[]; // Pasamos los alumnos para validar su login
  isLoading?: boolean;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin, users, studentsData = [], isLoading = false }) => {
  const [activeTab, setActiveTab] = useState<'staff' | 'student'>('staff');
  
  // States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState(''); 
  const [error, setError] = useState('');
  const [cycle, setCycle] = useState('2025-2026');

  // Login Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setError('');
    
    if (activeTab === 'staff') {
        // --- STAFF LOGIN ---
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
    } else {
        // --- STUDENT LOGIN ---
        // 1. Buscar alumno por CURP (Username input)
        // Convertimos a mayúsculas para asegurar coincidencia
        const curpInput = username.trim().toUpperCase();
        const student = studentsData.find(s => s.id === curpInput);
        
        if (student) {
            // 2. Validar Contraseña (Case sensitive)
            const studentPassword = student.password || "1234"; // Default fallback
            
            if (password === studentPassword) {
                // 3. Crear usuario temporal de sesión
                const studentUser: User = {
                    id: student.id, // ID is CURP string
                    name: student.name,
                    username: student.id,
                    role: 'student', // Special role
                    password: '', 
                    permissions: {
                        canViewDashboard: false,
                        canViewStudents: false,
                        canEditGrades: false,
                        canViewReports: true, // Only reports
                        canManageStaff: false,
                        canManageSchedules: false,
                        canManageSubjects: false,
                        canManagePeriods: false,
                        canAccessSubdirection: false,
                        canTakeAttendance: false,
                        canConfigure: false
                    }
                };
                onLogin(studentUser, cycle);
            } else {
                setError('Contraseña incorrecta.');
            }
        } else {
            setError('CURP no encontrada en el sistema.');
        }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-emerald-600 p-8 text-center">
          <div className="bg-white w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg p-2">
            <img src={LOGO_URL} alt="Logo Escuela" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-white">Escuela Secundaria 27</h1>
          <p className="text-emerald-100 mt-2">Sistema de Gestión Escolar</p>
        </div>
        
        {/* TABS */}
        <div className="flex border-b border-slate-200">
            <button 
                onClick={() => { setActiveTab('staff'); setError(''); setUsername(''); setPassword(''); }}
                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'staff' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                <Users size={18}/> Personal Escolar
            </button>
            <button 
                onClick={() => { setActiveTab('student'); setError(''); setUsername(''); setPassword(''); }}
                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'student' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                <GraduationCap size={18}/> Alumnos
            </button>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {activeTab === 'staff' && (
                <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Ciclo Escolar</label>
                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                    <select 
                        value={cycle}
                        onChange={(e) => setCycle(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all bg-white appearance-none disabled:bg-slate-100 disabled:text-slate-500"
                        disabled={isLoading}
                    >
                        <option value="2025-2026">2025-2026</option>
                    </select>
                </div>
                </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                  {activeTab === 'staff' ? 'Usuario' : 'CURP del Alumno'}
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all disabled:bg-slate-100 disabled:text-slate-500 uppercase"
                  placeholder={activeTab === 'staff' ? "Ingresa tu usuario" : "Ingresa tu CURP"}
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                  Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all disabled:bg-slate-100 disabled:text-slate-500"
                  placeholder={activeTab === 'staff' ? "••••••••" : "Contraseña asignada"}
                  disabled={isLoading}
                />
              </div>
              {activeTab === 'student' && <p className="text-[10px] text-slate-400 mt-1 text-right">Solicita tu contraseña a tu profesor tutor.</p>}
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center justify-center">
                {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className={`w-full bg-slate-900 text-white py-3 rounded-xl font-bold transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2 ${isLoading ? 'opacity-70 cursor-wait' : 'hover:bg-slate-800'}`}
            >
              {isLoading && <Loader2 className="animate-spin" size={20} />}
              {isLoading ? 'Conectando...' : (activeTab === 'staff' ? 'Iniciar Sesión' : 'Consultar Boleta')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
