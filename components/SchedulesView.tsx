import React, { useState, useMemo, useEffect } from 'react';
import { CalendarDays, Save, CheckCircle2, Search, Printer, Grid, User, ArrowRight, ArrowLeft, FileDown, Plus, Trash2, Cpu, Pencil, X, Check, FileText } from 'lucide-react';
import { SchoolData, ScheduleEntry, User as UserType } from '../types';
import { WEEK_DAYS, CLASS_PERIODS } from '../utils';

// Constantes visuales para impresión
const LOGO_URL = "https://cdn1.sharemyimage.com/smi/2025/10/05/27tv.png";
const SEP_LOGO_URL = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSDxcKIcMNGVUxi6N-EpVbrw1Y7HNcrm2FqqQ&s"; // AEF Logo Placeholder

// Definición de horarios de módulos para cálculo de traslape
const MODULE_TIMES = [
    { period: 1, start: 14 * 60, end: 14 * 60 + 50 },       // 14:00 - 14:50
    { period: 2, start: 14 * 60 + 50, end: 15 * 60 + 40 },  // 14:50 - 15:40
    { period: 3, start: 15 * 60 + 40, end: 16 * 60 + 30 },  // 15:40 - 16:30
    { period: 4, start: 16 * 60 + 30, end: 17 * 60 + 20 },  // 16:30 - 17:20
    // Receso 17:20 - 17:40 (20 mins)
    { period: 5, start: 17 * 60 + 40, end: 18 * 60 + 30 },  // 17:40 - 18:30
    { period: 6, start: 18 * 60 + 30, end: 19 * 60 + 20 },  // 18:30 - 19:20
    { period: 7, start: 19 * 60 + 20, end: 20 * 60 + 10 },  // 19:20 - 20:10
];

interface SchedulesViewProps {
  data: SchoolData;
  onUpdateData: (newData: SchoolData) => void;
  currentUser?: UserType;
  currentCycle: string;
}

type Tab = 'sabana' | 'teacher' | 'group';

