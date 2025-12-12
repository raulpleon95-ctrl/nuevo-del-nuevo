import React from 'react';
import { Home, Users, Building2, Briefcase, LogOut, Menu, Book, X, FileText, Lock, Library, CalendarDays, Settings, CalendarCheck, GraduationCap, ListPlus } from 'lucide-react';
import { PageId, User } from '../types';
import { getPermissionsByRole } from '../utils';

interface SidebarProps {
  onNavigate: (page: PageId) => void;
  currentPage: PageId;
  onToggle: () => void;
  isCollapsed: boolean;
  user: User;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onNavigate, currentPage, onToggle, isCollapsed, user, onLogout }) => {
  
  const getNavItems = () => {
    // Use permissions from user object, or fallback if missing (legacy)
    const perms = user.permissions || getPermissionsByRole(user.role);

    // Parche visual de seguridad: Asegurar que roles clave vean asistencia
    const canAttendance = perms.canTakeAttendance || ['admin', 'teacher', 'subdirector', 'administrative', 'subdirector_gestion', 'subdirector_academico'].includes(user.role);

    const items = [
        { id: 'dashboard', label: 'Dashboard', icon: <Home size={20} />, allowed: perms.canViewDashboard },
        { id: 'attendance', label: 'Asistencia Diaria', icon: <CalendarCheck size={20} />, allowed: canAttendance },
        { id: 'grades', label: 'Alumnos y Grupos', icon: <GraduationCap size={20} />, allowed: perms.canViewStudents }, 
        { id: 'grade-registration', label: 'Calificaciones', icon: <ListPlus size={20} />, allowed: perms.canEditGrades },
        { id: 'reports', label: 'Formatos y Listas', icon: <FileText size={20} />, allowed: perms.canViewReports },
        { id: 'teachers', label: 'Personal', icon: <Users size={20} />, allowed: perms.canManageStaff },
        { id: 'schedules', label: 'Horarios', icon: <CalendarDays size={20} />, allowed: perms.canManageSchedules },
        { id: 'subjects-config', label: 'Asignaturas', icon: <Library size={20} />, allowed: perms.canManageSubjects },
        { id: 'grade-control', label: 'Control de Periodos', icon: <Lock size={20} />, allowed: perms.canManagePeriods }, 
        { id: 'subdireccion', label: 'Subdirección', icon: <Building2 size={20} />, allowed: perms.canAccessSubdirection }, 
        { id: 'config', label: 'Configuración', icon: <Settings size={20} />, allowed: perms.canConfigure },
    ];
    
    return items.filter(item => item.allowed);
  };

  const navItems = getNavItems();

  // Determine if a main section is active
  const isActive = (itemId: string) => {
    if (currentPage === itemId) return true;
    if (itemId === 'grades' && currentPage === 'students-list') return true;
    if (itemId === 'grade-registration' && (currentPage === 'subjects-selection' || currentPage === 'grade-entry' || currentPage === 'teacher-classes')) return true;
    return false;
  };

  return (
    <aside 
      className={`bg-emerald-900 text-white transition-all duration-300 ease-in-out flex flex-col fixed md:relative z-30 h-full
        ${isCollapsed ? 'w-20' : 'w-64'} hidden md:flex shadow-xl print:hidden`}
    >
      <div className="flex items-center justify-between p-5 border-b border-emerald-800 h-20">
        {!isCollapsed && (
          <div className="flex flex-col animate-fade-in">
            <h1 className="text-sm font-bold leading-tight text-white">Esc. Sec. Dna. No. 27</h1>
            <span className="text-[10px] text-emerald-200 truncate max-w-[150px] uppercase">Alfredo E. Uruchurtu</span>
          </div>
        )}
        <button 
          onClick={onToggle} 
          className="p-2 rounded-lg hover:bg-emerald-800 text-emerald-200 hover:text-white transition-colors"
        >
          {isCollapsed ? <Menu size={24} /> : <X size={20} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-3">
        <ul className="space-y-2">
          {navItems.map(item => (
            <li key={item.id}>
              <button
                onClick={() => onNavigate(item.id as PageId)}
                className={`flex items-center space-x-3 w-full p-3 rounded-xl transition-all duration-200 group
                  ${isActive(item.id) 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
                    : 'text-emerald-100/70 hover:bg-emerald-800 hover:text-white'
                  }`}
                title={isCollapsed ? item.label : ''}
              >
                <div className={`${isActive(item.id) ? 'text-white' : 'text-emerald-300 group-hover:text-white'}`}>
                  {item.icon}
                </div>
                {!isCollapsed && (
                  <span className="font-medium text-sm truncate tracking-wide">
                    {item.label}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="p-4 border-t border-emerald-800">
        <button 
            onClick={onLogout}
            className="flex items-center space-x-3 w-full p-3 text-red-300 hover:bg-red-900/20 rounded-xl transition-colors duration-200"
        >
          <LogOut size={20} className="flex-shrink-0" />
          {!isCollapsed && <span className="font-medium text-sm truncate">Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;