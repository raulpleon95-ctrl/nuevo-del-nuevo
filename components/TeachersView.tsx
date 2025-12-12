
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Shield, User as UserIcon, Save, X, Book, Briefcase, Cpu, Pencil, Clipboard, Users, Wifi, FlaskConical, HandHelping, Clock, FileText, ArrowLeft, Printer, FolderHeart, CheckSquare, Square, Settings, Upload } from 'lucide-react';
import { SchoolData, User, SubjectAssignment, UserPermissions, RoleDefinition } from '../types';
import { WEEK_DAYS, getPermissionsByRole, DEFAULT_ROLES } from '../utils';

// Constantes visuales
const SEP_LOGO_URL = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSDxcKIcMNGVUxi6N-EpVbrw1Y7HNcrm2FqqQ&s"; 
const AEF_LOGO_URL = "https://framework-gb.cdn.gob.mx/landing/img/logoheader.svg"; // Placeholder for AEF Logo if needed

interface TeachersViewProps {
  data: SchoolData;
  onUpdateData: (newData: SchoolData) => void;
  currentUser?: User; // Optional prop to filter view
}

const TeachersView: React.FC<TeachersViewProps> = ({ data, onUpdateData, currentUser }) => {
  const [showModal, setShowModal] = useState(false);
  const [showRoleManager, setShowRoleManager] = useState(false); // Modal de Roles
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  
  // Estado para la "Hoja de Datos"
  const [hojaDatosTarget, setHojaDatosTarget] = useState<User | null>(null);

  // Form State (Main User)
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<string>('teacher');
  const [assignments, setAssignments] = useState<SubjectAssignment[]>([]);
  const [workSchedule, setWorkSchedule] = useState<Record<string, string>>({});
  
  // Form State (Permissions)
  const [permissions, setPermissions] = useState<UserPermissions>(getPermissionsByRole('teacher'));

  // Assignment Form State
  const [assignGrade, setAssignGrade] = useState(data.gradesStructure[0].grade);
  const [assignGroup, setAssignGroup] = useState('A'); 
  const [assignSubject, setAssignSubject] = useState(data.gradesStructure[0].subjects[0]);
  const [assignTech, setAssignTech] = useState('');

  // Estados Locales para Hoja de Datos (Campos del formulario) - INICIALIZACIÓN SEGURA
  const [hdPersonal, setHdPersonal] = useState<any>({
      rfc: '', curp: '', filiacion: '', civilStatus: '', birthDate: '', birthPlace: '',
      address: { street: '', extNum: '', intNum: '', colonia: '', alcaldia: '', postalCode: '', phone: '', cellphone: '', email: '' }
  });
  
  // Split name state for visual alignment
  const [hdNameParts, setHdNameParts] = useState({ paterno: '', materno: '', nombres: '' });

  const [hdSchooling, setHdSchooling] = useState<any>({
      lastDegree: '', institution: '', isPasante: '', isTitled: '', cedula: '', cedulaDate: '', specialization: ''
  });
  const [hdLabor, setHdLabor] = useState<any>({
      keys: Array(6).fill(''), lastOrderDate: '', previousSchools: '', admissionDateGov: '', admissionDateSep: '', admissionDateCses: '', yearsService: '', otherJob: 'NO', entryDate: '',
      cargo: '', especialidad: '',
      otherJobName: '', otherJobCategory: '', otherJobKey: '', otherJobStartDate: ''
  });
  // Estado para Ciclo Escolar Editable en Hoja de Datos
  const [hdCycle, setHdCycle] = useState('');
  const [hdFooterDate, setHdFooterDate] = useState('');

  // --- ROLE MANAGER STATE ---
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleRequiresAssignments, setRoleRequiresAssignments] = useState(false);
  const [rolePermissions, setRolePermissions] = useState<UserPermissions>(getPermissionsByRole(''));

  // --- PERMISOS ---
  // 1. Gestión de Cuentas (Crear/Borrar usuarios, cambiar rol): SOLO Director (admin) y Subdirector
  const canManageUsers = currentUser && ['admin', 'subdirector'].includes(currentUser.role);
  
  // 2. Visualización Global (Ver lista de todos): Director, Subdirector, Secretaria.
  // IMPORTANTE: Otros roles (docentes, admin, apoyo) solo pueden verse a sí mismos aunque tengan canManageStaff=true
  const canViewAll = currentUser && ['admin', 'subdirector', 'secretaria'].includes(currentUser.role);

  const currentRoleDef = data.roles.find(r => r.id === role);
  const isStaffRole = !currentRoleDef?.requiresAssignments && role !== 'admin';

  // Filtrar usuarios visibles
  const visibleUsers = canViewAll 
    ? data.users 
    : data.users.filter(u => u.id === currentUser?.id);

  const getSystemDate = () => {
      const today = new Date();
      return today.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Initialize Hoja de Datos Form - FUSIÓN SEGURA (DEEP MERGE)
  useEffect(() => {
      if (hojaDatosTarget) {
          // Fusionar datos personales asegurando que address exista
          setHdPersonal({
              rfc: '', curp: '', filiacion: '', civilStatus: '', birthDate: '', birthPlace: '',
              ...(hojaDatosTarget.personalData || {}),
              address: { 
                  street: '', extNum: '', intNum: '', colonia: '', alcaldia: '', postalCode: '', phone: '', cellphone: '', email: '',
                  ...(hojaDatosTarget.personalData?.address || {}) 
              }
          });

          // Parse Name for split fields
          const nameParts = hojaDatosTarget.name.split(' ');
          // Basic heuristic: First token = Paterno, Second = Materno, Rest = Nombres
          // This allows editing.
          if (nameParts.length > 0) {
              setHdNameParts({
                  paterno: nameParts[0] || '',
                  materno: nameParts[1] || '',
                  nombres: nameParts.slice(2).join(' ') || ''
              });
          } else {
               setHdNameParts({ paterno: '', materno: '', nombres: '' });
          }

          // Fusionar datos escolares
          setHdSchooling({
              lastDegree: '', institution: '', isPasante: '', isTitled: '', cedula: '', cedulaDate: '', specialization: '',
              ...(hojaDatosTarget.schoolingData || {})
          });

          // Fusionar datos laborales
          setHdLabor({
              keys: (hojaDatosTarget.laborData?.keys && hojaDatosTarget.laborData.keys.length > 0) ? hojaDatosTarget.laborData.keys : Array(6).fill(''), 
              lastOrderDate: '', previousSchools: '', admissionDateGov: '', admissionDateSep: '', admissionDateCses: '', yearsService: '', otherJob: 'NO', entryDate: '',
              cargo: '', especialidad: '',
              otherJobName: '', otherJobCategory: '', otherJobKey: '', otherJobStartDate: '',
              ...(hojaDatosTarget.laborData || {})
          });

          // Inicializar ciclo escolar (Preferencia: Dato Guardado > Dato Global > Default)
          setHdCycle(hojaDatosTarget.hojaDatosCycle || data.currentCycle || '2025-2026');
          
          // Auto-set Today's Date
          setHdFooterDate(getSystemDate());
      }
  }, [hojaDatosTarget, data.currentCycle]);

  // Reset assignment inputs
  useEffect(() => {
     if (assignSubject === 'Tecnología') {
         setAssignGroup('AC');
     } else {
         const availableGroups = data.gradesStructure.find(g => g.grade === assignGrade)?.groups || [];
         if (availableGroups.length > 0) setAssignGroup(availableGroups[0]);
     }
  }, [assignSubject, assignGrade, data.gradesStructure]);

  // --- ACTIONS ---

  const handleDeleteUser = (id: string) => {
    if (!canManageUsers) return;
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
      onUpdateData({
        ...data,
        users: data.users.filter(u => u.id !== id)
      });
    }
  };

  const handleEditUser = (user: User) => {
    // Solo permitir edición si tienes permisos de admin O es tu propio usuario
    if (!canManageUsers && user.id !== currentUser?.id) return;

    setEditingUserId(user.id);
    setName(user.name);
    setUsername(user.username);
    setPassword(user.password || '');
    setRole(user.role);
    setAssignments(user.assignments ? [...user.assignments] : []);
    
    // Load permissions
    if (user.permissions) {
        setPermissions(user.permissions);
    } else {
        const def = data.roles.find(r => r.id === user.role);
        setPermissions(def ? def.permissions : getPermissionsByRole(user.role));
    }
    
    const initialSchedule: Record<string, string> = {};
    WEEK_DAYS.forEach(day => {
        initialSchedule[day] = user.workSchedule?.[day] || '';
    });
    setWorkSchedule(initialSchedule);

    setShowModal(true);
  };

  // Helper to update role and reset permissions to defaults for that role
  const handleRoleChange = (newRoleId: string) => {
      setRole(newRoleId);
      const roleDef = data.roles.find(r => r.id === newRoleId);
      if (roleDef) {
          setPermissions(roleDef.permissions);
      }
  }

  const handleAddAssignment = () => {
    // Si el rol es tipo administrativo, forzamos la "Asignatura" a un valor interno
    const effectiveSubject = currentRoleDef?.isSystem && role === 'administrative' ? 'Administrativo' : assignSubject;

    if (effectiveSubject === 'Tecnología') {
        if (!assignTech) {
            alert("Debes seleccionar un taller específico.");
            return;
        }
        let groupsToAdd: string[] = [];
        if (assignGroup === 'AC') groupsToAdd = ['A', 'C'];
        else if (assignGroup === 'BD') groupsToAdd = ['B', 'D'];
        else groupsToAdd = [assignGroup];

        const newAssignments: SubjectAssignment[] = [];
        groupsToAdd.forEach(group => {
            const exists = assignments.some(a => a.grade === assignGrade && a.group === group && a.subject === effectiveSubject);
            if (!exists) newAssignments.push({ grade: assignGrade, group, subject: effectiveSubject, technology: assignTech });
        });
        if (newAssignments.length > 0) setAssignments([...assignments, ...newAssignments]);
    } else {
        const exists = assignments.some(a => a.grade === assignGrade && a.group === assignGroup && a.subject === effectiveSubject);
        if (!exists) setAssignments([...assignments, { grade: assignGrade, group: assignGroup, subject: effectiveSubject }]);
    }
  };

  const removeAssignment = (index: number) => setAssignments(assignments.filter((_, i) => i !== index));

  const handleScheduleChange = (day: string, value: string) => setWorkSchedule(prev => ({ ...prev, [day]: value }));

  const handleCreateOrUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username || !password) return;

    // Permitimos asignaciones si el rol lo requiere (Docentes/Admins)
    const finalAssignments = (currentRoleDef?.requiresAssignments) ? assignments : undefined;
    const finalWorkSchedule = isStaffRole ? workSchedule : undefined;

    if (editingUserId) {
        const updatedUsers = data.users.map(u => {
            if (u.id === editingUserId) {
                return { 
                    ...u, 
                    name, username, password, role, 
                    permissions, // Save customized permissions
                    assignments: finalAssignments, 
                    workSchedule: finalWorkSchedule 
                };
            }
            return u;
        });
        let updatedData = { ...data, users: updatedUsers };
        if (role === 'subdirector') updatedData = { ...updatedData, subdirector: name };
        onUpdateData(updatedData);
    } else {
        const newUser: User = {
            id: Date.now().toString(),
            name, username, password, role,
            permissions, // Save customized permissions
            assignments: finalAssignments,
            workSchedule: finalWorkSchedule
        };
        let updatedData = { ...data, users: [...data.users, newUser] };
        if (role === 'subdirector') updatedData = { ...updatedData, subdirector: name };
        onUpdateData(updatedData);
    }
    resetForm();
  };

  // --- ROLE MANAGER ACTIONS ---
  
  const handleEditRole = (roleDef: RoleDefinition) => {
      setEditingRoleId(roleDef.id);
      setRoleName(roleDef.name);
      setRoleRequiresAssignments(!!roleDef.requiresAssignments);
      setRolePermissions(roleDef.permissions);
  };

  const handleCreateRole = () => {
      setEditingRoleId(null);
      setRoleName('');
      setRoleRequiresAssignments(false);
      setRolePermissions(getPermissionsByRole('')); // Default all false
  };

  const handleSaveRole = () => {
      if (!roleName) return;
      const roleId = editingRoleId || `custom_${Date.now()}`;
      
      const newRoleDef: RoleDefinition = {
          id: roleId,
          name: roleName,
          requiresAssignments: roleRequiresAssignments,
          permissions: rolePermissions,
          isSystem: false // Custom roles are not system roles
      };

      const updatedRoles = editingRoleId 
          ? data.roles.map(r => r.id === roleId ? { ...newRoleDef, isSystem: r.isSystem } : r)
          : [...data.roles, newRoleDef];

      onUpdateData({ ...data, roles: updatedRoles });
      setEditingRoleId(null);
      setRoleName('');
  };

  const handleDeleteRole = (id: string) => {
      if (confirm('¿Eliminar este rol? Los usuarios con este rol podrían perder acceso.')) {
          onUpdateData({ ...data, roles: data.roles.filter(r => r.id !== id) });
      }
  };

  const resetForm = () => {
    setName('');
    setUsername('');
    setPassword('');
    setRole('teacher');
    setAssignments([]);
    setWorkSchedule({});
    setEditingUserId(null);
    setShowModal(false);
    setPermissions(getPermissionsByRole('teacher'));
  };

  // --- HOJA DE DATOS ACTIONS ---
  
  const handlePersonalChange = (field: keyof typeof hdPersonal, value: string) => {
      setHdPersonal({ ...hdPersonal, [field]: value.toUpperCase() });
  };

  const handleAddressChange = (field: string, value: string) => {
      setHdPersonal({
          ...hdPersonal,
          address: { ...hdPersonal.address, [field]: value.toUpperCase() }
      });
  };

  const handleSchoolingChange = (field: keyof typeof hdSchooling, value: string) => {
      setHdSchooling({ ...hdSchooling, [field]: value.toUpperCase() });
  };

  const handleLaborChange = (field: keyof typeof hdLabor, value: string) => {
      setHdLabor({ ...hdLabor, [field]: value.toUpperCase() });
  };

  // Switch for "Declaro bajo protesta"
  const handleOtherJobChange = (val: 'SI' | 'NO') => {
      setHdLabor({ 
          ...hdLabor, 
          otherJob: val,
          // Clear fields if NO is selected
          otherJobName: val === 'NO' ? '' : hdLabor.otherJobName,
          otherJobCategory: val === 'NO' ? '' : hdLabor.otherJobCategory,
          otherJobKey: val === 'NO' ? '' : hdLabor.otherJobKey,
          otherJobStartDate: val === 'NO' ? '' : hdLabor.otherJobStartDate,
      });
  };

  const handleSaveHojaDatos = () => {
      if (!hojaDatosTarget) return;

      // Reconstruct full name from parts
      const fullName = `${hdNameParts.paterno} ${hdNameParts.materno} ${hdNameParts.nombres}`.trim().replace(/\s+/g, ' ');

      const updatedUsers = data.users.map(u => {
          if (u.id === hojaDatosTarget.id) {
              return {
                  ...u,
                  name: fullName, // Update main name
                  personalData: hdPersonal,
                  schoolingData: hdSchooling,
                  laborData: hdLabor,
                  hojaDatosCycle: hdCycle
              };
          }
          return u;
      });

      onUpdateData({ ...data, users: updatedUsers });
      alert("Hoja de Datos guardada correctamente.");
      setHojaDatosTarget(null); // Close view
  };

  const handlePrintHoja = () => {
      window.print();
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <style>{`
          @media print {
            @page {
              size: letter portrait;
              margin: 5mm;
            }
            /* Force Single Page Scaling for Hoja de Datos */
            .hoja-datos-container {
                transform: scale(0.90);
                transform-origin: top center;
                width: 100%;
            }
            .no-print { display: none !important; }
            body { -webkit-print-color-adjust: exact; }
          }
      `}</style>

      {/* --- VISTA PRINCIPAL: LISTA DE PERSONAL --- */}
      {!hojaDatosTarget && (
          <>
            <div className="flex justify-between items-center mb-8 no-print">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Gestión de Personal</h2>
                    <p className="text-slate-500">Administra cuentas, roles y asignaciones de docentes.</p>
                </div>
                
                <div className="flex gap-2">
                    {/* Solo el admin/subdirector puede gestionar roles y crear usuarios */}
                    {canManageUsers && (
                        <>
                            <button 
                                onClick={() => setShowRoleManager(true)}
                                className="flex items-center gap-2 bg-slate-700 text-white px-4 py-2 rounded-xl hover:bg-slate-800 shadow transition-colors"
                            >
                                <Settings size={20} /> Roles
                            </button>
                            <button 
                                onClick={() => { resetForm(); setShowModal(true); }}
                                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 shadow transition-colors"
                            >
                                <Plus size={20} /> Nuevo Usuario
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 no-print">
                {visibleUsers.map((user) => (
                <div key={user.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow relative group">
                    <div className="flex items-center space-x-4 mb-4">
                        <div className={`p-3 rounded-full ${['admin','subdirector'].includes(user.role) ? 'bg-amber-100 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                            {user.role === 'admin' ? <Shield size={24} /> : <UserIcon size={24} />}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">{user.name}</h3>
                            <p className="text-sm text-slate-500 capitalize">{data.roles.find(r => r.id === user.role)?.name || user.role}</p>
                        </div>
                    </div>
                    
                    <div className="space-y-2 mb-6">
                        <div className="flex items-center text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">
                            <span className="font-medium mr-2">Usuario:</span>
                            <code className="bg-white px-2 py-0.5 rounded border border-slate-200">{user.username}</code>
                        </div>
                        {user.assignments && user.assignments.length > 0 && (
                            <div className="flex items-center text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">
                                <Book size={16} className="mr-2 text-slate-400"/>
                                <span className="font-medium">{user.assignments.length} Grupos Asignados</span>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        {/* Botón Editar (Solo si tienes permiso o es tu usuario) */}
                        <button 
                            onClick={() => handleEditUser(user)}
                            className="flex-1 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-blue-600 transition-colors"
                        >
                            Editar
                        </button>
                        
                        {/* Botón Hoja de Datos (Disponible para todos sobre su propio usuario) */}
                        <button 
                            onClick={() => setHojaDatosTarget(user)}
                            className="flex-1 py-2 text-sm font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-900 transition-colors flex items-center justify-center gap-1"
                        >
                            <Clipboard size={14}/> Hoja Datos
                        </button>

                        {/* Botón Eliminar (Solo Admin/Sub) */}
                        {canManageUsers && (
                            <button 
                                onClick={() => handleDeleteUser(user.id)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Eliminar usuario"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                    </div>
                </div>
                ))}
            </div>
          </>
      )}

      {/* --- VISTA: HOJA DE DATOS (FORMULARIO OFICIAL) --- */}
      {hojaDatosTarget && (
          <div className="bg-white min-h-screen relative hoja-datos-container">
              {/* Toolbar */}
              <div className="no-print sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-slate-200 p-4 flex justify-between items-center mb-8 shadow-sm">
                  <div className="flex items-center gap-4">
                      <button onClick={() => setHojaDatosTarget(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-600"><ArrowLeft size={24}/></button>
                      <h2 className="text-xl font-bold text-slate-800">Hoja de Datos Personales</h2>
                  </div>
                  <div className="flex gap-3">
                      <button onClick={handleSaveHojaDatos} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 shadow"><Save size={18}/> Guardar</button>
                      <button onClick={handlePrintHoja} className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-900 shadow"><Printer size={18}/> Imprimir</button>
                  </div>
              </div>

              {/* FORMATO OFICIAL IMPRESO */}
              <div className="max-w-[215mm] mx-auto p-8 border border-slate-200 shadow-xl print:shadow-none print:border-none print:p-0 bg-white text-black font-sans text-[10px] leading-tight">
                  
                  {/* ENCABEZADO SEP / AEFCM */}
                  <div className="flex justify-between items-start mb-2">
                      <div className="text-[8px] font-bold text-slate-500 uppercase leading-snug w-2/3">
                          <p>Autoridad Educativa en la Ciudad de México</p>
                          <p>Dirección General de Operación de Servicios Educativos</p>
                          <p>Coordinación Sectorial de Educación Secundaria</p>
                          <p>Dirección Operativa No. 4 de Educación Secundaria</p>
                      </div>
                      <img src={AEF_LOGO_URL} alt="SEP" className="h-10 object-contain opacity-80" />
                  </div>

                  <h1 className="text-lg font-extrabold uppercase mb-0">HOJA DE DATOS</h1>
                  <h2 className="text-sm font-bold uppercase mb-1">ESCUELAS SECUNDARIAS GENERALES</h2>
                  <h2 className="text-sm font-bold uppercase mb-2">Y PARA TRABAJADORES</h2>
                  <h3 className="text-sm font-bold uppercase mb-4 border-b-2 border-black inline-block pr-12">CICLO ESCOLAR <input type="text" value={hdCycle} onChange={e => setHdCycle(e.target.value)} className="w-24 bg-transparent font-bold border-none focus:ring-0 p-0 text-sm uppercase text-black" /></h3>

                  {/* BLOQUE FOTO Y DATOS PLANTEL */}
                  <div className="flex border-2 border-black mb-4">
                      {/* FOTO AREA */}
                      <div className="w-[35mm] border-r-2 border-black flex flex-col items-center justify-center bg-slate-50 print:bg-white text-slate-300 font-bold relative overflow-hidden">
                          {hojaDatosTarget.personalData?.address?.email ? (
                              <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-200 rotate-45">FOTO</div>
                          ) : 'FOTO'}
                          <div className="absolute bottom-1 text-[8px] text-center w-full">Tamaño Infantil</div>
                      </div>

                      {/* DATOS PLANTEL GRID */}
                      <div className="flex-1">
                          {/* Row 1: Cargo / Especialidad */}
                          <div className="flex border-b border-black">
                              <div className="w-1/2 border-r border-black p-1 flex items-end">
                                  <span className="font-bold mr-2 w-12 text-[8px]">CARGO:</span>
                                  <input type="text" value={hdLabor.cargo} onChange={e => handleLaborChange('cargo', e.target.value)} className="flex-1 border-b border-slate-300 focus:border-blue-500 outline-none text-xs uppercase font-bold bg-transparent" />
                              </div>
                              <div className="w-1/2 p-1 flex items-end">
                                  <span className="font-bold mr-2 text-[8px]">ESPECIALIDAD:</span>
                                  <input type="text" value={hdLabor.especialidad} onChange={e => handleLaborChange('especialidad', e.target.value)} className="flex-1 border-b border-slate-300 focus:border-blue-500 outline-none text-xs uppercase font-bold bg-transparent" />
                              </div>
                          </div>

                          {/* Row 2: Dir Op, Zona, Alcaldia */}
                          <div className="flex border-b border-black">
                              <div className="w-[20%] border-r border-black p-1 flex items-center">
                                  <span className="font-bold text-[7px] mr-1 whitespace-nowrap">DIRECCIÓN OPERATIVA:</span>
                                  <span className="font-bold text-[9px]">4</span>
                              </div>
                              <div className="w-[20%] border-r border-black p-1 flex items-center">
                                  <span className="font-bold text-[7px] mr-1 whitespace-nowrap">ZONA ESCOLAR:</span>
                                  <span className="font-bold text-[9px]">069</span>
                              </div>
                              <div className="w-[60%] p-1 flex items-center">
                                  <span className="font-bold text-[7px] mr-1">ALCALDÍA:</span>
                                  <span className="font-bold text-[9px] uppercase">{data.alcaldia}</span>
                              </div>
                          </div>

                          {/* Row 3: ES, CCT, Nombre (FIXED OVERLAP HERE) */}
                          <div className="flex border-b border-black">
                              <div className="w-[15%] border-r border-black p-1 flex items-center">
                                  <span className="font-bold text-[7px] mr-1">ES-</span>
                                  <span className="font-bold text-[9px]">354 - 27</span>
                              </div>
                              <div className="w-[20%] border-r border-black p-1 flex items-center">
                                  <span className="font-bold text-[7px] mr-1">C.C.T.</span>
                                  <span className="font-bold text-[9px]">09DES4027P</span>
                              </div>
                              <div className="w-[65%] p-1 flex items-center">
                                  <span className="font-bold text-[7px] mr-1 whitespace-nowrap">NOMBRE DEL PLANTEL:</span>
                                  <span className="font-bold text-[9px] uppercase truncate">"ALFREDO E. URUCHURTU"</span>
                              </div>
                          </div>

                          {/* Row 4: Ubicacion Header */}
                          <div className="flex border-b border-black">
                              <div className="flex-1 p-1 flex items-end relative">
                                  <span className="font-bold mr-1 whitespace-nowrap text-[7px]">UBICACIÓN DEL PLANTEL:</span>
                                  <span className="font-bold text-[9px] uppercase border-b border-black flex-1 ml-1 pl-2">JOSÉ MORENO SALIDO</span>
                                  <span className="absolute right-1 bottom-1 font-bold text-[9px]">47</span>
                              </div>
                          </div>
                          
                          {/* Row 5: Ubicacion Details */}
                          <div className="flex text-center text-[9px]">
                              <div className="w-[30%] border-r border-black p-1">
                                  <div className="font-bold uppercase text-[9px]">BARRANCA SECA</div>
                                  <div className="border-t border-black mt-1 pt-0.5 italic text-[7px]">COLONIA</div>
                              </div>
                              <div className="w-[30%] border-r border-black p-1">
                                  <div className="font-bold uppercase text-[9px]">{data.alcaldia}</div>
                                  <div className="border-t border-black mt-1 pt-0.5 italic text-[7px]">ALCALDÍA</div>
                              </div>
                              <div className="w-[15%] border-r border-black p-1">
                                  <div className="font-bold uppercase text-[9px]">10580</div>
                                  <div className="border-t border-black mt-1 pt-0.5 italic text-[7px]">C.P.</div>
                              </div>
                              <div className="w-[25%] p-1">
                                  <div className="font-bold uppercase text-[9px]">5543177369</div>
                                  <div className="border-t border-black mt-1 pt-0.5 italic text-[7px]">TELÉFONO</div>
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* SECCION: DATOS PERSONALES */}
                  <div className="bg-yellow-100/50 border-y-2 border-yellow-300 print:bg-transparent print:border-transparent mb-2 text-center font-bold text-sm py-0.5 uppercase">
                      DATOS PERSONALES
                  </div>

                  <div className="space-y-2 mb-4">
                      {/* NOMBRE */}
                      <div className="flex items-end gap-2">
                          <span className="font-bold w-16 mb-1 text-[8px]">NOMBRE:</span>
                          <div className="flex-1 flex gap-4">
                              <div className="flex-1 flex flex-col">
                                  <input type="text" value={hdNameParts.paterno} onChange={e => setHdNameParts({...hdNameParts, paterno: e.target.value.toUpperCase()})} className="w-full border-b border-black outline-none text-center font-bold text-[9px] uppercase bg-transparent" />
                                  <span className="text-[7px] text-center italic">APELLIDO PATERNO</span>
                              </div>
                              <div className="flex-1 flex flex-col">
                                  <input type="text" value={hdNameParts.materno} onChange={e => setHdNameParts({...hdNameParts, materno: e.target.value.toUpperCase()})} className="w-full border-b border-black outline-none text-center font-bold text-[9px] uppercase bg-transparent" />
                                  <span className="text-[7px] text-center italic">APELLIDO MATERNO</span>
                              </div>
                              <div className="flex-1 flex flex-col">
                                  <input type="text" value={hdNameParts.nombres} onChange={e => setHdNameParts({...hdNameParts, nombres: e.target.value.toUpperCase()})} className="w-full border-b border-black outline-none text-center font-bold text-[9px] uppercase bg-transparent" />
                                  <span className="text-[7px] text-center italic">NOMBRE(S)</span>
                              </div>
                          </div>
                      </div>

                      {/* RFC / CURP / EDO CIVIL */}
                      <div className="flex items-end gap-4">
                          <div className="w-[25%] flex items-end">
                              <span className="font-bold mr-2 text-[8px]">R.F.C.:</span>
                              <input type="text" value={hdPersonal.rfc} onChange={e => handlePersonalChange('rfc', e.target.value)} className="flex-1 border-b border-black outline-none text-[9px] uppercase font-bold text-center bg-transparent" />
                          </div>
                          <div className="w-[45%] flex items-end">
                              <span className="font-bold mr-2 text-[8px]">C.U.R.P.:</span>
                              <input type="text" value={hdPersonal.curp} onChange={e => handlePersonalChange('curp', e.target.value)} className="flex-1 border-b border-black outline-none text-[9px] uppercase font-bold text-center bg-transparent" />
                          </div>
                          <div className="w-[30%] flex items-end">
                              <span className="font-bold mr-2 text-[8px]">EDO. CIVIL:</span>
                              <input type="text" value={hdPersonal.civilStatus} onChange={e => handlePersonalChange('civilStatus', e.target.value)} className="flex-1 border-b border-black outline-none text-[9px] uppercase font-bold text-center bg-transparent" />
                          </div>
                      </div>

                      {/* FILIACION / FECHA NAC / LUGAR */}
                      <div className="flex items-end gap-2">
                          <div className="w-[35%] flex items-end">
                              <span className="font-bold mr-1 text-[8px]">FILIACIÓN:</span>
                              <input type="text" value={hdPersonal.filiacion} onChange={e => handlePersonalChange('filiacion', e.target.value)} className="flex-1 border-b border-black outline-none text-[9px] uppercase font-bold text-center bg-transparent" />
                          </div>
                          <div className="w-[30%] flex items-end">
                              <div className="flex flex-col w-full">
                                  <div className="flex items-end">
                                      <span className="font-bold mr-1 leading-none text-[8px] w-20">FECHA DE NACIMIENTO:</span>
                                      <input type="date" value={hdPersonal.birthDate} onChange={e => handlePersonalChange('birthDate', e.target.value)} className="flex-1 border-b border-black outline-none text-[9px] uppercase text-center bg-transparent h-4" />
                                  </div>
                              </div>
                          </div>
                          <div className="w-[35%] flex items-end">
                              <span className="font-bold mr-1 text-[8px]">LUGAR:</span>
                              <input type="text" value={hdPersonal.birthPlace} onChange={e => handlePersonalChange('birthPlace', e.target.value)} className="flex-1 border-b border-black outline-none text-[9px] uppercase font-bold text-center bg-transparent" />
                          </div>
                      </div>

                      {/* DOMICILIO */}
                      <div className="flex items-end mt-2">
                          <span className="font-bold mr-2 whitespace-nowrap text-[8px]">DOMICILIO PARTICULAR:</span>
                          <div className="flex-1 flex flex-col">
                              <input type="text" value={hdPersonal.address.street} onChange={e => handleAddressChange('street', e.target.value)} className="w-full border-b border-black outline-none text-[9px] uppercase font-bold bg-transparent" />
                              <span className="text-[7px] text-center italic">CALLE</span>
                          </div>
                          <div className="w-16 flex flex-col ml-2">
                              <input type="text" value={hdPersonal.address.extNum} onChange={e => handleAddressChange('extNum', e.target.value)} className="w-full border-b border-black outline-none text-[9px] uppercase text-center bg-transparent" />
                              <span className="text-[7px] text-center italic">N° EXT</span>
                          </div>
                          <div className="w-16 flex flex-col ml-2">
                              <input type="text" value={hdPersonal.address.intNum} onChange={e => handleAddressChange('intNum', e.target.value)} className="w-full border-b border-black outline-none text-[9px] uppercase text-center bg-transparent" />
                              <span className="text-[7px] text-center italic">N° INT</span>
                          </div>
                      </div>

                      <div className="flex gap-4">
                          <div className="flex-1 flex flex-col">
                              <input type="text" value={hdPersonal.address.colonia} onChange={e => handleAddressChange('colonia', e.target.value)} className="w-full border-b border-black outline-none text-[9px] uppercase font-bold text-center bg-transparent" />
                              <span className="text-[7px] text-center italic">COLONIA</span>
                          </div>
                          <div className="flex-1 flex flex-col">
                              <input type="text" value={hdPersonal.address.alcaldia} onChange={e => handleAddressChange('alcaldia', e.target.value)} className="w-full border-b border-black outline-none text-[9px] uppercase font-bold text-center bg-transparent" />
                              <span className="text-[7px] text-center italic">ALCALDÍA</span>
                          </div>
                          <div className="w-16 flex flex-col">
                              <input type="text" value={hdPersonal.address.postalCode} onChange={e => handleAddressChange('postalCode', e.target.value)} className="w-full border-b border-black outline-none text-[9px] uppercase font-bold text-center bg-transparent" />
                              <span className="text-[7px] text-center italic">C.P.</span>
                          </div>
                          <div className="w-24 flex flex-col">
                              <input type="text" value={hdPersonal.address.phone} onChange={e => handleAddressChange('phone', e.target.value)} className="w-full border-b border-black outline-none text-[9px] uppercase font-bold text-center bg-transparent" />
                              <span className="text-[7px] text-center italic">TEL. PARTICULAR</span>
                          </div>
                          <div className="w-24 flex flex-col">
                              <input type="text" value={hdPersonal.address.cellphone} onChange={e => handleAddressChange('cellphone', e.target.value)} className="w-full border-b border-black outline-none text-[9px] uppercase font-bold text-center bg-transparent" />
                              <span className="text-[7px] text-center italic">CELULAR</span>
                          </div>
                      </div>

                      <div className="flex items-end">
                          <span className="font-bold mr-2 text-[8px]">CORREO ELECTRÓNICO:</span>
                          <input type="email" value={hdPersonal.address.email} onChange={e => handleAddressChange('email', e.target.value.toLowerCase())} className="flex-1 border-b border-black outline-none text-[9px] font-bold bg-transparent" />
                      </div>
                  </div>

                  {/* SECCION: DATOS ESCOLARIDAD */}
                  <div className="bg-yellow-100/50 border-y-2 border-yellow-300 print:bg-transparent print:border-transparent mb-2 text-center font-bold text-sm py-0.5 uppercase">
                      DATOS DE ESCOLARIDAD
                  </div>

                  <div className="space-y-2 mb-4">
                      <div className="flex items-end">
                          <span className="font-bold mr-2 text-[8px]">FECHA O INSTITUCIÓN DONDE REALIZÓ SUS ESTUDIOS:</span>
                          <input type="text" value={hdSchooling.institution} onChange={e => handleSchoolingChange('institution', e.target.value)} className="flex-1 border-b border-black outline-none text-[9px] uppercase font-bold bg-transparent" />
                      </div>
                      
                      <div className="flex items-end gap-2">
                          <div className="flex-1 flex items-end">
                              <span className="font-bold mr-2 text-[8px]">ÚLTIMO GRADO DE ESCOLARIDAD:</span>
                              <input type="text" value={hdSchooling.lastDegree} onChange={e => handleSchoolingChange('lastDegree', e.target.value)} className="flex-1 border-b border-black outline-none text-[9px] uppercase font-bold bg-transparent" />
                          </div>
                          {/* Free text input for Pasante */}
                          <div className="w-24 flex items-end">
                              <span className="font-bold mr-1 text-[8px]">PASANTE:</span>
                              <input type="text" value={hdSchooling.isPasante} onChange={e => handleSchoolingChange('isPasante', e.target.value)} className="w-12 border-b border-black outline-none text-[9px] uppercase font-bold text-center bg-transparent" />
                          </div>
                          {/* Free text input for Titulado */}
                          <div className="w-24 flex items-end">
                              <span className="font-bold mr-1 text-[8px]">TITULADO:</span>
                              <input type="text" value={hdSchooling.isTitled} onChange={e => handleSchoolingChange('isTitled', e.target.value)} className="w-12 border-b border-black outline-none text-[9px] uppercase font-bold text-center bg-transparent" />
                          </div>
                      </div>

                      <div className="flex items-end gap-4">
                          <div className="flex-1 flex items-end">
                              <span className="font-bold mr-2 text-[8px]">CÉDULA PROFESIONAL NÚMERO:</span>
                              <input type="text" value={hdSchooling.cedula} onChange={e => handleSchoolingChange('cedula', e.target.value)} className="flex-1 border-b border-black outline-none text-[9px] uppercase font-bold bg-transparent" />
                          </div>
                          <div className="w-40 flex items-end">
                              <span className="font-bold mr-2 text-[8px]">FECHA:</span>
                              <input type="date" value={hdSchooling.cedulaDate} onChange={e => handleSchoolingChange('cedulaDate', e.target.value)} className="flex-1 border-b border-black outline-none text-[9px] uppercase bg-transparent" />
                          </div>
                      </div>

                      <div className="flex items-end">
                          <span className="font-bold mr-2 text-[8px]">LICENCIATURA, MAESTRÍA O DOCTORADO EN:</span>
                          <input type="text" value={hdSchooling.specialization} onChange={e => handleSchoolingChange('specialization', e.target.value)} className="flex-1 border-b border-black outline-none text-[9px] uppercase font-bold bg-transparent" />
                      </div>
                  </div>

                  {/* SECCION: DATOS LABORALES */}
                  <div className="bg-yellow-100/50 border-y-2 border-yellow-300 print:bg-transparent print:border-transparent mb-2 text-center font-bold text-sm py-0.5 uppercase">
                      DATOS LABORALES
                  </div>

                  <div className="text-center font-bold text-[8px] mb-2">CLAVE(S) ACTUAL(ES) EN EDUCACIÓN SECUNDARIA</div>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-1 mb-4">
                      {hdLabor.keys.map((k: string, i: number) => (
                          <div key={i} className="flex items-end border-b border-black">
                              <span className="font-bold mr-2 text-[8px]">{i+1}.</span>
                              <input 
                                  type="text" 
                                  value={k} 
                                  onChange={e => {
                                      const newKeys = [...hdLabor.keys];
                                      newKeys[i] = e.target.value.toUpperCase();
                                      setHdLabor({...hdLabor, keys: newKeys});
                                  }} 
                                  className="flex-1 outline-none text-[9px] uppercase font-bold bg-transparent"
                              />
                          </div>
                      ))}
                  </div>

                  <div className="flex items-end gap-2 mb-2">
                      <div className="flex-1 flex items-end">
                          <span className="font-bold mr-1 text-[8px]">FECHA DE ÚLTIMA ORDEN DE PRESENTACIÓN:</span>
                          <input type="date" value={hdLabor.lastOrderDate} onChange={e => handleLaborChange('lastOrderDate', e.target.value)} className="w-24 border-b border-black outline-none text-[9px] uppercase bg-transparent" />
                      </div>
                      <div className="flex-1 flex items-end">
                          <span className="font-bold mr-1 text-[8px]">ESCUELAS ANTERIORES:</span>
                          <input type="text" value={hdLabor.previousSchools} onChange={e => handleLaborChange('previousSchools', e.target.value)} className="flex-1 border-b border-black outline-none text-[9px] uppercase font-bold bg-transparent" />
                      </div>
                  </div>

                  <div className="flex items-end gap-2 mb-4 text-[8px]">
                      <span className="font-bold mr-1">FECHA DE INGRESO:</span>
                      <div className="flex items-end">
                          <span className="font-bold mr-1">GOBIERNO FED.:</span>
                          <input type="date" value={hdLabor.admissionDateGov} onChange={e => handleLaborChange('admissionDateGov', e.target.value)} className="w-20 border-b border-black outline-none bg-transparent" />
                      </div>
                      <div className="flex items-end">
                          <span className="font-bold mr-1">S.E.P.:</span>
                          <input type="date" value={hdLabor.admissionDateSep} onChange={e => handleLaborChange('admissionDateSep', e.target.value)} className="w-20 border-b border-black outline-none bg-transparent" />
                      </div>
                      <div className="flex items-end">
                          <span className="font-bold mr-1">C.S.E.S..:</span>
                          <input type="date" value={hdLabor.admissionDateCses} onChange={e => handleLaborChange('admissionDateCses', e.target.value)} className="w-20 border-b border-black outline-none bg-transparent" />
                      </div>
                      <div className="flex items-end flex-1">
                          <span className="font-bold mr-1">AÑOS EN SERVICIO:</span>
                          <input type="text" value={hdLabor.yearsService} onChange={e => handleLaborChange('yearsService', e.target.value)} className="w-12 min-w-[30px] border-b border-black outline-none text-center font-bold bg-transparent" />
                      </div>
                  </div>

                  <div className="text-[9px] text-justify leading-snug mb-2">
                      DECLARO BAJO PROTESTA DE DECIR LA VERDAD QUE 
                      <span className="mx-1 font-bold">( {hdLabor.otherJob === 'SI' ? 'X' : ' '} ) SI</span> 
                      <span className="mx-1 font-bold">( {hdLabor.otherJob === 'NO' ? 'X' : ' '} ) NO</span> 
                      ME ENCUENTRO DESEMPEÑANDO OTRO EMPLEO O COMISIÓN DENTRO DE OTRA ENTIDAD DE LA ADMINISTRACIÓN PÚBLICA FEDERAL; ASÍMISMO MANIFIESTO NO ENCONTRARME INHABILITADO POR LA SECRETARÍA DE LA FUNCIÓN PÚBLICA O AUTORIDAD JUDICIAL.
                  </div>
                  
                  {/* SELECTOR FOR 'DECLARO' LOGIC (HIDDEN IN PRINT) */}
                  <div className="print:hidden flex gap-4 text-xs font-bold text-blue-600 mb-2">
                      <label className="flex items-center gap-1 cursor-pointer">
                          <input type="radio" name="otherJob" checked={hdLabor.otherJob === 'SI'} onChange={() => handleOtherJobChange('SI')} /> SI TIENE OTRO EMPLEO
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                          <input type="radio" name="otherJob" checked={hdLabor.otherJob === 'NO'} onChange={() => handleOtherJobChange('NO')} /> NO TIENE OTRO EMPLEO
                      </label>
                  </div>

                  <div className="flex gap-4 mb-4">
                      <div className="flex-1 flex flex-col">
                          <input 
                              type="text" 
                              value={hdLabor.otherJobName} 
                              onChange={e => handleLaborChange('otherJobName', e.target.value)} 
                              disabled={hdLabor.otherJob !== 'SI'}
                              className="w-full border-b border-black outline-none text-[9px] uppercase font-bold text-center bg-transparent disabled:bg-slate-100 disabled:cursor-not-allowed" 
                          />
                          <span className="text-[7px] text-center font-bold">EMPLEO</span>
                      </div>
                      <div className="flex-1 flex flex-col">
                          <input 
                              type="text" 
                              value={hdLabor.otherJobCategory} 
                              onChange={e => handleLaborChange('otherJobCategory', e.target.value)} 
                              disabled={hdLabor.otherJob !== 'SI'}
                              className="w-full border-b border-black outline-none text-[9px] uppercase font-bold text-center bg-transparent disabled:bg-slate-100 disabled:cursor-not-allowed" 
                          />
                          <span className="text-[7px] text-center font-bold">CATEGORÍA</span>
                      </div>
                      <div className="flex-1 flex flex-col">
                          <input 
                              type="text" 
                              value={hdLabor.otherJobKey} 
                              onChange={e => handleLaborChange('otherJobKey', e.target.value)} 
                              disabled={hdLabor.otherJob !== 'SI'}
                              className="w-full border-b border-black outline-none text-[9px] uppercase font-bold text-center bg-transparent disabled:bg-slate-100 disabled:cursor-not-allowed" 
                          />
                          <span className="text-[7px] text-center font-bold">CLAVE(S)</span>
                      </div>
                      <div className="w-32 flex flex-col">
                          <input 
                              type="date" 
                              value={hdLabor.otherJobStartDate} 
                              onChange={e => handleLaborChange('otherJobStartDate', e.target.value)} 
                              disabled={hdLabor.otherJob !== 'SI'}
                              className="w-full border-b border-black outline-none text-[9px] uppercase text-center bg-transparent disabled:bg-slate-100 disabled:cursor-not-allowed" 
                          />
                          <span className="text-[7px] text-center font-bold">FECHA DE INGRESO</span>
                      </div>
                  </div>

                  <div className="text-[8px] text-justify leading-snug italic mb-8">
                      OBSERVACIÓN: EL PERSONAL QUE TENGA DOS O MÁS PLAZAS EN LA FEDERACIÓN, DEBE PRESENTAR SU COMPATIBILIDAD Y NO EXCEDER, PARA EFECTOS DE LA MISMA, 42 HORAS DOCENTES, O 48 HORAS MANCOMUNADAS, DOCENTES Y ADMINISTRATIVAS.
                  </div>

                  <div className="flex justify-between items-end">
                      <div className="border border-black p-1 px-4 bg-yellow-100/50 print:bg-transparent font-bold">
                          FECHA DE HOY: <span className="ml-2">{hdFooterDate}</span>
                      </div>
                      <div className="flex flex-col items-center w-64">
                          <div className="border border-black h-16 w-full mb-1"></div>
                          <span className="font-bold">FIRMA</span>
                      </div>
                  </div>

              </div>
          </div>
      )}

      {/* --- MODAL EDITAR USUARIO (EXISTING) --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm no-print">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">{editingUserId ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleCreateOrUpdateUser} className="p-6 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Completo</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rol</label>
                  <select 
                    value={role} 
                    onChange={(e) => handleRoleChange(e.target.value)}
                    disabled={!canManageUsers}
                    className="w-full px-4 py-2 border rounded-xl bg-white disabled:bg-slate-100"
                  >
                    {data.roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Usuario (Login)</label>
                  <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contraseña</label>
                  <input type="text" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 border rounded-xl" />
                </div>
              </div>

              {/* ASIGNACIÓN DE GRUPOS (SOLO DOCENTES / ROLES QUE LO REQUIERAN) */}
              {currentRoleDef?.requiresAssignments && (
                  <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><Book size={16}/> Asignación de Grupos</h4>
                    <div className="flex flex-wrap gap-2 mb-3">
                        <select value={assignGrade} onChange={(e) => setAssignGrade(e.target.value)} className="p-2 border rounded-lg text-sm w-20">
                            {data.gradesStructure.map(g => <option key={g.grade} value={g.grade}>{g.grade}</option>)}
                        </select>
                        <select value={assignSubject} onChange={(e) => setAssignSubject(e.target.value)} className="p-2 border rounded-lg text-sm flex-1 min-w-[150px]">
                            {data.gradesStructure.find(g => g.grade === assignGrade)?.subjects.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        
                        {assignSubject === 'Tecnología' ? (
                            <>
                                <select value={assignTech} onChange={(e) => setAssignTech(e.target.value)} className="p-2 border rounded-lg text-sm w-40 text-blue-600 font-bold bg-blue-50 border-blue-200">
                                    <option value="">-- Taller --</option>
                                    {data.technologies.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <select value={assignGroup} onChange={(e) => setAssignGroup(e.target.value)} className="p-2 border rounded-lg text-sm w-32 font-bold">
                                    <option value="AC">Sección 1 (A,C)</option>
                                    <option value="BD">Sección 2 (B,D)</option>
                                    <option value="A">A</option>
                                    <option value="B">B</option>
                                    <option value="C">C</option>
                                    <option value="D">D</option>
                                </select>
                            </>
                        ) : (
                            <select value={assignGroup} onChange={(e) => setAssignGroup(e.target.value)} className="p-2 border rounded-lg text-sm w-20">
                                {data.gradesStructure.find(g => g.grade === assignGrade)?.groups.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        )}

                        <button type="button" onClick={handleAddAssignment} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"><Plus size={20}/></button>
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                        {assignments.map((assign, idx) => (
                            <span key={idx} className="bg-white border border-slate-200 px-3 py-1 rounded-full text-xs flex items-center shadow-sm">
                                <span className="font-bold mr-1">{assign.grade} {assign.group}</span> 
                                <span className="text-slate-500 mr-2">{assign.subject === 'Tecnología' ? `(${assign.technology})` : assign.subject}</span>
                                <button type="button" onClick={() => removeAssignment(idx)} className="text-red-400 hover:text-red-600"><X size={14}/></button>
                            </span>
                        ))}
                        {assignments.length === 0 && <p className="text-xs text-slate-400 italic">Sin asignaciones.</p>}
                    </div>
                  </div>
              )}

              {/* HORARIO LABORAL (PERSONAL APOYO / ADMIN) */}
              {isStaffRole && (
                  <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><Clock size={16}/> Horario Laboral (Para Sábana)</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {WEEK_DAYS.map((day: string) => (
                              <div key={day} className="flex flex-col">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">{day}</label>
                                  <input 
                                      type="text" 
                                      placeholder="Ej. 14:00-20:00" 
                                      value={workSchedule[day] || ''}
                                      onChange={(e) => handleScheduleChange(day, e.target.value)}
                                      className="text-xs p-2 border rounded-lg focus:ring-1 focus:ring-blue-500"
                                  />
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {/* PERMISOS GRANULARES (SOLO ADMIN) */}
              {canManageUsers && (
                  <div className="mb-6 border-t border-slate-200 pt-4">
                      <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><Shield size={16}/> Permisos Especiales</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                          {Object.keys(permissions).map((key) => (
                              <label key={key} className="flex items-center gap-2 p-2 rounded hover:bg-slate-50 cursor-pointer">
                                  <input 
                                      type="checkbox" 
                                      checked={(permissions as any)[key]} 
                                      onChange={(e) => setPermissions({...permissions, [key]: e.target.checked})}
                                      className="rounded text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="capitalize">{key.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}</span>
                              </label>
                          ))}
                      </div>
                  </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={resetForm} className="flex-1 py-3 text-slate-600 bg-slate-100 font-bold rounded-xl hover:bg-slate-200">Cancelar</button>
                <button type="submit" className="flex-1 py-3 text-white bg-blue-600 font-bold rounded-xl hover:bg-blue-700 shadow-lg">Guardar Usuario</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL GESTIÓN DE ROLES --- */}
      {showRoleManager && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm no-print">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden animate-fade-in-up">
                  <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-800 text-white">
                      <h3 className="text-lg font-bold flex items-center gap-2"><Settings size={20}/> Gestión de Roles</h3>
                      <button onClick={() => setShowRoleManager(false)} className="text-slate-300 hover:text-white"><X size={24}/></button>
                  </div>
                  
                  <div className="flex flex-1 overflow-hidden">
                      {/* SIDEBAR ROLES */}
                      <div className="w-1/3 border-r border-slate-200 bg-slate-50 p-4 overflow-y-auto">
                          <button onClick={handleCreateRole} className="w-full mb-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 shadow flex items-center justify-center gap-2">
                              <Plus size={16}/> Crear Nuevo Rol
                          </button>
                          <div className="space-y-2">
                              {data.roles.map(r => (
                                  <div 
                                      key={r.id} 
                                      onClick={() => handleEditRole(r)}
                                      className={`p-3 rounded-lg cursor-pointer border transition-all ${editingRoleId === r.id ? 'bg-white border-blue-500 shadow-md ring-1 ring-blue-500' : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm'}`}
                                  >
                                      <div className="flex justify-between items-center">
                                          <span className="font-bold text-sm text-slate-700">{r.name}</span>
                                          {r.isSystem && <div title="Rol de Sistema"><Shield size={12} className="text-slate-400" /></div>}
                                      </div>
                                      <p className="text-[10px] text-slate-500 mt-1 truncate">{r.id}</p>
                                  </div>
                              ))}
                          </div>
                      </div>

                      {/* MAIN EDITOR */}
                      <div className="flex-1 p-6 overflow-y-auto">
                          <h4 className="font-bold text-lg text-slate-800 mb-6 border-b pb-2">
                              {editingRoleId ? 'Editar Rol' : 'Nuevo Rol'}
                          </h4>
                          
                          <div className="space-y-4 mb-6">
                              <div>
                                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre del Rol</label>
                                  <input type="text" value={roleName} onChange={e => setRoleName(e.target.value)} className="w-full p-2 border rounded-lg" placeholder="Ej. Psicólogo, Velador..."/>
                              </div>
                              <label className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg cursor-pointer">
                                  <input type="checkbox" checked={roleRequiresAssignments} onChange={e => setRoleRequiresAssignments(e.target.checked)} className="rounded text-blue-600"/>
                                  <div className="text-sm">
                                      <span className="font-bold text-blue-800">Requiere Asignación de Grupos</span>
                                      <p className="text-xs text-blue-600">Si se activa, se podrá asignar materias y grupos a los usuarios con este rol (Ej. Docentes).</p>
                                  </div>
                              </label>
                          </div>

                          <h5 className="font-bold text-sm text-slate-700 mb-3 uppercase border-b pb-1">Permisos del Sistema</h5>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                              {Object.keys(rolePermissions).map((key) => (
                                  <label key={key} className="flex items-start gap-2 p-2 border rounded hover:bg-slate-50 cursor-pointer">
                                      <input 
                                          type="checkbox" 
                                          checked={(rolePermissions as any)[key]} 
                                          onChange={(e) => setRolePermissions({...rolePermissions, [key]: e.target.checked})}
                                          className="mt-1 rounded text-blue-600"
                                      />
                                      <div>
                                          <span className="font-medium capitalize block">{key.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}</span>
                                          <span className="text-[10px] text-slate-400">Acceso a módulo {key.replace('can', '')}</span>
                                      </div>
                                  </label>
                              ))}
                          </div>

                          <div className="flex gap-3 mt-8 pt-4 border-t">
                              {editingRoleId && !data.roles.find(r => r.id === editingRoleId)?.isSystem && (
                                  <button onClick={() => handleDeleteRole(editingRoleId)} className="px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 font-bold flex items-center gap-2">
                                      <Trash2 size={18}/> Eliminar Rol
                                  </button>
                              )}
                              <div className="flex-1"></div>
                              <button onClick={() => setShowRoleManager(false)} className="px-6 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg">Cerrar</button>
                              <button onClick={handleSaveRole} disabled={!roleName} className="px-6 py-2 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900 shadow-lg disabled:opacity-50">Guardar Cambios</button>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default TeachersView;
