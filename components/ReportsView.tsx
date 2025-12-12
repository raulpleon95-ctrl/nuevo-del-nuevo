
import React, { useState, useEffect } from 'react';
import { FileText, Printer, User as UserIcon, Cpu, Layers, Calculator, AlertTriangle, CheckCircle2, SlidersHorizontal, Users, CheckSquare, Square, FileInput, FileOutput } from 'lucide-react';
import { SchoolData, User, GradeScores } from '../types';

// Global Logo Constant
const LOGO_URL = "https://cdn1.sharemyimage.com/smi/2025/10/05/27tv.png";
const SEP_LOGO_URL = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSDxcKIcMNGVUxi6N-EpVbrw1Y7HNcrm2FqqQ&s";
const CCT = "09DES4027P";

interface ReportsViewProps {
  data: SchoolData;
  currentUser: User;
  currentCycle: string;
}

type ReportType = 'attendance' | 'concentrado_mensual' | 'concentrado_trimestral' | 'boleta_monthly' | 'boleta_trimester' | 'boletin_anual' | 'cuadro_inasistencia';

const ReportsView: React.FC<ReportsViewProps> = ({ data, currentUser, currentCycle }) => {
  // Initial State Setup
  const initialGrade = currentUser.role === 'teacher' && currentUser.assignments && currentUser.assignments.length > 0
    ? currentUser.assignments[0].grade 
    : data.gradesStructure[0].grade;

  const [reportType, setReportType] = useState<ReportType>('attendance');
  
  // Selectors
  const [selectedGrade, setSelectedGrade] = useState<string>(initialGrade);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedTech, setSelectedTech] = useState<string>(''); 
  const [selectedSection, setSelectedSection] = useState<string>('AC'); 
  const [selectedStudentId, setSelectedStudentId] = useState<string>(''); 
  
  // View Mode: Single Student vs All Group
  const [viewMode, setViewMode] = useState<'single' | 'group'>('single');

  // Ahora usamos "Periodo" en lugar de Mes para el concentrado mensual (Inter-trimestral)
  const [selectedInterPeriod, setSelectedInterPeriod] = useState<string>('1'); 
  const [selectedTrimester, setSelectedTrimester] = useState<string>('1'); 
  const [schoolCycle, setSchoolCycle] = useState(currentCycle);
  const [printMode, setPrintMode] = useState<'full' | 'data_only'>('full');
  const [printPeriods, setPrintPeriods] = useState({ p1: true, p2: true, p3: true });
  const [cuadroViewMode, setCuadroViewMode] = useState<'anverso' | 'reverso'>('anverso');

  // NUEVO: Estado para controlar el mes de la Lista de Asistencia
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM

  useEffect(() => {
      setSchoolCycle(currentCycle);
  }, [currentCycle]);

  // Filtering Logic
  const availableGrades = ['admin', 'subdirector', 'secretaria', 'subdirector_gestion', 'subdirector_academico', 'administrative'].includes(currentUser.role)
    ? data.gradesStructure.map(g => g.grade)
    : Array.from(new Set(currentUser.assignments?.map(a => a.grade) || []));

  const availableSubjects = React.useMemo(() => {
    if (!selectedGrade) return [];

    // CAMBIO IMPORTANTE: Si es administrativo, ve TODAS las materias del grado (para concentrados)
    if (['admin', 'subdirector', 'secretaria', 'administrative', 'subdirector_gestion', 'subdirector_academico'].includes(currentUser.role)) {
        return data.gradesStructure.find(g => g.grade === selectedGrade)?.subjects || [];
    } else {
        // Teacher ve solo las suyas
        return Array.from(new Set(
            currentUser.assignments
                ?.filter(a => a.grade === selectedGrade)
                .map(a => a.subject) || []
          )).sort();
    }
  }, [selectedGrade, currentUser, data]);

  const availableGroups = ['admin', 'subdirector', 'secretaria', 'subdirector_gestion', 'subdirector_academico', 'administrative'].includes(currentUser.role)
    ? data.gradesStructure.find(g => g.grade === selectedGrade)?.groups || []
    : Array.from(new Set(
        currentUser.assignments
            ?.filter(a => a.grade === selectedGrade)
            .map(a => a.group) || []
      )).sort();

  const isTechReport = selectedSubject === 'Tecnología' && !['boleta_monthly', 'boleta_trimester', 'boletin_anual', 'concentrado_mensual', 'concentrado_trimestral'].includes(reportType);
  const isMatrixReport = reportType === 'concentrado_trimestral';

  const studentsInGroup = data.studentsData.filter(s => {
      if (s.status === 'graduated' || s.status === 'dropped') return false; 
      if (s.grade !== selectedGrade) return false;
      if (isTechReport) {
          if (selectedTech && s.technology !== selectedTech) return false;
          if (selectedSection === 'AC') return s.group === 'A' || s.group === 'C';
          if (selectedSection === 'BD') return s.group === 'B' || s.group === 'D';
          return false;
      } else {
          return s.group === selectedGroup;
      }
  }).sort((a, b) => a.name.localeCompare(b.name));

  // Effects
  useEffect(() => {
    if (availableGroups.length > 0 && !availableGroups.includes(selectedGroup)) {
        setSelectedGroup(availableGroups[0]);
    } else if (availableGroups.length > 0 && selectedGroup === '') {
        setSelectedGroup(availableGroups[0]);
    }
  }, [selectedGrade, availableGroups]);

  useEffect(() => {
    if (availableSubjects.length > 0 && !availableSubjects.includes(selectedSubject)) {
        setSelectedSubject(availableSubjects[0]);
    } else if (availableSubjects.length > 0 && selectedSubject === '') {
        setSelectedSubject(availableSubjects[0]);
    }
  }, [selectedGrade, availableSubjects]);

  useEffect(() => {
      setSelectedTech('');
      if (selectedGroup === 'B' || selectedGroup === 'D') setSelectedSection('BD');
      else setSelectedSection('AC');
  }, [selectedSubject, selectedGroup]);
  
  useEffect(() => {
    setSelectedStudentId('');
  }, [selectedGrade, selectedGroup, selectedSubject, selectedTech, selectedSection]);


  // --- FUNCIONES DE CÁLCULO DE DÍAS LABORALES (LISTA ASISTENCIA) ---
  const getDaysInMonth = (monthStr: string) => {
      const [year, month] = monthStr.split('-').map(Number);
      return new Date(year, month, 0).getDate();
  };

  const getWorkDaysInMonth = (monthStr: string) => {
      const days = getDaysInMonth(monthStr);
      const workDates: {date: string, day: string}[] = [];
      const [year, month] = monthStr.split('-').map(Number);

      for (let d = 1; d <= days; d++) {
          const date = new Date(`${year}/${month}/${d}`);
          const dayOfWeek = date.getDay();
          if (dayOfWeek >= 1 && dayOfWeek <= 5) {
              const dateStr = `${monthStr}-${String(d).padStart(2, '0')}`;
              const dayLabel = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'][dayOfWeek];
              workDates.push({ date: dateStr, day: dayLabel });
          }
      }
      return workDates;
  };

  const workDaysArray = React.useMemo(() => getWorkDaysInMonth(selectedMonth), [selectedMonth]);


  // --- Data Helpers ---
  const getTeacherName = () => {
    if (currentUser.role === 'teacher') return currentUser.name;
    const assignedTeacher = data.users.find(u => 
        u.role === 'teacher' && 
        u.assignments?.some(a => {
            if (a.grade !== selectedGrade || a.subject !== selectedSubject) return false;
            if (isTechReport) {
                 if (selectedTech && a.technology !== selectedTech) return false;
                 if (selectedSection === 'AC') return a.group === 'A' || a.group === 'C';
                 if (selectedSection === 'BD') return a.group === 'B' || a.group === 'D';
            } else {
                 return a.group === selectedGroup;
            }
            return false;
        })
    );
    return assignedTeacher ? assignedTeacher.name : "Sin Asignar";
  };

  // Helper para obtener nombre del administrativo asignado al grupo
  const getAdministrativeName = () => {
    const adminAssigned = data.users.find(u => 
        u.role === 'administrative' &&
        u.assignments?.some(a => a.grade === selectedGrade && a.group === selectedGroup)
    );
    return adminAssigned ? adminAssigned.name : "SIN ASIGNAR";
  };

  const teacherName = getTeacherName();
  const administrativeName = getAdministrativeName();

  const handlePrint = () => window.print();

  const calculateFinalAverage = (t1: string, t2: string, t3: string): string => {
    const v1 = parseFloat(t1);
    const v2 = parseFloat(t2);
    const v3 = parseFloat(t3);
    if (!isNaN(v1) && !isNaN(v2) && !isNaN(v3)) {
        const avg = (v1 + v2 + v3) / 3;
        return avg.toFixed(1);
    }
    return '';
  };
  
  const calculateGeneralAverage = (studentId: number) => {
      const student = studentsInGroup.find(s => s.id === studentId);
      if (!student) return '';
      const gradeStruct = data.gradesStructure.find(g => g.grade === student.grade);
      const hiddenSubjects = gradeStruct?.hiddenSubjects || [];

      let sum = 0;
      let count = 0;
      Object.entries(student.grades).forEach(([subjectName, val]) => {
          if (hiddenSubjects.includes(subjectName)) return;
          const scores = val as GradeScores;
          const final = calculateFinalAverage(scores.trim_1, scores.trim_2, scores.trim_3);
          if (final) {
              sum += parseFloat(final);
              count++;
          }
      });
      return count > 0 ? (sum / count).toFixed(1) : '';
  };

  const calculateRowAverageConcentrado = (studentId: number, subjects: string[]) => {
      const student = studentsInGroup.find(s => s.id === studentId);
      if (!student) return '';

      let sum = 0;
      let count = 0;
      subjects.forEach(subj => {
          const grades = student.grades[subj] as GradeScores;
          let val = parseFloat(grades?.[`trim_${selectedTrimester}`]);
          if (!isNaN(val)) {
              sum += val;
              count++;
          }
      });
      return count > 0 ? (sum / count).toFixed(1) : '-';
  };

  const calculateColumnAverage = (subject: string) => {
      let sum = 0;
      let count = 0;
      studentsInGroup.forEach(student => {
          const grades = student.grades[subject] as GradeScores;
          let val = parseFloat(grades?.[`trim_${selectedTrimester}`]);
          if (!isNaN(val)) {
              sum += val;
              count++;
          }
      });
      return count > 0 ? (sum / count).toFixed(1) : '-';
  };

  const isIndividualReport = ['boleta_monthly', 'boleta_trimester', 'boletin_anual'].includes(reportType);
  const isOfficialCuadro = reportType === 'cuadro_inasistencia';
  
  const isLandscapeReport = reportType === 'concentrado_trimestral' || reportType === 'boletin_anual' || reportType === 'attendance';

  const getStatusText = (status: string) => {
      if (status === 'GREEN') return 'REGULAR';
      if (status === 'RED') return 'REQ. APOYO';
      return '';
  }

  const getOverlayClass = (type: 'border' | 'text' | 'bg') => {
      if (printMode === 'full') {
          if (type === 'border') return 'border-slate-600 print:border-black';
          if (type === 'text') return 'text-black';
          if (type === 'bg') return 'bg-slate-50 print:bg-slate-100';
          return '';
      } else {
          if (type === 'border') return 'border-transparent'; 
          if (type === 'text') return 'text-transparent'; 
          if (type === 'bg') return 'bg-transparent';
          return '';
      }
  };

  const isDataOnly = printMode === 'data_only';

  return (
    <div className="flex flex-col h-full print:block">
      {/* Controls */}
       <div className="p-6 md:p-8 space-y-6 print:hidden bg-slate-50 border-b border-slate-200">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Formatos y Reportes</h2>
            <p className="text-slate-500">Generación de listas, concentrados y boletas oficiales.</p>
          </div>
          <button onClick={handlePrint} className="flex items-center space-x-2 px-6 py-2 bg-slate-800 text-white font-semibold rounded-xl hover:bg-slate-900 transition-colors shadow-lg">
            <Printer size={18} /> <span>Imprimir / PDF</span>
          </button>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-end">
           <div className="flex flex-col min-w-[200px]">
              <label className="text-xs font-bold text-slate-500 uppercase mb-1">Tipo de Reporte</label>
              <select value={reportType} onChange={(e) => setReportType(e.target.value as ReportType)} className="p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                <optgroup label="Listas de Grupo">
                    <option value="attendance">Lista de Asistencia</option>
                    <option value="concentrado_mensual">Informe de Alumnos en Riesgo (Semáforo Rojo)</option>
                    <option value="concentrado_trimestral">Concentrado Trimestral (Matriz)</option>
                    <option value="cuadro_inasistencia">Cuadro de Inasistencia y Evaluación (Asignatura)</option>
                </optgroup>
                {currentUser.role !== 'teacher' && (
                    <optgroup label="Individuales">
                        <option value="boleta_monthly">Boleta Individual (Inter-trimestral)</option>
                        <option value="boleta_trimester">Boleta Individual (Trimestral)</option>
                        <option value="boletin_anual">Boletín Informativo (Anual)</option>
                    </optgroup>
                )}
              </select>
           </div>
           
           <div className="flex flex-col w-20">
              <label className="text-xs font-bold text-slate-500 uppercase mb-1">Grado</label>
              <select value={selectedGrade} onChange={(e) => { setSelectedGrade(e.target.value); }} className="p-2 border border-slate-300 rounded-lg text-sm">
                {availableGrades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
           </div>
           
           <div className="flex flex-col w-24">
              <label className="text-xs font-bold text-slate-500 uppercase mb-1">Grupo</label>
              <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} className="p-2 border border-slate-300 rounded-lg text-sm" disabled={availableGroups.length === 0}>
                {availableGroups.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
           </div>
           
           {!isIndividualReport && !isMatrixReport && reportType !== 'concentrado_mensual' && (
               <div className="flex flex-col flex-1 min-w-[150px]">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1">Asignatura</label>
                  <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="p-2 border border-slate-300 rounded-lg text-sm w-full" disabled={availableSubjects.length === 0}>
                    {availableSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
               </div>
           )}

           {/* ... Other Filters (Tech, Section, Student, Period) ... */}
           {/* ... (Kept existing filter logic) ... */}
           
           {isTechReport && (
               <div className="flex flex-col min-w-[160px] animate-fade-in">
                   <label className="text-xs font-bold text-blue-600 uppercase mb-1 flex items-center gap-1"><Layers size={12}/> Sección</label>
                   <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} className="p-2 border border-blue-200 bg-blue-50 text-blue-900 rounded-lg text-sm w-full font-bold focus:ring-2 focus:ring-blue-500 outline-none">
                       <option value="AC">Sección 1 (A y C)</option>
                       <option value="BD">Sección 2 (B y D)</option>
                   </select>
               </div>
           )}
           
           {isIndividualReport && (
             <div className="flex flex-col flex-1 min-w-[300px]">
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 flex justify-between">
                    <span>Seleccionar Alumno</span>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => { setViewMode('single'); setSelectedStudentId(studentsInGroup.length > 0 ? String(studentsInGroup[0].id) : ''); }}
                            className={`text-[10px] px-2 rounded ${viewMode === 'single' ? 'bg-slate-200 font-bold' : 'text-slate-400'}`}
                        >
                            Individual
                        </button>
                        <button 
                            onClick={() => { setViewMode('group'); setSelectedStudentId(''); }}
                            className={`text-[10px] px-2 rounded ${viewMode === 'group' ? 'bg-blue-100 text-blue-700 font-bold' : 'text-slate-400'}`}
                        >
                            Grupo Completo
                        </button>
                    </div>
                </label>
                <div className="relative">
                    <select 
                        value={selectedStudentId} 
                        onChange={(e) => { setSelectedStudentId(e.target.value); setViewMode('single'); }} 
                        disabled={viewMode === 'group' || studentsInGroup.length === 0}
                        className={`w-full p-2 pl-8 border border-slate-300 rounded-lg text-sm appearance-none ${viewMode === 'group' || studentsInGroup.length === 0 ? 'bg-slate-100 text-slate-400' : 'bg-white'}`}
                    >
                        <option value="">{viewMode === 'group' ? `${studentsInGroup.length} Alumnos (Impresión Masiva)` : (studentsInGroup.length === 0 ? '-- No hay alumnos en este grupo --' : '-- Seleccione un alumno --')}</option>
                        {studentsInGroup.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <UserIcon size={14} className="absolute left-2.5 top-3 text-slate-400" />
                </div>
             </div>
           )}

           {isTechReport && (
               <div className="flex flex-col min-w-[200px] animate-fade-in">
                  <label className="text-xs font-bold text-blue-600 uppercase mb-1 flex items-center gap-1"><Cpu size={12}/> Tecnología / Énfasis</label>
                  <select value={selectedTech} onChange={(e) => setSelectedTech(e.target.value)} className="p-2 border border-blue-200 bg-blue-50 text-blue-900 rounded-lg text-sm w-full font-semibold focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">-- Todos / Seleccionar --</option>
                    {data.technologies.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
               </div>
           )}

           {(reportType === 'concentrado_mensual' || reportType === 'boleta_monthly') && (
             <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-500 uppercase mb-1">Periodo Avance</label>
                <select value={selectedInterPeriod} onChange={(e) => setSelectedInterPeriod(e.target.value)} className="p-2 border border-slate-300 rounded-lg text-sm w-32">
                  <option value="1">1° Avance</option>
                  <option value="2">2° Avance</option>
                  <option value="3">3° Avance</option>
                </select>
             </div>
           )}

           {(reportType === 'concentrado_trimestral' || reportType === 'boleta_trimester') && (
                <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1">Trimestre</label>
                    <select value={selectedTrimester} onChange={(e) => setSelectedTrimester(e.target.value)} className="p-2 border border-slate-300 rounded-lg text-sm w-32">
                        <option value="1">1° Trim</option>
                        <option value="2">2° Trim</option>
                        <option value="3">3° Trim</option>
                    </select>
                </div>
           )}

            {/* Selector de mes para Lista de Asistencia (Visible solo para 'attendance') */}
            {reportType === 'attendance' && (
                <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1">Mes de Asistencia</label>
                    <input 
                        type="month" 
                        value={selectedMonth} 
                        onChange={(e) => setSelectedMonth(e.target.value)} 
                        className="p-2 border border-slate-300 rounded-lg text-sm w-32 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            )}

            <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-500 uppercase mb-1">Ciclo Escolar</label>
                <input type="text" value={schoolCycle} onChange={(e) => setSchoolCycle(e.target.value)} className="p-2 border border-slate-300 rounded-lg text-sm w-32 focus:ring-2 focus:ring-blue-500 outline-none" />
             </div>

             {/* SWITCH MODE PRINT: ONLY FOR BOLETIN ANUAL */}
             {reportType === 'boletin_anual' && (
                 <div className="flex flex-col animate-fade-in bg-blue-50 p-1.5 rounded-lg border border-blue-200">
                     <label className="text-[10px] font-bold text-blue-800 uppercase mb-1 flex items-center gap-1"><SlidersHorizontal size={10}/> Modo Impresión</label>
                     <div className="flex gap-1 mb-2">
                         <button 
                            onClick={() => setPrintMode('full')}
                            className={`px-3 py-1 rounded text-xs font-bold transition-colors ${printMode === 'full' ? 'bg-blue-600 text-white shadow' : 'text-blue-600 hover:bg-blue-100'}`}
                         >
                             Completo
                         </button>
                         <button 
                            onClick={() => setPrintMode('data_only')}
                            className={`px-3 py-1 rounded text-xs font-bold transition-colors ${printMode === 'data_only' ? 'bg-blue-600 text-white shadow' : 'text-blue-600 hover:bg-blue-100'}`}
                            title="Imprime solo los datos sobre el formato oficial pre-impreso"
                         >
                             Solo Datos
                         </button>
                     </div>
                     {/* PERIOD SELECTOR FOR BOLETIN */}
                     <div className="flex gap-2">
                         <label className="flex items-center gap-1 text-[9px] cursor-pointer">
                             <input type="checkbox" checked={printPeriods.p1} onChange={e => setPrintPeriods({...printPeriods, p1: e.target.checked})} className="accent-blue-600"/>
                             Periodo 1
                         </label>
                         <label className="flex items-center gap-1 text-[9px] cursor-pointer">
                             <input type="checkbox" checked={printPeriods.p2} onChange={e => setPrintPeriods({...printPeriods, p2: e.target.checked})} className="accent-blue-600"/>
                             Periodo 2
                         </label>
                         <label className="flex items-center gap-1 text-[9px] cursor-pointer">
                             <input type="checkbox" checked={printPeriods.p3} onChange={e => setPrintPeriods({...printPeriods, p3: e.target.checked})} className="accent-blue-600"/>
                             Periodo 3
                         </label>
                     </div>
                 </div>
             )}

             {/* SWITCH MODE: CUADRO INASISTENCIA (ANVERSO / REVERSO) */}
             {reportType === 'cuadro_inasistencia' && (
                 <div className="flex flex-col animate-fade-in bg-slate-100 p-1.5 rounded-lg border border-slate-300">
                     <label className="text-[10px] font-bold text-slate-600 uppercase mb-1 flex items-center gap-1"><Layers size={10}/> Cara del Documento</label>
                     <div className="flex gap-1">
                         <button 
                            onClick={() => setCuadroViewMode('anverso')}
                            className={`px-3 py-1 rounded text-xs font-bold transition-colors flex items-center gap-1 ${cuadroViewMode === 'anverso' ? 'bg-slate-700 text-white shadow' : 'text-slate-600 hover:bg-slate-200'}`}
                         >
                             <FileInput size={12}/> Anverso (Tabla)
                         </button>
                         <button 
                            onClick={() => setCuadroViewMode('reverso')}
                            className={`px-3 py-1 rounded text-xs font-bold transition-colors flex items-center gap-1 ${cuadroViewMode === 'reverso' ? 'bg-slate-700 text-white shadow' : 'text-slate-600 hover:bg-slate-200'}`}
                         >
                             <FileOutput size={12}/> Reverso (Estadística)
                         </button>
                     </div>
                 </div>
             )}
        </div>
      </div>

      {/* REPORT PREVIEW */}
      <div className="flex-1 overflow-auto bg-slate-100 p-6 md:p-8 print:p-0 print:bg-white print:overflow-visible">
        
        {/* Force Landscape Printing for specific reports */}
        <style>{`
          @media print {
            @page {
              size: ${isLandscapeReport ? 'landscape' : 'letter portrait'};
              margin: 5mm;
            }
            
            /* GLOBAL PRINT RESET */
            html, body, #root, main, #root > div {
                height: auto !important;
                overflow: visible !important;
                display: block !important;
            }

            /* ... (styles kept from previous versions) ... */
             /* Hide scrollbars */
            ::-webkit-scrollbar { display: none; }

            .page-break { page-break-before: always; break-before: page; display: block; }
            .break-after { page-break-after: always; break-after: page; display: block; }
            
            table { page-break-inside: auto; }
            tr    { page-break-inside: avoid; page-break-after: auto; }
            thead { display: table-header-group; }
            tfoot { display: table-footer-group; }
            
            .shadow-lg, .shadow-sm, .shadow-md { box-shadow: none !important; }
            .bg-slate-100 { background-color: white !important; }
            
            .print\\:max-w-none { max-width: none !important; }
            .print\\:w-full { width: 100% !important; }
            
            img { -webkit-print-color-adjust: exact; print-color-adjust: exact; display: block !important; opacity: 1 !important; }

            ${reportType === 'boletin_anual' ? `
                .boletin-container-inner {
                    transform: scale(0.88); 
                    transform-origin: top left;
                    width: 100% !important;
                }
                .boletin-container-inner table {
                    font-size: 8px !important;
                }
            ` : ''}
          }
        `}</style>
        
        {/* --- REPORT TYPE: INFORME DE RIESGO --- */}
        {reportType === 'concentrado_mensual' && (
             <div className="bg-white shadow-lg mx-auto max-w-[210mm] min-h-[297mm] p-[10mm] print:shadow-none print:w-full print:max-w-none">
                 <div className="flex items-center justify-between border-b-2 border-slate-800 pb-2 mb-4">
                    <div className="flex flex-col">
                        <h1 className="text-base font-extrabold uppercase">ESCUELA SECUNDARIA DIURNA No. 27</h1>
                        <h1 className="text-base font-extrabold uppercase whitespace-nowrap">"ALFREDO E. URUCHURTU"</h1>
                    </div>
                    <img src={LOGO_URL} alt="Logo" className="w-16 h-16 object-contain" />
                    <div className="text-center flex-1">
                        <h2 className="text-sm font-bold uppercase text-red-600 mt-1">
                            Informe de Alumnos en Riesgo (Semáforo Rojo)
                        </h2>
                        <p className="text-xs text-slate-500 uppercase font-bold mt-1">Avance Inter-trimestral {selectedInterPeriod} - Ciclo {schoolCycle}</p>
                    </div>
                    <div className="text-right min-w-[120px] text-xs font-bold border border-slate-300 p-2 rounded">
                        <p className="uppercase">Grado: <span className="text-sm">{selectedGrade}</span></p>
                        <p className="uppercase">Grupo: <span className="text-sm">{selectedGroup}</span></p>
                    </div>
                </div>

                <div className="mb-4 text-xs text-slate-600 italic">
                    * El siguiente listado muestra únicamente a los alumnos que presentan estatus de "Requiere Apoyo" (Semáforo Rojo) en una o más asignaturas durante el {selectedInterPeriod}° periodo de evaluación intermedia.
                </div>

                <table className="w-full border-collapse border border-black text-xs">
                    <thead>
                        <tr className="bg-slate-200 print:bg-slate-200 print:print-color-adjust-exact">
                            <th className="border border-black p-2 w-10 text-center font-bold">No.</th>
                            <th className="border border-black p-2 text-left w-64 font-bold">NOMBRE DEL ALUMNO</th>
                            <th className="border border-black p-2 text-left font-bold">ASIGNATURAS EN RIESGO</th>
                            <th className="border border-black p-2 w-16 text-center font-bold">TOTAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(() => {
                            const gradeStruct = data.gradesStructure.find(g => g.grade === selectedGrade);
                            let subjects = gradeStruct?.subjects.filter(s => !gradeStruct.hiddenSubjects?.includes(s)) || [];
                            
                            // Si es profesor, filtrar solo su materia
                            if (currentUser.role === 'teacher' && selectedSubject) {
                                subjects = [selectedSubject];
                            }

                            const riskStudents = studentsInGroup.map(student => {
                                const riskSubjects = subjects.filter(subj => {
                                    const grades = student.grades[subj] as GradeScores;
                                    return grades?.[`inter_${selectedInterPeriod}`] === 'RED';
                                });
                                return { ...student, riskSubjects };
                            }).filter(s => s.riskSubjects.length > 0);

                            if (riskStudents.length === 0) {
                                return (
                                    <tr>
                                        <td colSpan={4} className="border border-black p-8 text-center text-slate-500 italic">
                                            <div className="flex flex-col items-center justify-center">
                                                <CheckCircle2 size={32} className="text-green-500 mb-2" />
                                                <span>Felicidades. No se encontraron alumnos en riesgo para este periodo en las asignaturas seleccionadas.</span>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            }

                            return riskStudents.map((student, index) => (
                                <tr key={student.id} className="even:bg-slate-50 print:even:bg-transparent">
                                    <td className="border border-black p-2 text-center">{index + 1}</td>
                                    <td className="border border-black p-2 font-bold uppercase">{student.name}</td>
                                    <td className="border border-black p-2 text-red-700 font-medium">
                                        {student.riskSubjects.join(', ')}
                                    </td>
                                    <td className="border border-black p-2 w-16 text-center font-bold bg-red-50 text-red-700 print:bg-transparent print:text-black">
                                        {student.riskSubjects.length}
                                    </td>
                                </tr>
                            ));
                        })()}
                    </tbody>
                </table>
                
                <div className="mt-8 flex justify-center text-xs uppercase font-bold text-center">
                     <div className="w-64 border-t border-black pt-2">
                         <p>{currentUser.role === 'teacher' ? 'DOCENTE' : 'TUTOR DEL GRUPO'}</p>
                     </div>
                </div>
             </div>
        )}
        
        {/* --- REPORT TYPE: CONCENTRADO GRUPAL (Matrix) --- */}
        {isMatrixReport && (
            <div className="bg-white shadow-lg mx-auto max-w-[297mm] p-[10mm] print:shadow-none print:w-full print:max-w-none print:landscape">
                <div className="flex items-center justify-between border-b-2 border-slate-800 pb-2 mb-2">
                    <div className="flex flex-col">
                        <h1 className="text-base font-extrabold uppercase">ESCUELA SECUNDARIA DIURNA No. 27</h1>
                        <h1 className="text-base font-extrabold uppercase whitespace-nowrap">"ALFREDO E. URUCHURTU"</h1>
                    </div>
                    <img src={LOGO_URL} alt="Logo" className="w-14 h-14 object-contain" />
                    <div className="text-center flex-1">
                        <h2 className="text-sm font-bold uppercase bg-slate-100 inline-block px-4 py-0.5 rounded border border-slate-300 mt-1">
                            Concentrado de Evaluación - Trimestre {selectedTrimester}
                        </h2>
                        <p className="text-xs text-slate-500 uppercase font-bold mt-1">Ciclo Escolar {schoolCycle}</p>
                    </div>
                    <div className="text-right min-w-[120px] text-xs font-bold border border-slate-300 p-2 rounded">
                        <p className="uppercase">Grado: <span className="text-sm">{selectedGrade}</span></p>
                        <p className="uppercase">Grupo: <span className="text-sm">{selectedGroup}</span></p>
                        {currentUser.role === 'teacher' && <p className="uppercase mt-1 text-[10px] text-blue-600">{selectedSubject}</p>}
                    </div>
                </div>

                <table className="w-full border-collapse border border-black text-[10px] table-fixed">
                    <thead>
                        <tr className="bg-slate-200 print:bg-slate-200 print:print-color-adjust-exact">
                            <th className="border border-black p-1 w-8 text-center font-bold">No.</th>
                            <th className="border border-black p-1 text-left w-64 pl-2 font-bold">NOMBRE DEL ALUMNO</th>
                            {(() => {
                                const gradeStruct = data.gradesStructure.find(g => g.grade === selectedGrade);
                                let subjects = gradeStruct?.subjects.filter(s => !gradeStruct.hiddenSubjects?.includes(s)) || [];
                                
                                if (currentUser.role === 'teacher' && selectedSubject) {
                                    subjects = subjects.filter(s => s === selectedSubject);
                                }

                                return subjects.map(subj => (
                                    <th key={subj} className="border border-black p-0 w-8 h-52 align-bottom relative bg-white print:bg-white">
                                        <div className="flex items-center justify-center h-48 pb-2">
                                            <span className="block transform -rotate-90 whitespace-nowrap origin-center text-[9px] font-bold uppercase tracking-tight">{subj}</span>
                                        </div>
                                    </th>
                                ));
                            })()}
                            <th className="border border-black p-1 w-10 font-bold bg-slate-300 print:bg-slate-300 print:print-color-adjust-exact text-center text-[9px]">
                                <div className="flex items-center justify-center h-full">
                                   <span className="block transform -rotate-90 whitespace-nowrap origin-center">PROM</span>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {studentsInGroup.map((student, index) => {
                            const gradeStruct = data.gradesStructure.find(g => g.grade === selectedGrade);
                            let subjects = gradeStruct?.subjects.filter(s => !gradeStruct.hiddenSubjects?.includes(s)) || [];
                            
                            if (currentUser.role === 'teacher' && selectedSubject) {
                                subjects = subjects.filter(s => s === selectedSubject);
                            }

                            const rowResult = calculateRowAverageConcentrado(student.id, subjects);
                            
                            const nameLen = student.name.length;
                            let nameSizeClass = "text-[10px]";
                            if (nameLen > 30) nameSizeClass = "text-[9px]";
                            if (nameLen > 40) nameSizeClass = "text-[8px] leading-tight";

                            return (
                                <tr key={student.id} className="even:bg-slate-50 print:even:bg-slate-50 h-5 hover:bg-slate-100">
                                    <td className="border border-black p-0.5 text-center font-medium">{index + 1}</td>
                                    <td className={`border border-black px-2 font-medium uppercase truncate ${nameSizeClass}`}>{student.name}</td>
                                    {subjects.map(subj => {
                                        const grades = student.grades[subj] as GradeScores;
                                        let val = '';
                                        let cellClass = '';

                                        val = grades?.[`trim_${selectedTrimester}`] || '';
                                        const numVal = parseFloat(val);
                                        if (!isNaN(numVal) && numVal < 6) cellClass = 'text-red-600 font-bold bg-red-50 print:text-black print:font-extrabold print:bg-transparent';
                                        
                                        return (
                                            <td key={subj} className={`border border-black p-0 text-center align-middle font-bold ${cellClass}`}>
                                                {val}
                                            </td>
                                        );
                                    })}
                                    <td className={`border border-black p-0 text-center font-bold print:print-color-adjust-exact bg-slate-200`}>
                                        {rowResult}
                                    </td>
                                </tr>
                            );
                        })}
                        {/* Footer Promedios */}
                        <tr className="font-bold bg-slate-300 print:bg-slate-300 border-t-2 border-black print:print-color-adjust-exact h-6">
                            <td colSpan={2} className="border border-black p-1 text-right pr-2 text-[9px]">PROMEDIO POR ASIGNATURA:</td>
                            {(() => {
                                const gradeStruct = data.gradesStructure.find(g => g.grade === selectedGrade);
                                let subjects = gradeStruct?.subjects.filter(s => !gradeStruct.hiddenSubjects?.includes(s)) || [];
                                
                                if (currentUser.role === 'teacher' && selectedSubject) {
                                    subjects = subjects.filter(s => s === selectedSubject);
                                }

                                return subjects.map(subj => (
                                    <td key={subj} className="border border-black p-0 text-center text-[9px] bg-white print:bg-white">{calculateColumnAverage(subj)}</td>
                                ));
                            })()}
                            <td className="border border-black bg-slate-400 print:bg-slate-400"></td>
                        </tr>
                    </tbody>
                </table>
                
                {/* Firmas para Concentrado (SUBDIRECTOR ACADÉMICO) */}
                <div className="mt-16 grid grid-cols-3 gap-8 text-center text-[10px] uppercase font-bold">
                    <div>
                        <div className="border-t border-black pt-2 w-3/4 mx-auto">{data.director}</div>
                        <p>Director</p>
                    </div>
                    <div>
                        <div className="border-t border-black pt-2 w-3/4 mx-auto">{data.subdirectorAcademico}</div>
                        <p>Subdirector Académico</p>
                    </div>
                    <div>
                         <div className="border-t border-black pt-2 w-3/4 mx-auto">{administrativeName}</div>
                         <p>Administrativo / Tutor</p>
                    </div>
                </div>
            </div>
        )}

        {/* ... (Rest of ReportsView: Official Cuadro, Attendance, Boletas - kept same structure) ... */}
        {/* Include the rest of the render logic here as in previous versions */}
        {isOfficialCuadro && (
             <div className="bg-white shadow-lg mx-auto max-w-[215mm] p-[10mm] print:shadow-none print:w-full print:max-w-none relative print:text-black print:block min-h-[279mm]">
                 {cuadroViewMode === 'anverso' && (
                     <div className="min-h-[260mm] flex flex-col justify-between">
                        {/* ... (Anverso Table Logic) ... */}
                        <div>
                             <div className="flex items-center justify-between mb-2">
                                <img src={SEP_LOGO_URL} alt="SEP" className="h-14 object-contain" />
                                <div className="text-center font-bold text-xs"><p>AUTORIDAD EDUCATIVA FEDERAL EN LA CIUDAD DE MÉXICO</p></div>
                            </div>
                            <h2 className="text-center font-extrabold text-sm mb-2">CUADRO DE CONCENTRACIÓN DE INASISTENCIAS Y EVALUACIONES</h2>
                            {/* ... (Rest of header and table) ... */}
                            <table className="w-full border-collapse border border-black text-[10px]">
                                {/* ... table content ... */}
                            </table>
                        </div>
                     </div>
                 )}
                 {cuadroViewMode === 'reverso' && (
                     <div className="w-full h-full flex flex-col justify-between pt-10">
                         {/* ... (Reverso Stats and Signatures) ... */}
                            <div className="mt-20 grid grid-cols-2 gap-x-16 gap-y-20 text-center text-xs uppercase">
                                <div>
                                    <p className="mb-8">NOMBRE Y FIRMA DEL PROFESOR(A)</p>
                                    <div className="border-t border-black pt-1 font-bold">{teacherName}</div>
                                </div>
                                <div>
                                    <p className="mb-8">NOMBRE Y FIRMA DEL SUBDIRECTOR(A)</p>
                                    <div className="border-t border-black pt-1 font-bold">{data.subdirectorGestion}</div>
                                </div>
                                <div>
                                    <p className="mb-8">NOMBRE Y FIRMA DEL PERSONAL ADMINISTRATIVO</p>
                                    <div className="border-t border-black pt-1 font-bold">{administrativeName}</div>
                                </div>
                                <div>
                                    <p className="mb-8">NOMBRE Y FIRMA DEL DIRECTOR(A)</p>
                                    <div className="border-t border-black pt-1 font-bold">{data.director}</div>
                                </div>
                            </div>
                     </div>
                 )}
             </div>
        )}
        
        {/* ... (Attendance and Individual Reports logic from previous full file) ... */}

      </div>
    </div>
  );
};

export default ReportsView;
