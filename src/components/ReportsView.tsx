
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

  // Selectors for Periods
  const [selectedInterPeriod, setSelectedInterPeriod] = useState<string>('1'); 
  const [selectedTrimester, setSelectedTrimester] = useState<string>('1'); 
  const [schoolCycle, setSchoolCycle] = useState(currentCycle);
  
  // Print Configuration
  const [printMode, setPrintMode] = useState<'full' | 'data_only'>('full');
  const [printPeriods, setPrintPeriods] = useState({ p1: true, p2: true, p3: true });
  const [cuadroViewMode, setCuadroViewMode] = useState<'anverso' | 'reverso'>('anverso');

  // Attendance Month Selector
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
    if (['admin', 'subdirector', 'secretaria', 'administrative', 'subdirector_gestion', 'subdirector_academico'].includes(currentUser.role)) {
        return data.gradesStructure.find(g => g.grade === selectedGrade)?.subjects || [];
    } else {
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
  const isIndividualReport = ['boleta_monthly', 'boleta_trimester', 'boletin_anual'].includes(reportType);
  const isOfficialCuadro = reportType === 'cuadro_inasistencia';

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
    if (availableGroups.length > 0 && !availableGroups.includes(selectedGroup)) setSelectedGroup(availableGroups[0]);
    else if (availableGroups.length > 0 && selectedGroup === '') setSelectedGroup(availableGroups[0]);
  }, [selectedGrade, availableGroups]);

  useEffect(() => {
    if (availableSubjects.length > 0 && !availableSubjects.includes(selectedSubject)) setSelectedSubject(availableSubjects[0]);
    else if (availableSubjects.length > 0 && selectedSubject === '') setSelectedSubject(availableSubjects[0]);
  }, [selectedGrade, availableSubjects]);

  useEffect(() => {
      setSelectedTech('');
      if (selectedGroup === 'B' || selectedGroup === 'D') setSelectedSection('BD');
      else setSelectedSection('AC');
  }, [selectedSubject, selectedGroup]);
  
  // Reset student selection when group changes
  useEffect(() => {
    setSelectedStudentId('');
  }, [selectedGrade, selectedGroup, selectedSubject, selectedTech, selectedSection]);

  // MANEJADOR PARA CAMBIAR EL TIPO DE REPORTE Y AJUSTAR LA VISTA INDIVIDUAL/GRUPAL
  const handleReportTypeChange = (newReportType: ReportType) => {
      setReportType(newReportType); 
      
      const individualReports = ['boleta_monthly', 'boleta_trimester', 'boletin_anual'];
      const isIndividual = individualReports.includes(newReportType);

      if (isIndividual) {
          // Al seleccionar un individual, forzar la vista de grupo completo ('group') 
          // por defecto para que el array de alumnos a renderizar no esté vacío.
          setViewMode('group'); 
          setSelectedStudentId('');
      } else {
          // Para reportes grupales, forzar la vista 'single' y limpiar la selección.
          // Esto desactiva la vista de reportes individuales.
          setViewMode('single'); 
          setSelectedStudentId('');
      }
  };

  // --- DATA HELPERS ---
  const directorName = data.director || 'NOMBRE DIRECTOR(A)';
  const subAcademicoName = data.subdirectorAcademico || 'NOMBRE SUB. ACADÉMICO';
  const subGestionName = data.subdirectorGestion || 'NOMBRE SUB. GESTIÓN';

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

  // --- CALCULATION HELPERS ---
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

  const calculateGeneralAverage = (studentId: string) => {
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

  const calculateRowAverageConcentrado = (studentId: string, subjects: string[]) => {
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

  // --- STYLE HELPERS FOR PRINT MODE ---
  const isDataOnly = printMode === 'data_only';
  
  const getPrintClass = (type: 'border' | 'text' | 'bg') => {
      if (!isDataOnly) {
          // Normal Mode
          if (type === 'border') return 'border-black';
          if (type === 'text') return 'text-black';
          if (type === 'bg') return 'bg-slate-200 print:bg-slate-200';
          return '';
      } else {
          // Data Only Mode (Transparent for pre-printed forms)
          if (type === 'border') return 'border-transparent'; 
          if (type === 'text') return 'text-transparent'; 
          if (type === 'bg') return 'bg-transparent';
          return '';
      }
  };

  // --- FUNCIONES DE CÁLCULO DE DÍAS LABORALES (LISTA ASISTENCIA) ---
  const getDaysInMonth = (monthStr: string) => {
      const [year, month] = monthStr.split('-').map(Number);
      return new Date(year, month, 0).getDate();
  };

  const getWorkDaysInMonth = (monthStr: string) => {
      const days = getDaysInMonth(monthStr);
      const workDates: {date: string, day: string, dayNum: number}[] = [];
      const [year, month] = monthStr.split('-').map(Number);

      for (let d = 1; d <= days; d++) {
          const date = new Date(year, month - 1, d);
          const dayOfWeek = date.getDay();
          if (dayOfWeek >= 1 && dayOfWeek <= 5) {
              const dateStr = `${monthStr}-${String(d).padStart(2, '0')}`;
              const dayLabel = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'][dayOfWeek];
              workDates.push({ date: dateStr, day: dayLabel, dayNum: d });
          }
      }
      return workDates;
  };

  const workDaysArray = React.useMemo(() => getWorkDaysInMonth(selectedMonth), [selectedMonth]);
  
  const monthName = React.useMemo(() => {
      if(!selectedMonth) return '';
      const [y, m] = selectedMonth.split('-');
      const date = new Date(parseInt(y), parseInt(m) - 1, 1);
      return date.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }).toUpperCase();
  }, [selectedMonth]);

  const getStatusText = (status: string) => {
      if (status === 'GREEN') return 'REGULAR';
      if (status === 'RED') return 'REQ. APOYO';
      return '';
  }

  const isLandscapeReport = reportType === 'concentrado_trimestral' || reportType === 'boletin_anual' || reportType === 'attendance';

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
              <select value={reportType} onChange={(e) => handleReportTypeChange(e.target.value as ReportType)} className="p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm">
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

           {isTechReport && (
               <>
                <div className="flex flex-col min-w-[160px] animate-fade-in">
                    <label className="text-xs font-bold text-blue-600 uppercase mb-1 flex items-center gap-1"><Layers size={12}/> Sección</label>
                    <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} className="p-2 border border-blue-200 bg-blue-50 text-blue-900 rounded-lg text-sm w-full font-bold focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="AC">Sección 1 (A y C)</option>
                        <option value="BD">Sección 2 (B y D)</option>
                    </select>
                </div>
                <div className="flex flex-col min-w-[200px] animate-fade-in">
                    <label className="text-xs font-bold text-blue-600 uppercase mb-1 flex items-center gap-1"><Cpu size={12}/> Tecnología / Énfasis</label>
                    <select value={selectedTech} onChange={(e) => setSelectedTech(e.target.value)} className="p-2 border border-blue-200 bg-blue-50 text-blue-900 rounded-lg text-sm w-full font-semibold focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="">-- Todos / Seleccionar --</option>
                        {data.technologies.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
               </>
           )}
           
           {/* Student Selector for Individual Reports */}
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

            {reportType === 'attendance' && (
                <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1">Mes</label>
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

             {/* SWITCH MODE PRINT: FOR ALL INDIVIDUAL REPORTS */}
             {isIndividualReport && (
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
                     {reportType === 'boletin_anual' && (
                        <div className="flex gap-2">
                            <label className="flex items-center gap-1 text-[9px] cursor-pointer">
                                <input type="checkbox" checked={printPeriods.p1} onChange={e => setPrintPeriods({...printPeriods, p1: e.target.checked})} className="accent-blue-600"/>
                                P1
                            </label>
                            <label className="flex items-center gap-1 text-[9px] cursor-pointer">
                                <input type="checkbox" checked={printPeriods.p2} onChange={e => setPrintPeriods({...printPeriods, p2: e.target.checked})} className="accent-blue-600"/>
                                P2
                            </label>
                            <label className="flex items-center gap-1 text-[9px] cursor-pointer">
                                <input type="checkbox" checked={printPeriods.p3} onChange={e => setPrintPeriods({...printPeriods, p3: e.target.checked})} className="accent-blue-600"/>
                                P3
                            </label>
                        </div>
                     )}
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
        
        {/* CSS for printing specific layouts */}
        <style>{`
          @media print {
            @page {
              size: ${isLandscapeReport ? 'landscape' : 'letter portrait'};
              margin: 5mm;
            }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            
            /* GLOBAL RESET FOR PRINTING */
            html, body, #root, main { height: auto !important; overflow: visible !important; display: block !important; }
            ::-webkit-scrollbar { display: none; }
            .no-print { display: none !important; }
            .page-break { page-break-before: always; }
            
            /* FORCE BACKGROUNDS FOR DATA ONLY MODE */
            .bg-slate-200 { background-color: #e2e8f0 !important; }
            
            /* SCALING FOR BOLETAS IF NEEDED */
            ${reportType === 'boletin_anual' ? `.boleta-scale { transform: scale(0.95); transform-origin: top left; width: 100%; }` : ''}
          }
        `}</style>
        
        {/* --- REPORT: CONCENTRADO MENSUAL (RIESGO) --- */}
        {reportType === 'concentrado_mensual' && (
             <div className="bg-white shadow-lg mx-auto max-w-[210mm] p-[10mm] print:shadow-none print:w-full print:max-w-none">
                 <div className="flex items-center justify-between border-b-2 border-slate-800 pb-2 mb-4">
                    <div className="flex flex-col">
                        <h1 className="text-base font-extrabold uppercase">ESCUELA SECUNDARIA DIURNA No. 27</h1>
                        <h1 className="text-base font-extrabold uppercase whitespace-nowrap">"ALFREDO E. URUCHURTU"</h1>
                    </div>
                    <img src={LOGO_URL} alt="Logo" className="w-16 h-16 object-contain" />
                    <div className="text-center flex-1">
                        <h2 className="text-sm font-bold uppercase text-red-600 mt-1">Informe de Alumnos en Riesgo</h2>
                        <p className="text-xs text-slate-500 uppercase font-bold mt-1">Avance {selectedInterPeriod} - Ciclo {schoolCycle}</p>
                    </div>
                    <div className="text-right min-w-[120px] text-xs font-bold border border-slate-300 p-2 rounded">
                        <p className="uppercase">Grado: <span className="text-sm">{selectedGrade}</span></p>
                        <p className="uppercase">Grupo: <span className="text-sm">{selectedGroup}</span></p>
                    </div>
                </div>

                <table className="w-full border-collapse border border-black text-xs">
                    <thead>
                        <tr className="bg-slate-200">
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
                            if (currentUser.role === 'teacher' && selectedSubject) subjects = [selectedSubject];

                            const riskStudents = studentsInGroup.map(student => {
                                const riskSubjects = subjects.filter(subj => {
                                    const grades = student.grades[subj] as GradeScores;
                                    return grades?.[`inter_${selectedInterPeriod}`] === 'RED';
                                });
                                return { ...student, riskSubjects };
                            }).filter(s => s.riskSubjects.length > 0);

                            if (riskStudents.length === 0) return <tr><td colSpan={4} className="border border-black p-8 text-center italic">Sin alumnos en riesgo.</td></tr>;

                            return riskStudents.map((student, index) => (
                                <tr key={student.id}>
                                    <td className="border border-black p-2 text-center">{index + 1}</td>
                                    <td className="border border-black p-2 font-bold uppercase">{student.name}</td>
                                    <td className="border border-black p-2 text-red-700 font-medium">{student.riskSubjects.join(', ')}</td>
                                    <td className="border border-black p-2 text-center font-bold bg-red-50 text-red-700">{student.riskSubjects.length}</td>
                                </tr>
                            ));
                        })()}
                    </tbody>
                </table>
                <div className="mt-16 text-center text-xs font-bold uppercase"><div className="border-t border-black w-64 mx-auto pt-2">{currentUser.name}</div><p>FIRMA DEL RESPONSABLE</p></div>
             </div>
        )}
        
        {/* --- REPORT: CONCENTRADO TRIMESTRAL (MATRIZ) --- */}
        {isMatrixReport && (
            <div className="bg-white shadow-lg mx-auto max-w-[297mm] p-[10mm] print:shadow-none print:w-full print:max-w-none print:landscape">
                <div className="flex items-center justify-between border-b-2 border-slate-800 pb-2 mb-2">
                    <div className="flex flex-col">
                        <h1 className="text-sm font-extrabold uppercase">ESC. SEC. DNA. No. 27 "ALFREDO E. URUCHURTU"</h1>
                    </div>
                    <h2 className="text-sm font-bold uppercase bg-slate-100 px-4 py-0.5 rounded border border-slate-300">Concentrado Trimestre {selectedTrimester}</h2>
                    <div className="text-right text-xs font-bold">
                        <span className="uppercase mr-4">{selectedGrade} "{selectedGroup}"</span>
                        <span>Ciclo {schoolCycle}</span>
                    </div>
                </div>

                <table className="w-full border-collapse border border-black text-[10px] table-fixed">
                    <thead>
                        <tr className="bg-slate-200">
                            <th className="border border-black p-1 w-6 text-center">No.</th>
                            <th className="border border-black p-1 text-left pl-2">ALUMNO</th>
                            {(() => {
                                const gradeStruct = data.gradesStructure.find(g => g.grade === selectedGrade);
                                let subjects = gradeStruct?.subjects.filter(s => !gradeStruct.hiddenSubjects?.includes(s)) || [];
                                if (currentUser.role === 'teacher' && selectedSubject) subjects = subjects.filter(s => s === selectedSubject);
                                return subjects.map(subj => (
                                    <th key={subj} className="border border-black p-0 w-8 h-32 align-bottom relative bg-white"><div className="flex items-center justify-center h-28 pb-1"><span className="block transform -rotate-90 whitespace-nowrap origin-center text-[8px] font-bold uppercase">{subj}</span></div></th>
                                ));
                            })()}
                            <th className="border border-black p-1 w-8 font-bold bg-slate-300 text-center"><div className="flex items-center justify-center h-full"><span className="block transform -rotate-90">PROM</span></div></th>
                        </tr>
                    </thead>
                    <tbody>
                        {studentsInGroup.map((student, index) => {
                            const gradeStruct = data.gradesStructure.find(g => g.grade === selectedGrade);
                            let subjects = gradeStruct?.subjects.filter(s => !gradeStruct.hiddenSubjects?.includes(s)) || [];
                            if (currentUser.role === 'teacher' && selectedSubject) subjects = subjects.filter(s => s === selectedSubject);
                            const rowResult = calculateRowAverageConcentrado(student.id, subjects);
                            
                            return (
                                <tr key={student.id} className="h-4">
                                    <td className="border border-black p-0 text-center">{index + 1}</td>
                                    <td className="border border-black px-1 uppercase truncate">{student.name}</td>
                                    {subjects.map(subj => {
                                        const val = (student.grades[subj] as GradeScores)?.[`trim_${selectedTrimester}`] || '';
                                        return <td key={subj} className={`border border-black p-0 text-center font-bold ${parseFloat(val)<6?'text-red-600 bg-red-50':''}`}>{val}</td>;
                                    })}
                                    <td className="border border-black p-0 text-center font-bold bg-slate-100">{rowResult}</td>
                                </tr>
                            );
                        })}
                        {/* Footer Averages */}
                        <tr className="font-bold bg-slate-300 border-t-2 border-black">
                            <td colSpan={2} className="border border-black p-1 text-right pr-2">PROMEDIO:</td>
                            {(() => {
                                const gradeStruct = data.gradesStructure.find(g => g.grade === selectedGrade);
                                let subjects = gradeStruct?.subjects.filter(s => !gradeStruct.hiddenSubjects?.includes(s)) || [];
                                if (currentUser.role === 'teacher' && selectedSubject) subjects = subjects.filter(s => s === selectedSubject);
                                return subjects.map(subj => <td key={subj} className="border border-black p-0 text-center text-[9px] bg-white">{calculateColumnAverage(subj)}</td>);
                            })()}
                            <td className="border border-black bg-slate-400"></td>
                        </tr>
                    </tbody>
                </table>
                
                <div className="mt-12 grid grid-cols-3 gap-8 text-center text-[9px] uppercase font-bold">
                    <div><div className="border-t border-black pt-1 w-3/4 mx-auto">{directorName}</div><p>Director</p></div>
                    <div><div className="border-t border-black pt-1 w-3/4 mx-auto">{subAcademicoName}</div><p>Subdirector Académico</p></div>
                    <div><div className="border-t border-black pt-1 w-3/4 mx-auto">{administrativeName}</div><p>Administrativo</p></div>
                </div>
            </div>
        )}

        {/* --- REPORT: CUADRO OFICIAL INASISTENCIAS/EVALUACIÓN --- */}
        {isOfficialCuadro && (
             <div className="bg-white shadow-lg mx-auto max-w-[215mm] p-[10mm] print:shadow-none print:w-full print:max-w-none relative print:text-black print:block min-h-[279mm] flex flex-col">
                 {cuadroViewMode === 'anverso' && (
                     <div className="flex-1 flex flex-col text-black">
                        <div>
                             <div className="flex items-center justify-between mb-2">
                                <img src={SEP_LOGO_URL} alt="SEP" className="h-10 object-contain" />
                                <div className="text-center font-bold text-[10px]"><p>AUTORIDAD EDUCATIVA FEDERAL EN LA CIUDAD DE MÉXICO</p></div>
                            </div>
                            <h2 className="text-center font-extrabold text-xs mb-3">CUADRO DE CONCENTRACIÓN DE INASISTENCIAS Y EVALUACIONES</h2>
                            
                            <div className="grid grid-cols-3 gap-1 text-[9px] mb-2 border border-black p-1 font-bold uppercase">
                                <div>ESCUELA: {data.name}</div>
                                <div>TURNO: {data.turno}</div>
                                <div>CCT: {CCT}</div>
                                <div>PROFESOR: {teacherName}</div>
                                <div>GRADO: {selectedGrade} GRUPO: "{selectedGroup}"</div>
                                <div>ASIGNATURA: {selectedSubject}</div>
                            </div>

                            <table className="w-full border-collapse border border-black text-[8px] text-center table-fixed">
                                <thead>
                                    <tr className="bg-slate-200">
                                        <th className="border border-black p-0.5 w-6" rowSpan={2}>No.</th>
                                        <th className="border border-black p-0.5 text-left w-48" rowSpan={2}>NOMBRE DEL ALUMNO</th>
                                        <th className="border border-black p-0.5" colSpan={3}>1° PERIODO</th>
                                        <th className="border border-black p-0.5" colSpan={3}>2° PERIODO</th>
                                        <th className="border border-black p-0.5" colSpan={3}>3° PERIODO</th>
                                        <th className="border border-black p-0.5 w-10" rowSpan={2}>PROM</th>
                                    </tr>
                                    <tr className="bg-slate-100">
                                        <th className="border border-black p-0.5">F</th><th className="border border-black p-0.5">E</th><th className="border border-black p-0.5">O</th>
                                        <th className="border border-black p-0.5">F</th><th className="border border-black p-0.5">E</th><th className="border border-black p-0.5">O</th>
                                        <th className="border border-black p-0.5">F</th><th className="border border-black p-0.5">E</th><th className="border border-black p-0.5">O</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {studentsInGroup.map((s, i) => {
                                        const grades = s.grades[selectedSubject] as GradeScores;
                                        const finalAvg = calculateFinalAverage(grades?.trim_1, grades?.trim_2, grades?.trim_3);
                                        return (
                                            <tr key={s.id} className="h-4">
                                                <td className="border border-black p-0">{i+1}</td>
                                                <td className="border border-black p-0 text-left pl-1 uppercase truncate">{s.name}</td>
                                                <td className="border border-black p-0"></td><td className="border border-black p-0 font-bold">{grades?.trim_1}</td><td className="border border-black p-0 text-[6px]">{grades?.inter_1==='RED'?'RIESGO':''}</td>
                                                <td className="border border-black p-0"></td><td className="border border-black p-0 font-bold">{grades?.trim_2}</td><td className="border border-black p-0 text-[6px]">{grades?.inter_2==='RED'?'RIESGO':''}</td>
                                                <td className="border border-black p-0"></td><td className="border border-black p-0 font-bold">{grades?.trim_3}</td><td className="border border-black p-0 text-[6px]">{grades?.inter_3==='RED'?'RIESGO':''}</td>
                                                <td className="border border-black p-0 font-bold bg-slate-100">{finalAvg}</td>
                                            </tr>
                                        );
                                    })}
                                    {/* Fill Empty Rows to keep size */}
                                    {Array.from({ length: Math.max(0, 35 - studentsInGroup.length) }).map((_, i) => (
                                        <tr key={`empty-${i}`} className="h-4">
                                            <td className="border border-black">&nbsp;</td><td className="border border-black"></td>
                                            <td className="border border-black"></td><td className="border border-black"></td><td className="border border-black"></td>
                                            <td className="border border-black"></td><td className="border border-black"></td><td className="border border-black"></td>
                                            <td className="border border-black"></td><td className="border border-black"></td><td className="border border-black"></td>
                                            <td className="border border-black"></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                     </div>
                 )}
                 {cuadroViewMode === 'reverso' && (
                     <div className="flex-1 flex flex-col justify-between pt-10 text-black">
                            <div className="text-center font-bold text-sm uppercase mb-12">ESTADÍSTICA DE RENDIMIENTO Y ASISTENCIA</div>
                            {/* Placeholder for Stats Table if needed */}
                            <div className="border border-black h-64 flex items-center justify-center text-slate-400 text-xs mb-12">ESPACIO PARA ESTADÍSTICA SEMESTRAL</div>

                            <div className="mt-10 grid grid-cols-2 gap-x-16 gap-y-20 text-center text-[10px] uppercase">
                                <div><div className="border-t border-black pt-1 font-bold">{teacherName}</div><p>PROFESOR(A)</p></div>
                                <div><div className="border-t border-black pt-1 font-bold">{subAcademicoName}</div><p>SUBDIRECTOR ACADÉMICO</p></div>
                                <div><div className="border-t border-black pt-1 font-bold">{administrativeName}</div><p>ADMINISTRATIVO</p></div>
                                <div><div className="border-t border-black pt-1 font-bold">{directorName}</div><p>DIRECTOR</p></div>
                            </div>
                     </div>
                 )}
             </div>
        )}

        {/* --- REPORT: INDIVIDUAL (BOLETAS) --- */}
        {isIndividualReport && (
            <div className="bg-white mx-auto print:w-full print:max-w-none">
                {/* Loop for Students (Single or Group) */}
                {(viewMode === 'group' ? studentsInGroup : studentsInGroup.filter(s => String(s.id) === selectedStudentId)).map((student, idx) => (
                    <div key={student.id} className="boleta-page relative max-w-[215mm] min-h-[279mm] p-[10mm] mx-auto mb-8 shadow-lg border border-slate-200 print:shadow-none print:border-none print:mb-0 page-break bg-white text-black">
                        
                        {/* HEADER BOLETA */}
                        <div className={`flex justify-between items-start mb-4 ${getPrintClass('text')}`}>
                            <img src={SEP_LOGO_URL} alt="SEP" className={`h-12 object-contain ${isDataOnly ? 'opacity-0' : ''}`} />
                            <div className="text-center font-bold text-xs uppercase flex-1">
                                <p>SECRETARÍA DE EDUCACIÓN PÚBLICA</p>
                                <p>AUTORIDAD EDUCATIVA FEDERAL EN LA CIUDAD DE MÉXICO</p>
                                <p className="text-lg mt-1">BOLETA DE EVALUACIÓN</p>
                                <p>EDUCACIÓN SECUNDARIA CICLO ESCOLAR {schoolCycle}</p>
                            </div>
                            <img src={LOGO_URL} alt="Logo" className={`h-14 object-contain ${isDataOnly ? 'opacity-0' : ''}`} />
                        </div>

                        {/* STUDENT INFO GRID */}
                        <div className={`grid grid-cols-4 gap-2 text-[10px] mb-4 border p-2 font-bold uppercase ${getPrintClass('border')}`}>
                            <div className={`col-span-3 ${getPrintClass('text')}`}>NOMBRE: <span className="text-black text-sm ml-2">{student.name}</span></div>
                            <div className={`col-span-1 ${getPrintClass('text')}`}>GRADO Y GRUPO: <span className="text-black text-sm ml-2">{student.grade} "{student.group}"</span></div>
                            <div className={`col-span-2 ${getPrintClass('text')}`}>CURP: <span className="text-black ml-2">{student.id}</span></div>
                            <div className={`col-span-2 ${getPrintClass('text')}`}>CCT: <span className="text-black ml-2">{CCT}</span></div>
                            <div className={`col-span-4 ${getPrintClass('text')}`}>ESCUELA: <span className="text-black ml-2">{data.name}</span></div>
                        </div>

                        {/* GRADES TABLE */}
                        <table className={`w-full border-collapse border text-[9px] text-center mb-6 ${getPrintClass('border')}`}>
                            <thead>
                                <tr className={`${getPrintClass('bg')} ${getPrintClass('text')}`}>
                                    <th className={`border p-1 w-8 ${getPrintClass('border')}`}>No.</th>
                                    <th className={`border p-1 text-left w-64 ${getPrintClass('border')}`}>ASIGNATURA</th>
                                    <th className={`border p-1 w-12 ${getPrintClass('border')}`}>1° PER</th>
                                    <th className={`border p-1 w-12 ${getPrintClass('border')}`}>2° PER</th>
                                    <th className={`border p-1 w-12 ${getPrintClass('border')}`}>3° PER</th>
                                    <th className={`border p-1 w-12 ${getPrintClass('border')}`}>PROM</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    const gradeStruct = data.gradesStructure.find(g => g.grade === student.grade);
                                    let subjects = gradeStruct?.subjects.filter(s => !gradeStruct.hiddenSubjects?.includes(s)) || [];
                                    
                                    return subjects.map((subj, i) => {
                                        const grades = student.grades[subj] as GradeScores;
                                        // Filtra impresión por periodo seleccionado
                                        const t1 = printPeriods.p1 ? grades?.trim_1 : '';
                                        const t2 = printPeriods.p2 ? grades?.trim_2 : '';
                                        const t3 = printPeriods.p3 ? grades?.trim_3 : '';
                                        const final = calculateFinalAverage(t1, t2, t3);

                                        return (
                                            <tr key={subj} className="h-6">
                                                <td className={`border p-1 ${getPrintClass('border')} ${getPrintClass('text')}`}>{i + 1}</td>
                                                <td className={`border p-1 text-left pl-2 font-bold uppercase ${getPrintClass('border')} ${getPrintClass('text')}`}>{subj}</td>
                                                <td className={`border p-1 font-bold text-sm ${getPrintClass('border')}`}>{t1}</td>
                                                <td className={`border p-1 font-bold text-sm ${getPrintClass('border')}`}>{t2}</td>
                                                <td className={`border p-1 font-bold text-sm ${getPrintClass('border')}`}>{t3}</td>
                                                <td className={`border p-1 font-bold text-sm ${getPrintClass('border')}`}>{final}</td>
                                            </tr>
                                        );
                                    });
                                })()}
                                {/* PROMEDIO GENERAL ROW */}
                                <tr className="h-8">
                                    <td colSpan={5} className={`border p-1 text-right pr-4 font-bold uppercase ${getPrintClass('border')} ${getPrintClass('text')}`}>PROMEDIO GENERAL:</td>
                                    <td className={`border p-1 font-extrabold text-sm ${getPrintClass('border')}`}>{calculateGeneralAverage(student.id)}</td>
                                </tr>
                            </tbody>
                        </table>

                        {/* SIGNATURES FOOTER */}
                        <div className={`mt-20 flex justify-around text-center text-[10px] uppercase font-bold ${getPrintClass('text')}`}>
                            <div>
                                <div className={`border-t w-48 mx-auto pt-2 ${getPrintClass('border')}`}>{directorName}</div>
                                <p>NOMBRE Y FIRMA DEL DIRECTOR</p>
                            </div>
                            <div>
                                <div className={`border-t w-48 mx-auto pt-2 ${getPrintClass('border')}`}></div>
                                <p>SELLO DEL SISTEMA</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* --- REPORT: ASISTENCIA (ATTENDANCE) --- */}
        {reportType === 'attendance' && (
             <div className="bg-white shadow-lg mx-auto p-[10mm] print:shadow-none print:w-full print:max-w-none text-black print:landscape">
                 <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-4">
                      <div className="text-left">
                          <h1 className="text-sm font-bold uppercase">ESCUELA SECUNDARIA DIURNA No. 27</h1>
                          <h1 className="text-sm font-bold uppercase whitespace-nowrap">"ALFREDO E. URUCHURTU"</h1>
                      </div>
                      <div className="text-center px-4">
                          <h2 className="text-lg font-bold uppercase">LISTA DE ASISTENCIA MENSUAL</h2>
                          <p className="text-sm uppercase font-bold text-slate-600 print:text-black">
                              {new Date(selectedMonth + '-02').toLocaleDateString('es-MX', {month: 'long', year: 'numeric'})}
                          </p>
                      </div>
                      <div className="text-right text-xs font-bold border border-black p-2">
                           <p>GRADO: {selectedGrade}</p>
                           <p>GRUPO: {selectedGroup}</p>
                      </div>
                 </div>

                 <div className="overflow-x-auto">
                     <table className="w-full border-collapse border border-black text-[9px]">
                         <thead>
                             <tr className="bg-slate-200 print:bg-slate-300">
                                 <th className="border border-black p-1 w-6 text-center">No.</th>
                                 <th className="border border-black p-1 text-left min-w-[150px]">NOMBRE</th>
                                 {/* Render Days */}
                                 {workDaysArray.map((dayData, i) => (
                                    <th key={dayData.date} className="border border-black p-0 w-4 text-center font-bold">
                                        <div className="text-[6px] uppercase font-semibold">{dayData.day.slice(0, 1)}</div>
                                        {dayData.dayNum}
                                    </th>
                                  ))}
                                 <th className="border border-black p-1 w-6">F</th>
                             </tr>
                         </thead>
                         <tbody>
                             {studentsInGroup.map((s, idx) => (
                                 <tr key={s.id} className="h-4">
                                     <td className="border border-black text-center">{idx + 1}</td>
                                     <td className="border border-black pl-1 uppercase truncate max-w-[150px]">{s.name}</td>
                                     {/* Mock Cells for days - Real implementation would connect to attendance data */}
                                     {workDaysArray.map((dayData) => (
                                         <td key={dayData.date} className="border border-black"></td>
                                     ))}
                                     <td className="border border-black"></td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                 </div>
                 
                 {/* Firma Vinculada: Subdirector de Gestión */}
                 <div className="mt-8 grid grid-cols-2 gap-16 text-center text-[10px] uppercase">
                      <div><div className="border-t border-black pt-1 font-bold">{teacherName}</div><p>DOCENTE</p></div>
                      <div><div className="border-t border-black pt-1 font-bold">{subGestionName}</div><p>SUBDIRECTOR DE GESTIÓN</p></div>
                 </div>
             </div>
        )}

      </div>
    </div>
  );
};

export default ReportsView;