const SchedulesView: React.FC<SchedulesViewProps> = ({ data, onUpdateData, currentUser, currentCycle }) => {
  const [activeTab, setActiveTab] = useState<Tab>('sabana');
  const [schoolCycle, setSchoolCycle] = useState(currentCycle);

  useEffect(() => {
      setSchoolCycle(currentCycle);
  }, [currentCycle]);

  // Estados para Visualización Individual
  const [viewTeacherId, setViewTeacherId] = useState<string>('');
  const [viewGradeGroup, setViewGradeGroup] = useState<string>('');
  
  // Estados locales para campos extra del horario (no persistentes en DB, solo para impresión actual)
  const [extraHoursService, setExtraHoursService] = useState<string>('');
  const [extraHoursTutoria, setExtraHoursTutoria] = useState<string>('');

  // Estados para edición de pie de página
  const [showFooterModal, setShowFooterModal] = useState(false);
  const [tempFooterText, setTempFooterText] = useState('');

  // Inicializar tempFooterText
  useEffect(() => {
      if (data.scheduleFooterText) {
          setTempFooterText(data.scheduleFooterText);
      }
  }, [data.scheduleFooterText]);

  // Efecto para restringir vista si es profesor
  useEffect(() => {
    if (currentUser && currentUser.role === 'teacher') {
        setActiveTab('teacher');
        setViewTeacherId(currentUser.id);
    }
  }, [currentUser]);

  // --- LISTAS DE PERSONAL FILTRADAS POR PERFIL ---
  
  // 1. Personal de Tecnología (Docentes con materia "Tecnología")
  const technologyStaff = useMemo(() => 
    (data.users || []).filter(u => 
        u.role === 'teacher' && 
        u.assignments?.some(a => a.subject === 'Tecnología')
    ).sort((a, b) => a.name.localeCompare(b.name)),
  [data.users]);

  // 2. Personal Académico (Docentes SIN materia "Tecnología")
  const academicStaff = useMemo(() => 
    (data.users || []).filter(u => 
        u.role === 'teacher' && 
        !u.assignments?.some(a => a.subject === 'Tecnología')
    ).sort((a, b) => a.name.localeCompare(b.name)),
  [data.users]);

  // 3. Personal de Apoyo (Red Escolar, Laboratorio, Apoyo)
  // NOTA: Se excluye 'administrative' para que no aparezcan en la sábana ni se les genere horario,
  // aunque se les asignen grupos en TeachersView.
  const supportStaff = useMemo(() => 
    (data.users || []).filter(u => 
        ['red_escolar', 'laboratorista', 'apoyo'].includes(u.role)
    ).sort((a, b) => a.name.localeCompare(b.name)),
  [data.users]);

  // Lista completa para visualización de horarios individuales
  const allStaff = useMemo(() => [...academicStaff, ...technologyStaff, ...supportStaff], [academicStaff, technologyStaff, supportStaff]);

  // Lista de todos los posibles grupos (1A, 1B, etc) para el selector
  const allGroups = useMemo(() => {
    const groups: string[] = [];
    data.gradesStructure.forEach(g => {
        g.groups.forEach(grp => groups.push(`${g.grade.replace('°', '')}${grp}`));
    });
    return groups;
  }, [data.gradesStructure]);

  // Ensure sabanaLayout exists (backward compatibility)
  useEffect(() => {
      // Check if tech section is missing
      if (!data.sabanaLayout || !data.sabanaLayout.technology) {
          const currentLayout = data.sabanaLayout || { academic: [], support: [] };
          onUpdateData({
              ...data,
              sabanaLayout: {
                  academic: currentLayout.academic || [],
                  technology: [], // Add empty if missing
                  support: currentLayout.support || []
              }
          });
      }
  }, [data.sabanaLayout]);

  const sabanaLayout = data.sabanaLayout || { academic: [], technology: [], support: [] };

  // --- LOGIC: SABANA EDIT ---

  // Obtener el valor de una celda específica
  const getCellValue = (teacherId: string, day: string, period: number) => {
    const entry = (data.schedules || []).find(s => s.teacherId === teacherId && s.day === day && s.period === period);
    return entry ? entry.gradeGroup : '';
  };

  // Calcular horas totales asignadas en la sabana
  const calculateTotalHours = (teacherId: string) => {
      return (data.schedules || []).filter(s => s.teacherId === teacherId && s.gradeGroup.trim() !== '').length;
  };

  // Manejar cambio en celda de sábana
  const handleCellChange = (teacherId: string, day: string, period: number, value: string, type: 'academic' | 'technology' | 'support') => {
    // Normalizar entrada (ej 1a -> 1A)
    const normalizedValue = value.toUpperCase();

    const newSchedules = [...(data.schedules || [])];
    const existingIndex = newSchedules.findIndex(s => s.teacherId === teacherId && s.day === day && s.period === period);

    if (existingIndex >= 0) {
        if (normalizedValue === '') {
            // Eliminar si está vacío
            newSchedules.splice(existingIndex, 1);
        } else {
            // Actualizar
            newSchedules[existingIndex] = { ...newSchedules[existingIndex], gradeGroup: normalizedValue, type };
        }
    } else if (normalizedValue !== '') {
        // Crear nuevo
        newSchedules.push({
            id: Date.now().toString() + Math.random().toString(),
            teacherId,
            day: day,
            period,
            gradeGroup: normalizedValue,
            type
        });
    }

    onUpdateData({ ...data, schedules: newSchedules });
  };

  // Agregar fila a la sábana
  const handleAddRow = (section: 'academic' | 'technology' | 'support') => {
      const newLayout = { ...sabanaLayout };
      if (!newLayout[section]) newLayout[section] = [];
      newLayout[section] = [...newLayout[section], '']; // Agregar ID vacío
      onUpdateData({ ...data, sabanaLayout: newLayout });
  };

  // Eliminar fila
  const handleRemoveRow = (section: 'academic' | 'technology' | 'support', index: number) => {
      const newLayout = { ...sabanaLayout };
      newLayout[section] = newLayout[section].filter((_, i) => i !== index);
      onUpdateData({ ...data, sabanaLayout: newLayout });
  };

  // Convertir hora HH:MM a minutos desde medianoche
  const timeToMinutes = (timeStr: string) => {
      if (!timeStr) return 0;
      const [hours, minutes] = timeStr.split(':').map(Number);
      return (hours * 60) + minutes;
  };

  // Seleccionar profesor para una fila
  const handleSelectTeacherForRow = (section: 'academic' | 'technology' | 'support', index: number, teacherId: string) => {
      const newLayout = { ...sabanaLayout };
      newLayout[section][index] = teacherId;

      // --- LÓGICA DE PRECARGA (AUTO-FILL) PARA PERSONAL DE APOYO ---
      let newSchedules = [...(data.schedules || [])];
      
      if (section === 'support' && teacherId) {
          const user = supportStaff.find(u => u.id === teacherId);
          
          // Si el usuario tiene horario laboral definido (ej: "14:00-18:00")
          if (user && user.workSchedule) {
              
              WEEK_DAYS.forEach(day => {
                  const hoursStr = user.workSchedule?.[day];
                  if (hoursStr && hoursStr.includes('-')) {
                      const [startStr, endStr] = hoursStr.split('-');
                      const startMins = timeToMinutes(startStr.trim());
                      const endMins = timeToMinutes(endStr.trim());

                      if (startMins > 0 && endMins > 0) {
                          // Verificar contra cada módulo
                          MODULE_TIMES.forEach(mod => {
                              // Si hay traslape significativo (el usuario trabaja durante ese modulo)
                              if (startMins < mod.end && endMins > mod.start) {
                                  // Verificar si ya existe entrada
                                  const exists = newSchedules.some(s => s.teacherId === teacherId && s.day === day && s.period === mod.period);
                                  
                                  if (!exists) {
                                      newSchedules.push({
                                          id: Date.now().toString() + Math.random().toString(),
                                          teacherId,
                                          day,
                                          period: mod.period,
                                          gradeGroup: 'X', // Marcamos con X
                                          type: 'support'
                                      });
                                  }
                              }
                          });
                      }
                  }
              });
          }
      }

      onUpdateData({ ...data, sabanaLayout: newLayout, schedules: newSchedules });
  };

  // Helper to translate section codes to readable groups (e.g. 11 -> 1° A,C)
  const formatSectionCode = (code: string) => {
      if (!code || code.length < 2) return code;
      const grade = code.charAt(0);
      const section = code.substring(1);
      
      if (section === '1') return `${grade}° A,C`;
      if (section === '2') return `${grade}° B,D`;
      return code; // Fallback
  };

  // --- LOGIC: TEACHER VIEW ---
  const getTeacherScheduleMatrix = (teacherId: string) => {
      const matrix: Record<number, Record<string, string>> = {};
      const teacher = allStaff.find(t => t.id === teacherId);
      const isTech = teacher?.assignments?.some(a => a.subject === 'Tecnología');

      CLASS_PERIODS.forEach(p => {
          matrix[p] = {};
          WEEK_DAYS.forEach(d => {
              const entry = (data.schedules || []).find(s => s.teacherId === teacherId && s.day === d && s.period === p);
              // Si es profesor de tecnología, formateamos el código de sección
              matrix[p][d] = entry ? (isTech ? formatSectionCode(entry.gradeGroup) : entry.gradeGroup) : '';
          });
      });
      return matrix;
  };

  const getTeacherInfo = (teacherId: string) => {
      const teacher = allStaff.find(t => t.id === teacherId);
      if (!teacher) return { disciplines: '', groups: '' };

      // Extract unique disciplines from assignments
      const disciplines = Array.from(new Set(teacher.assignments?.map(a => {
           if (a.subject === 'Tecnología' && a.technology) {
               return `Tecnología (${a.technology})`;
           }
           return a.subject;
      }) || [])).join(' / ');
      
      // Extract unique groups from assignments
      const groups = Array.from(new Set(teacher.assignments?.map(a => {
           // Special formatting for Tech sections in header
           if (a.subject === 'Tecnología') {
               if (a.group === 'A' || a.group === 'C') return `${a.grade.replace('°','')}° A,C`;
               if (a.group === 'B' || a.group === 'D') return `${a.grade.replace('°','')}° B,D`;
           }
           return `${a.grade.replace('°','')}°${a.group}`;
      }) || [])).sort().join(', ');

      return { disciplines, groups };
  };

  const handleSaveFooter = () => {
      onUpdateData({ ...data, scheduleFooterText: tempFooterText });
      setShowFooterModal(false);
  };

  // --- LOGIC: GROUP VIEW ---
  const getGroupScheduleMatrix = (gradeGroup: string) => {
      const matrix: Record<number, Record<string, {teacher: string, subject: string, teacherId: string}>> = {};
      
      // Parse gradeGroup input (e.g., "1A")
      const gradeChar = gradeGroup.charAt(0); // "1"
      const groupChar = gradeGroup.substring(1).toUpperCase(); // "A"
      
      // Determine Tech Section Code based on Group (1=A/C, 2=B/D)
      const isSection1 = ['A', 'C'].includes(groupChar);
      const techCode = isSection1 ? `${gradeChar}1` : `${gradeChar}2`; // "11" or "12"

      CLASS_PERIODS.forEach(p => {
          matrix[p] = {};
          WEEK_DAYS.forEach(d => {
              // Buscar profesor ACADÉMICO directo (ej. "1A")
              let entry = (data.schedules || []).find(s => 
                  s.gradeGroup === gradeGroup && 
                  s.day === d && 
                  s.period === p && 
                  s.type === 'academic'
              );
              
              // Si no hay académico, buscar TECNOLOGÍA por código (ej. "11")
              if (!entry) {
                  entry = (data.schedules || []).find(s => 
                    s.gradeGroup === techCode && 
                    s.day === d && 
                    s.period === p &&
                    s.type === 'technology'
                  );
              }
              
              if (entry) {
                  const teacher = (data.users || []).find(u => u.id === entry.teacherId);
                  
                  // Si es tecnología, mostramos solo "TECNOLOGÍA" sin profesor
                  if (entry.type === 'technology') {
                      matrix[p][d] = {
                          teacher: '',
                          subject: 'TECNOLOGÍA',
                          teacherId: ''
                      };
                  } else if (teacher) {
                      // Lógica normal para materias académicas
                      const gradeNum = gradeGroup.charAt(0) + '°';
                      const groupLet = gradeGroup.substring(1);
                      const assignment = teacher.assignments?.find(a => a.grade === gradeNum && a.group === groupLet);
                      const subject = assignment ? assignment.subject : (assignment === undefined ? 'Clase' : 'Asignatura');
                      
                      matrix[p][d] = {
                          teacher: teacher.name,
                          subject: subject,
                          teacherId: teacher.id
                      };
                  } else {
                      matrix[p][d] = { teacher: 'Profesor Desconocido', subject: '?', teacherId: '' };
                  }
              } else {
                  matrix[p][d] = { teacher: '', subject: '', teacherId: '' };
              }
          });
      });
      return matrix;
  };

  const handlePrint = () => window.print();

  // TIME SLOTS MAPPING FOR OFFICIAL SCHEDULE
  const TIME_SLOTS = [
      { id: 1, label: '14:00 - 14:50' },
      { id: 2, label: '14:50 - 15:40' },
      { id: 3, label: '15:40 - 16:30' },
      { id: 4, label: '16:30 - 17:20' },
      { id: 'recess', label: '17:20 - 17:40' },
      { id: 5, label: '17:40 - 18:30' },
      { id: 6, label: '18:30 - 19:20' },
      { id: 7, label: '19:20 - 20:10' },
  ];

  // Función para generar el resumen de profesores y horas para el horario grupal
  const getGroupSummary = (gradeGroup: string) => {
      const summary = new Map<string, {subject: string, teacher: string, hours: number}>();
      
      (data.schedules || []).forEach(entry => {
          // SOLO considerar asignaturas académicas.
          // Las tecnologías se excluyen porque el horario grupal es genérico y 
          // los alumnos van a diferentes talleres con diferentes profesores.
          const isAcademicMatch = entry.gradeGroup === gradeGroup && entry.type === 'academic';

          if (isAcademicMatch) {
              const teacher = (data.users || []).find(u => u.id === entry.teacherId);
              if (teacher) {
                  let subject = 'Asignatura';
                  
                  const gradeNum = gradeGroup.charAt(0) + '°';
                  const groupLet = gradeGroup.substring(1);
                  const assignment = teacher.assignments?.find(a => a.grade === gradeNum && a.group === groupLet);
                  if (assignment) subject = assignment.subject;

                  const key = `${subject}-${teacher.name}`;

                  if (!summary.has(key)) {
                      summary.set(key, { subject, teacher: teacher.name, hours: 0 });
                  }
                  summary.get(key)!.hours += 1;
              }
          }
      });

      return Array.from(summary.values()).sort((a, b) => a.subject.localeCompare(b.subject));
  };

  // Subcomponente para renderizar una sección de la sábana
  const renderSabanaSection = (title: string, sectionKey: 'academic' | 'technology' | 'support', rows: string[], staffList: UserType[]) => (
      <>
        {/* Section Header Row */}
        <tr className="bg-slate-200 print:bg-slate-300 border-b border-slate-400">
            <td colSpan={2 + (WEEK_DAYS.length * CLASS_PERIODS.length)} className="px-2 py-1 font-bold text-xs uppercase sticky left-0 z-10 flex items-center justify-between border-b border-slate-400 print:static">
                <span className="flex items-center gap-2">{title}</span>
                {sectionKey === 'technology' && <span className="text-[9px] font-normal lowercase bg-blue-100 px-2 rounded-full text-blue-800 print:bg-transparent">Usar códigos de sección (Ej: 11, 12, 21, 22)</span>}
            </td>
        </tr>
        
        {rows.map((teacherId, index) => (
            <tr key={`${sectionKey}-${index}`} className="hover:bg-slate-50 print:h-5">
                {/* Teacher Selector (Sticky Left) */}
                <td className="px-1 py-1 font-bold text-slate-700 uppercase sticky left-0 bg-white border-r border-b border-slate-300 z-10 w-64 min-w-[200px] print:static print:border-black print:text-[8px] print:whitespace-nowrap">
                    <div className="flex items-center gap-1 print:hidden">
                        <select 
                            value={teacherId}
                            onChange={(e) => handleSelectTeacherForRow(sectionKey, index, e.target.value)}
                            className="w-full text-[10px] border-none focus:ring-0 bg-transparent uppercase font-bold cursor-pointer"
                        >
                            <option value="">-- SELECCIONAR --</option>
                            {staffList.map(t => (
                                <option key={t.id} value={t.id}>{t.name} {t.role === 'teacher' ? (t.assignments?.some(a=>a.subject==='Tecnología') ? '(Taller)' : '') : `(${t.role})`}</option>
                            ))}
                        </select>
                        <button 
                            onClick={() => handleRemoveRow(sectionKey, index)}
                            className="text-red-300 hover:text-red-500 print:hidden"
                            title="Eliminar fila"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                    {/* Print Only Text */}
                    <div className="hidden print:block pl-1">
                        {staffList.find(t => t.id === teacherId)?.name || '_______________________'}
                    </div>
                </td>
                {/* Calculated Hours */}
                <td className="px-1 py-1 text-center font-bold text-blue-600 sticky left-64 bg-slate-50 border-r border-b border-slate-300 z-10 print:text-black print:bg-white w-10 print:static print:border-black print:text-[8px]">
                    {teacherId ? calculateTotalHours(teacherId) : '-'}
                </td>
                {/* Input Cells */}
                {WEEK_DAYS.map(day => 
                    CLASS_PERIODS.map(period => (
                        <td key={`${day}-${period}`} className="p-0 border-r border-b border-slate-200 relative h-8 w-8 min-w-[24px] print:h-auto print:border-black print:w-auto">
                            <input 
                                type="text"
                                maxLength={15}
                                disabled={!teacherId}
                                className={`w-full h-full text-center uppercase focus:bg-blue-100 focus:outline-none font-medium bg-transparent print:text-black disabled:bg-slate-100 text-[9px] print:text-[7px] ${sectionKey === 'technology' ? 'text-blue-800 font-bold print:text-black' : ''}`}
                                value={teacherId ? getCellValue(teacherId, day, period) : ''}
                                onChange={(e) => handleCellChange(teacherId, day, period, e.target.value, sectionKey)}
                            />
                        </td>
                    ))
                )}
            </tr>
        ))}
        
        {/* Add Row Button */}
        <tr className="print:hidden">
            <td colSpan={2} className="p-1 sticky left-0 bg-white border-r border-b border-slate-300 z-10">
                <button 
                    onClick={() => handleAddRow(sectionKey)}
                    className="w-full text-xs text-blue-600 hover:bg-blue-50 py-1 rounded border border-dashed border-blue-200 flex items-center justify-center gap-1"
                >
                    <Plus size={12} /> Agregar Fila
                </button>
            </td>
            <td colSpan={WEEK_DAYS.length * CLASS_PERIODS.length} className="border-b border-slate-200 bg-slate-50"></td>
        </tr>
      </>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Estilos específicos para impresión solo en esta vista */}
      <style>{`
          @media print {
            @page {
              size: ${activeTab === 'sabana' ? 'landscape' : 'portrait'};
              margin: 5mm;
            }
          }
      `}</style>

      {/* Header Controls (Hidden on Print) */}
      <div className="p-6 md:p-8 space-y-6 print:hidden bg-slate-50 border-b border-slate-200">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-3xl font-bold text-slate-800">Gestión de Horarios</h2>
                <p className="text-slate-500">Sábana general, carga horaria y horarios por grupo.</p>
            </div>
            
            <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-500 uppercase mb-1">Ciclo Escolar</label>
                <input 
                    type="text" 
                    value={schoolCycle}
                    onChange={(e) => setSchoolCycle(e.target.value)}
                    className="p-2 border border-slate-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none w-40"
                />
            </div>
        </div>

        {/* Tabs - HIDDEN IF TEACHER */}
        {!currentUser || currentUser.role !== 'teacher' ? (
            <div className="flex gap-2 p-1 bg-white rounded-xl border border-slate-200 w-fit">
                <button
                    onClick={() => setActiveTab('sabana')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'sabana' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                    <Grid size={16} /> Sábana de Captura
                </button>
                <button
                    onClick={() => setActiveTab('teacher')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'teacher' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                    <User size={16} /> Horario Personal
                </button>
                <button
                    onClick={() => setActiveTab('group')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'group' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                    <CalendarDays size={16} /> Horario Grupo
                </button>
            </div>
        ) : (
            <div className="p-3 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg flex items-center gap-2">
                <User size={18} />
                <span className="font-bold">Vista de Profesor:</span> Consultando únicamente horario asignado.
            </div>
        )}
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-auto bg-slate-100 p-6 md:p-8 print:p-0 print:bg-white print:overflow-visible">
        
        {/* --- TAB: SABANA (EDIT) --- */}
        {activeTab === 'sabana' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full print:border-none print:shadow-none overflow-hidden">
                {/* Sabana Header Controls */}
                <div className="p-4 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between bg-slate-50 print:hidden">
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <ArrowLeft size={16}/> Desplázate horizontalmente para ver toda la semana <ArrowRight size={16}/>
                    </div>

                    <div className="flex gap-4 items-center">
                        <button 
                            onClick={handlePrint}
                            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow text-sm font-bold"
                        >
                            <FileDown size={18} /> Imprimir / PDF
                        </button>
                    </div>
                </div>

                {/* The Big Grid Table */}
                <div className="flex-1 overflow-auto relative">
                    <div className="min-w-max print:min-w-0 print:w-full print:landscape">
                         {/* Header Impresión Sábana Oficial */}
                         <div className="hidden print:flex items-center justify-between mb-2 pb-2 border-b-2 border-black">
                             <img src={SEP_LOGO_URL} alt="SEP" className="h-12 object-contain" />
                             <div className="text-center flex-1 px-4">
                                <h1 className="text-sm font-bold uppercase">ESCUELA SECUNDARIA DIURNA No. 27</h1>
                                <h1 className="text-sm font-bold uppercase whitespace-nowrap">"ALFREDO E. URUCHURTU"</h1>
                                <h2 className="text-sm font-bold">HORARIO GENERAL DE CLASES - CICLO ESCOLAR {schoolCycle}</h2>
                                <p className="text-xs uppercase">Turno: {data.turno} | CCT: 09DES4027P</p>
                             </div>
                             <img src={LOGO_URL} alt="Escudo" className="h-14 w-14 object-contain" />
                         </div>

                        <table className="border-collapse border border-slate-300 w-full text-[10px] print:text-[7px] print:border-black">
                            <thead className="bg-slate-800 text-white sticky top-0 z-20 print:bg-slate-200 print:text-black print:static">
                                <tr>
                                    <th rowSpan={2} className="px-2 py-1 text-left uppercase tracking-wider w-64 border border-slate-600 bg-slate-800 sticky left-0 z-30 print:bg-slate-200 print:static print:border-black print:w-48">
                                        PROFESORES
                                    </th>
                                    <th rowSpan={2} className="px-1 py-1 text-center uppercase tracking-wider w-16 border border-slate-600 bg-slate-800 sticky left-64 z-30 print:bg-slate-200 print:static print:border-black print:w-10">
                                        HRS
                                    </th>
                                    {WEEK_DAYS.map(day => (
                                        <th key={day} colSpan={7} className="px-1 py-1 text-center font-bold uppercase border border-slate-600 print:border-black">
                                            {day}
                                        </th>
                                    ))}
                                </tr>
                                <tr>
                                    {WEEK_DAYS.map(day => 
                                        CLASS_PERIODS.map(period => (
                                            <th key={`${day}-${period}`} className="px-1 py-1 text-center w-8 border border-slate-600 font-normal print:border-black">
                                                {period}a
                                            </th>
                                        ))
                                    )}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200 print:divide-black">
                                {renderSabanaSection('CARGA ACADÉMICA', 'academic', sabanaLayout.academic, academicStaff)}
                                {renderSabanaSection('TECNOLOGÍAS / TALLERES', 'technology', sabanaLayout.technology || [], technologyStaff)}
                                {renderSabanaSection('APOYO / AYUDANTES DE LABORATORIO / RED ESCOLAR', 'support', sabanaLayout.support, supportStaff)}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

        {/* --- TAB: TEACHER VIEW (OFFICIAL FORMAT) --- */}
        {activeTab === 'teacher' && (
            <div className="h-full flex flex-col">
                <div className="mb-6 print:hidden bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-end">
                    
                    {/* TEACHER SELECTOR: READ ONLY IF CURRENT USER IS TEACHER */}
                    <div className="flex flex-col">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Seleccionar Personal</label>
                        {currentUser?.role === 'teacher' ? (
                            <div className="w-full md:w-80 p-2 border border-slate-200 bg-slate-50 rounded-lg text-sm font-bold text-slate-700">
                                {currentUser.name}
                            </div>
                        ) : (
                            <select 
                                value={viewTeacherId}
                                onChange={(e) => setViewTeacherId(e.target.value)}
                                className="w-full md:w-80 p-2 border border-slate-300 rounded-lg text-sm"
                            >
                                <option value="">-- Seleccionar --</option>
                                <optgroup label="Docentes Académicos">
                                    {academicStaff.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </optgroup>
                                <optgroup label="Docentes Tecnologías">
                                    {technologyStaff.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </optgroup>
                                <optgroup label="Apoyo y Administrativos">
                                    {supportStaff.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </optgroup>
                            </select>
                        )}
                    </div>
                    
                    {/* Extra Fields for Printing - OCULTOS PARA DOCENTES */}
                    {currentUser?.role !== 'teacher' && (
                        <>
                            <div className="flex flex-col">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Horas Servicio</label>
                                <input 
                                    type="number" 
                                    className="w-24 p-2 border border-slate-300 rounded-lg text-sm" 
                                    value={extraHoursService} 
                                    onChange={e => setExtraHoursService(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Horas Tutoría</label>
                                <input 
                                    type="number" 
                                    className="w-24 p-2 border border-slate-300 rounded-lg text-sm" 
                                    value={extraHoursTutoria} 
                                    onChange={e => setExtraHoursTutoria(e.target.value)}
                                />
                            </div>
                            {/* BOTÓN EDITAR LEYENDA (MOVIDO AQUÍ) */}
                            <div className="flex flex-col justify-end">
                                <button 
                                    onClick={() => setShowFooterModal(true)}
                                    className="px-4 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 text-sm font-bold flex items-center gap-2"
                                >
                                    <FileText size={16} /> Editar Leyenda
                                </button>
                            </div>
                        </>
                    )}

                    <div className="flex-1 text-right">
                        <button 
                            onClick={handlePrint}
                            disabled={!viewTeacherId}
                            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                        >
                            <FileDown size={18} /> Imprimir Horario
                        </button>
                    </div>
                </div>

                {viewTeacherId ? (
                    <div className="bg-white shadow-lg mx-auto max-w-[215mm] min-h-[279mm] p-[10mm] print:shadow-none print:w-full print:max-w-none relative flex flex-col text-black font-sans">
                        
                        {/* Header Compacto */}
                        <div className="flex items-start justify-between mb-2">
                            <img src={SEP_LOGO_URL} alt="AEF" className="h-10 object-contain" />
                            <div className="text-center flex-1 px-4">
                                <div className="text-[9px] font-bold text-right w-full leading-tight">
                                    <p>Secretaría de Educación Pública</p>
                                    <p>Autoridad Educativa Federal en la Ciudad de México</p>
                                    <p>Inspección General de la Zona Escolar No. 69</p>
                                    <p>Escuela Secundaria Diurna No. 27</p>
                                    <p className="whitespace-nowrap">"Alfredo E. Uruchurtu"</p>
                                    <p>Turno Vespertino</p>
                                    <p>CCT 09DES4027P</p>
                                </div>
                                <div className="flex items-center justify-center gap-2 mt-1">
                                    <img src={LOGO_URL} alt="Escudo" className="h-14 w-14 object-contain" />
                                    <div className="text-center font-bold uppercase text-xs">
                                        <p className="text-xs">ESCUELA SECUNDARIA DIURNA No. 27</p>
                                        <p className="text-sm whitespace-nowrap">"ALFREDO E. URUCHURTU"</p>
                                        <p>TURNO VESPERTINO</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <h2 className="text-center text-base font-bold uppercase mb-4 tracking-wide">HORARIOS DEL CICLO ESCOLAR {schoolCycle}</h2>

                        <p className="text-justify text-xs mb-3">
                            Sirva tomar nota del Horario que le ha sido asignado para impartir su (s) clase (s) en el plantel durante el presente Ciclo Escolar.
                        </p>

                        {/* Info Box */}
                        <div className="border border-black rounded-sm mb-4 text-xs">
                            <div className="p-1.5 border-b border-black flex">
                                <span className="font-bold w-24">Profesor (a):</span>
                                <span className="uppercase font-bold">{allStaff.find(t => t.id === viewTeacherId)?.name}</span>
                            </div>
                            <div className="p-1.5 border-b border-black flex">
                                <span className="font-bold w-24">Disciplinas:</span>
                                <span>{getTeacherInfo(viewTeacherId).disciplines || '_______________________'}</span>
                            </div>
                            <div className="p-1.5 flex">
                                <span className="font-bold w-24">Grupos:</span>
                                <span>{getTeacherInfo(viewTeacherId).groups || '_______________________'}</span>
                            </div>
                        </div>

                        {/* Hours Summary */}
                        <div className="flex border border-black mb-4 text-xs text-center font-bold">
                            <div className="flex-1 border-r border-black p-1.5">
                                Horas frente a grupo: {calculateTotalHours(viewTeacherId)}
                            </div>
                            <div className="flex-1 border-r border-black p-1.5">
                                Horas de servicio: {extraHoursService || '0'}
                            </div>
                            <div className="flex-1 p-1.5">
                                Horas de tutoría: {extraHoursTutoria || '0'}
                            </div>
                        </div>
                        
                        {/* Total Hours */}
                        <div className="flex justify-end mb-4">
                            <div className="border border-black w-1/3 p-1 text-center font-bold text-xs">
                                Total de Horas: {calculateTotalHours(viewTeacherId) + (parseInt(extraHoursService) || 0) + (parseInt(extraHoursTutoria) || 0)}
                            </div>
                        </div>

                        {/* Schedule Table */}
                        <table className="w-full border-collapse border-2 border-black text-xs text-center mb-6">
                            <thead>
                                <tr className="bg-white">
                                    <th className="border border-black p-1 w-20">Hora</th>
                                    {WEEK_DAYS.map(d => <th key={d} className="border border-black p-1 w-28 uppercase">{d}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    const schedule = getTeacherScheduleMatrix(viewTeacherId);
                                    return TIME_SLOTS.map((slot) => {
                                        if (slot.id === 'recess') {
                                            return (
                                                <tr key="recess" className="bg-gray-200 print:bg-gray-200 print:print-color-adjust-exact">
                                                    <td className="border border-black p-1 text-[10px] font-bold">{slot.label}</td>
                                                    <td colSpan={5} className="border border-black p-1 font-bold tracking-widest">RECESO</td>
                                                </tr>
                                            );
                                        }
                                        
                                        const periodNum = slot.id as number;
                                        return (
                                            <tr key={slot.id}>
                                                <td className="border border-black p-1 text-[10px]">{slot.label}</td>
                                                {WEEK_DAYS.map(day => (
                                                    <td key={day} className="border border-black p-1 font-bold text-sm uppercase">
                                                        {schedule[periodNum][day] || ''}
                                                    </td>
                                                ))}
                                            </tr>
                                        );
                                    });
                                })()}
                            </tbody>
                        </table>

                        {/* Footer Text */}
                        <div className="mb-12 relative">
                            <p className="text-justify text-sm leading-relaxed whitespace-pre-wrap">
                                {data.scheduleFooterText || "Texto legal no definido."}
                            </p>
                        </div>

                        {/* Signature */}
                        <div className="mb-4">
                            <p className="mb-2 text-sm">Firma de recibido: ___________________________________________________</p>
                        </div>

                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-400">
                        Selecciona un docente para ver su horario oficial.
                    </div>
                )}
            </div>
        )}

        {/* --- TAB: GROUP VIEW (READ ONLY / PRINT) --- */}
        {activeTab === 'group' && (
             <div className="h-full flex flex-col max-w-[215mm] mx-auto">
                <div className="mb-6 print:hidden bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-end gap-4">
                    <div className="flex flex-col">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Seleccionar Grupo</label>
                        <select 
                            value={viewGradeGroup}
                            onChange={(e) => setViewGradeGroup(e.target.value)}
                            className="w-full md:w-48 p-2 border border-slate-300 rounded-lg text-sm"
                        >
                            <option value="">-- Seleccionar --</option>
                            {allGroups.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>
                    
                    <button 
                        onClick={handlePrint}
                        disabled={!viewGradeGroup}
                        className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                    >
                        <FileDown size={18} /> Imprimir Horario
                    </button>
                </div>

                {viewGradeGroup ? (
                    <div className="bg-white shadow-lg mx-auto max-w-[215mm] p-[10mm] print:shadow-none print:w-full print:max-w-none">
                        {/* Header Impresión */}
                        <div className="flex items-center gap-4 border-b-2 border-slate-800 pb-4 mb-6">
                            <img src={LOGO_URL} alt="Escudo" className="w-16 h-20 object-contain" />
                            <div className="flex-1 text-center">
                                <h1 className="text-sm font-bold uppercase">ESCUELA SECUNDARIA DIURNA No. 27</h1>
                                <h1 className="text-sm font-bold uppercase whitespace-nowrap">"ALFREDO E. URUCHURTU"</h1>
                                <p className="text-sm font-semibold text-slate-600">HORARIO DE GRUPO</p>
                                <p className="text-sm">Ciclo Escolar {schoolCycle}</p>
                            </div>
                        </div>

                        <div className="mb-4 text-sm font-bold uppercase p-2 bg-slate-100 border border-slate-300 flex justify-between">
                            <span>GRUPO: {viewGradeGroup}</span>
                            <span>TURNO: {data.turno}</span>
                        </div>

                        {/* Schedule Table */}
                        <table className="w-full border-collapse border-2 border-black text-xs text-center">
                            <thead>
                                <tr className="bg-slate-200 print:bg-slate-300">
                                    <th className="border border-black p-2 w-24">HORA</th>
                                    {WEEK_DAYS.map(d => <th key={d} className="border border-black p-2 w-32 uppercase">{d}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    const schedule = getGroupScheduleMatrix(viewGradeGroup);
                                    return TIME_SLOTS.map((slot) => {
                                        // Render Recess Row
                                        if (slot.id === 'recess') {
                                            return (
                                                <tr key="recess" className="bg-gray-200 print:bg-gray-200 print:print-color-adjust-exact h-8">
                                                    <td className="border border-black p-1 text-[10px] font-bold">{slot.label}</td>
                                                    <td colSpan={5} className="border border-black p-1 font-bold tracking-widest text-center">RECESO</td>
                                                </tr>
                                            );
                                        }

                                        // Render Class Row
                                        const periodNum = slot.id as number;
                                        return (
                                            <tr key={periodNum} className="h-14">
                                                {/* Time Label */}
                                                <td className="border border-black p-1 font-bold bg-slate-50 align-middle text-[10px] whitespace-nowrap">
                                                    {slot.label}
                                                </td>
                                                {/* Day Cells */}
                                                {WEEK_DAYS.map(day => {
                                                    const cell = schedule[periodNum][day];
                                                    return (
                                                        <td key={day} className="border border-black p-1 align-middle">
                                                            {/* SOLO ASIGNATURA */}
                                                            {cell.subject && (
                                                                <div className="flex items-center justify-center h-full font-bold text-[10px] uppercase leading-tight">
                                                                    {cell.subject}
                                                                </div>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    });
                                })()}
                            </tbody>
                        </table>
                        
                        {/* Summary Table (Below Schedule) */}
                        <div className="mt-6">
                            <h3 className="text-xs font-bold mb-2 border-b border-black inline-block">RELACIÓN DE ASIGNATURAS Y DOCENTES</h3>
                            <table className="w-full border-collapse border border-black text-[10px]">
                                <thead>
                                    <tr className="bg-slate-100 print:bg-slate-200">
                                        <th className="border border-black p-1 text-left pl-4">ASIGNATURA</th>
                                        <th className="border border-black p-1 text-left pl-4">PROFESOR(A)</th>
                                        <th className="border border-black p-1 text-center w-20">HORAS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {getGroupSummary(viewGradeGroup).map((item, idx) => (
                                        <tr key={idx} className="print:h-5">
                                            <td className="border border-black p-1 pl-4 font-bold">{item.subject}</td>
                                            <td className="border border-black p-1 pl-4 uppercase">{item.teacher}</td>
                                            <td className="border border-black p-1 text-center">{item.hours}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer Generalizado para Horario de Grupo */}
                        <div className="mt-8 text-[9px] text-slate-500 text-justify leading-relaxed whitespace-pre-wrap">
                            * El presente horario está sujeto a cambios por necesidades del servicio educativo.
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-400">
                        Selecciona un grupo para ver su horario.
                    </div>
                )}
             </div>
        )}

      </div>

      {/* --- FOOTER EDIT MODAL --- */}
      {showFooterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm print:hidden">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-fade-in-up overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="text-lg font-bold text-slate-800">Editar Leyenda Legal del Horario</h3>
                      <button onClick={() => setShowFooterModal(false)} className="text-slate-400 hover:text-slate-600">
                          <X size={20} />
                      </button>
                  </div>
                  <div className="p-6">
                      <p className="text-sm text-slate-500 mb-2">Este texto aparecerá al pie de página de los <strong>Horarios del Personal</strong>.</p>
                      <textarea 
                          value={tempFooterText}
                          onChange={(e) => setTempFooterText(e.target.value)}
                          className="w-full p-4 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-48 resize-none"
                          placeholder="Ingrese el texto legal..."
                      />
                      <div className="flex gap-3 mt-6">
                          <button onClick={() => setShowFooterModal(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-bold">
                              Cancelar
                          </button>
                          <button onClick={handleSaveFooter} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-lg flex justify-center items-center gap-2">
                              <Check size={18} /> Guardar Cambios
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default SchedulesView;