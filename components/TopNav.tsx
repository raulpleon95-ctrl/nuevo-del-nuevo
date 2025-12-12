
import React, { useState } from 'react';
import { Home, GraduationCap, Building2, Briefcase, Menu, Book, X, FileText } from 'lucide-react';
import { PageId } from '../types';

interface TopNavProps {
  onNavigate: (page: PageId) => void;
}

const TopNav: React.FC<TopNavProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Simplified for mobile
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home size={18} /> },
    { id: 'grades', label: 'Alumnos', icon: <GraduationCap size={18} /> },
    { id: 'grade-registration', label: 'Calificaciones', icon: <Book size={18} /> },
    { id: 'reports', label: 'Formatos', icon: <FileText size={18} /> },
    { id: 'subdireccion', label: 'Subdirección', icon: <Briefcase size={18} /> },
  ];

  return (
    <header className="bg-slate-900 text-white p-4 flex justify-between items-center md:hidden sticky top-0 z-50 shadow-md print:hidden">
      <div className="flex items-center space-x-2">
        <GraduationCap className="text-blue-500" />
        <div className="flex flex-col">
            <h1 className="text-sm font-bold leading-none">Esc. Sec. 27</h1>
            <span className="text-[10px] text-slate-400 leading-none">Alfredo E. Uruchurtu</span>
        </div>
      </div>
      <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-slate-300 hover:text-white focus:outline-none">
        {isOpen ? <X /> : <Menu />}
      </button>
      
      {/* Mobile Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-slate-800 border-t border-slate-700 shadow-xl animate-slide-down">
          <ul className="py-2 px-4 space-y-1">
            {navItems.map(item => (
              <li key={item.id}>
                <button
                  onClick={() => { onNavigate(item.id as PageId); setIsOpen(false); }}
                  className="flex items-center space-x-4 w-full p-4 text-slate-300 hover:bg-slate-700 rounded-xl transition-colors"
                >
                  <div className="flex-shrink-0 text-blue-400">{item.icon}</div>
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
};

export default TopNav;