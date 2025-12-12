

import React, { useState, useEffect } from 'react';
import { Building2, CloudOff, Cloud, AlertCircle, ShieldAlert } from 'lucide-react';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import DashboardView from './components/DashboardView';
import GradeSelectionView from './components/GradeSelectionView';
import StudentsView from './components/StudentsView';
import GradeRegistrationView from './components/GradeRegistrationView';
import LoginView from './components/LoginView';
import ReportsView from './components/ReportsView';
import TeachersView from './components/TeachersView';
import GradeControlView from './components/GradeControlView';
import SubdireccionView from './components/SubdireccionView';
import SubjectsConfigView from './components/SubjectsConfigView'; 
import SchedulesView from './components/SchedulesView'; 
import ConfigView from './components/ConfigView';
import AttendanceView from './components/AttendanceView';
import { SchoolData, PageId, User, SubjectAssignment } from './types';
import { generateInitialData, getPermissionsByRole, DEFAULT_ROLES } from './utils';
import { saveToFirebase, subscribeToData, getDb } from './firebaseClient';

export default function App() {
  // Auth State
  const [user, setUser] = useState<User | null>(null);

  // App State
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null); // Added Group State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentCycle, setCurrentCycle] = useState('2025-2026');
  
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [cloudError, setCloudError] = useState<string | null>(null);
  
  // ESTADO DE CARGA INICIAL
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Global state for school data
  const [schoolData, setSchoolData] = useState<SchoolData>(generateInitialData());

  // --- HELPER: Hydrate permissions if missing (Backward Compatibility) ---
  const hydrateData = (data: Partial<SchoolData>): SchoolData => {
      const defaultData = generateInitialData();
      
      // Hydrate users with permissions
      const users = (data.users || defaultData.users).map(u => {
          if (!u.permissions) {
              return { ...u, permissions: getPermissionsByRole(u.role) };
          }
          return u;
      });

      // Ensure roles exist
      const roles = data.roles && data.roles.length > 0 ? data.roles : defaultData.roles;

      return {
          ...defaultData,
          ...data,
          users,
          roles,
          visitLogs: data.visitLogs || [],
          minutas: data.minutas || [],
          citations: data.citations || [],
          schedules: data.schedules || [],
          attendance: data.attendance || [], // Hydrate attendance
          studentsData: data.studentsData || defaultData.studentsData,
          periodDeadlines: data.periodDeadlines || {},
          sabanaLayout: data.sabanaLayout || defaultData.sabanaLayout,
          allowedPeriods: data.allowedPeriods || defaultData.allowedPeriods,
          events: data.events || defaultData.events,
          // Ensure new fields exist if loading old data
          subdirectorGestion: data.subdirectorGestion || defaultData.subdirectorGestion,
          subdirectorAcademico: data.subdirectorAcademico || defaultData.subdirectorAcademico
      };
  };

  // --- CARGA DE DATOS ---
  useEffect(() => {
    // 1. Verificar si hay Firebase configurado
    if (getDb()) {
        setIsCloudConnected(true);
        console.log("Conectado a Firebase. Suscribiendo a cambios...");
        
        const unsubscribe = subscribeToData(
            (newData) => {
                setCloudError(null);
                if (newData) {
                    const mergedData = hydrateData(newData);
                    setSchoolData(mergedData);
                    
                    // If current user exists in updated data, update their permissions reference
                    if (user) {
                        const updatedUser = mergedData.users.find(u => u.id === user.id);
                        if (updatedUser) setUser(updatedUser);
                    }

                    localStorage.setItem('school_data_local', JSON.stringify(mergedData));
                }
                setIsInitialLoading(false); // Datos cargados
            },
            (error) => {
                console.error("Error leyendo Firebase:", error);
                if (error.code === 'permission-denied') {
                    setCloudError("ACCESO DENEGADO: Revisa reglas de Firebase.");
                } else {
                    setCloudError("Error de conexión.");
                }
                setIsInitialLoading(false); // Permitir entrar aunque falle (modo offline)
            }
        );
        return () => unsubscribe();
    } else {
        // 2. Modo Local
        console.log("Modo Local. Cargando de LocalStorage.");
        const savedData = localStorage.getItem('school_data_local');
        if (savedData) {
            try {
                const parsedData = JSON.parse(savedData);
                const mergedData = hydrateData(parsedData);
                setSchoolData(mergedData);
            } catch (e) {
                console.error("Error cargando datos locales:", e);
            }
        }
        setIsInitialLoading(false);
    }
  }, []);

  // --- AUTOMATIC PERIOD CLOSING LOGIC ---
  useEffect(() => {
    const checkDeadlines = () => {
      if (!schoolData.periodDeadlines) return;
      const now = new Date();
      const cdmxOptions: Intl.DateTimeFormatOptions = { 
          timeZone: "America/Mexico_City", 
          year: 'numeric', month: 'numeric', day: 'numeric', 
          hour: 'numeric', minute: 'numeric', second: 'numeric', 
          hour12: false 
      };
      const cdmxString = new Intl.DateTimeFormat('en-US', cdmxOptions).format(now);
      const cdmxDate = new Date(cdmxString);

      let hasChanges = false;
      let newAllowed = [...(schoolData.allowedPeriods || [])];

      Object.entries(schoolData.periodDeadlines).forEach(([key, deadlineStr]) => {
         if (!deadlineStr) return;
         if (!newAllowed.includes(key)) return;
         const deadlineDate = new Date(deadlineStr as string);
         if (cdmxDate >= deadlineDate) {
             newAllowed = newAllowed.filter(p => p !== key);
             hasChanges = true;
         }
      });

      if (hasChanges) {
          handleUpdateData({
              ...schoolData,
              allowedPeriods: newAllowed
          });
      }
    };
    const interval = setInterval(checkDeadlines, 10000);
    return () => clearInterval(interval);
  }, [schoolData.allowedPeriods, schoolData.periodDeadlines]);

  const handleLogin = (loggedInUser: User, cycle: string) => {
    // Ensure permissions exist even on login
    const userWithPerms = {
        ...loggedInUser,
        permissions: loggedInUser.permissions || getPermissionsByRole(loggedInUser.role)
    };
    setUser(userWithPerms);
    setCurrentCycle(cycle);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('dashboard');
    setSelectedGrade(null);
    setSelectedGroup(null);
  };

  const handleNavigate = (page: PageId) => {
    setCurrentPage(page);
    if (['dashboard', 'grades', 'grade-registration', 'teachers', 'subdireccion', 'reports', 'grade-control', 'subjects-config', 'schedules', 'attendance', 'config'].includes(page)) {
      setSelectedGrade(null);
      setSelectedGroup(null);
    }
  };

  const handleSelectGradeForList = (grade: string, group?: string) => {
    setSelectedGrade(grade);
    setSelectedGroup(group || 'A');
    setCurrentPage('students-list');
  };

  const handleChangeStudentContext = (grade: string, group: string) => {
    setSelectedGrade(grade);
    setSelectedGroup(group);
  };

  const handleUpdateData = (newData: SchoolData) => {
    // Ensure data being saved has users with permissions
    const sanitizedData = {
        ...newData,
        users: newData.users.map(u => {
             if (!u.permissions) {
                  return { ...u, permissions: getPermissionsByRole(u.role) };
             }
             return u;
        })
    };

    setSchoolData(sanitizedData);
    localStorage.setItem('school_data_local', JSON.stringify(sanitizedData));
    if (isCloudConnected) {
        saveToFirebase(sanitizedData).catch(err => {
            console.error("Fallo al guardar en nube:", err);
            if (err.code === 'permission-denied') {
                setCloudError("ERROR AL GUARDAR: Permisos insuficientes.");
            } else {
                setCloudError("Error de conexión al guardar.");
            }
        });
    }
  };

  const handleCycleChange = (newCycle: string) => {
      setCurrentCycle(newCycle);
  }

  if (!user) {
    return <LoginView onLogin={handleLogin} users={schoolData.users || []} isLoading={isInitialLoading} />;
  }

  // --- RENDER PAGE FUNCTION ---
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <DashboardView data={schoolData} onNavigate={handleNavigate} currentUser={user} onUpdateData={handleUpdateData} />;
      case 'grades': return <GradeSelectionView data={schoolData} onSelectGrade={handleSelectGradeForList} title="Directorio de Alumnos" subtitle="Selecciona un grupo." />;
      case 'students-list': return (selectedGrade && selectedGroup) ? <StudentsView grade={selectedGrade} group={selectedGroup} data={schoolData} onBack={() => handleNavigate('grades')} onChangeContext={handleChangeStudentContext} onUpdateData={handleUpdateData} /> : null;
      case 'grade-registration': return user.role === 'secretaria' ? <div className="p-8 text-red-500">Acceso Restringido</div> : <GradeRegistrationView currentUser={user} data={schoolData} onBack={() => handleNavigate('dashboard')} onUpdateData={handleUpdateData} />;
      case 'reports': return <ReportsView data={schoolData} currentUser={user} currentCycle={currentCycle} />;
      case 'teachers': return <TeachersView data={schoolData} onUpdateData={handleUpdateData} currentUser={user} />;
      case 'schedules': return <SchedulesView data={schoolData} onUpdateData={handleUpdateData} currentUser={user} currentCycle={currentCycle} />;
      case 'subjects-config': return <SubjectsConfigView data={schoolData} onUpdateData={handleUpdateData} />;
      case 'grade-control': return <GradeControlView data={schoolData} onUpdateData={handleUpdateData} currentCycle={currentCycle} onCycleChange={handleCycleChange} />;
      case 'subdireccion': return <SubdireccionView data={schoolData} onUpdateData={handleUpdateData} currentUser={user} currentCycle={currentCycle} />;
      case 'attendance': return <AttendanceView data={schoolData} onUpdateData={handleUpdateData} currentUser={user} onBack={() => handleNavigate('dashboard')} />;
      case 'config': return <ConfigView data={schoolData} onUpdateData={handleUpdateData} currentUser={user} />;
      default: return <div>Página no encontrada</div>;
    }
  };

  return (
    <div className="flex h-screen font-sans bg-slate-50 overflow-hidden">
      <Sidebar onNavigate={handleNavigate} currentPage={currentPage} onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} isCollapsed={isSidebarCollapsed} user={user} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav onNavigate={handleNavigate} />
        <main className="flex-1 overflow-y-auto scroll-smooth">
            <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 p-4 sticky top-0 z-20 hidden md:flex justify-between items-center print:hidden">
                <div className="flex items-center text-sm text-slate-500">
                   <span className="font-medium text-slate-800 mr-2">{schoolData.name} <span className="text-emerald-600 font-bold bg-emerald-50 px-2 rounded">v5.2</span></span>
                   <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-bold mr-2">Ciclo: {currentCycle}</span>
                   {isCloudConnected ? (
                       <span className="text-green-600 text-xs flex items-center font-bold"><Cloud size={14} className="mr-1"/> En línea</span>
                   ) : (
                       <span className="text-slate-400 text-xs flex items-center"><CloudOff size={14} className="mr-1"/> Local</span>
                   )}
                </div>
                <div className="flex items-center space-x-4">
                    {cloudError && (
                        <div className="text-xs text-white font-bold flex items-center bg-red-600 px-3 py-1 rounded-full animate-pulse shadow-md">
                            <ShieldAlert size={16} className="mr-2"/> {cloudError}
                        </div>
                    )}
                    <div className="text-right">
                        <p className="text-sm font-bold text-slate-800">{user.name}</p>
                        <p className="text-xs text-slate-500 uppercase">{user.role}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold bg-blue-600">
                        {user.username.charAt(0).toUpperCase()}
                    </div>
                </div>
            </header>
            <div className="animate-fade-in-up h-full">{renderPage()}</div>
        </main>
      </div>
    </div>
  );
}