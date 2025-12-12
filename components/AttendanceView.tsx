
import React, { useState, useEffect, useMemo } from 'react';
import { CalendarCheck, Save, Printer, ArrowLeft, CheckCircle2, XCircle, Clock, FileWarning, Check, CalendarDays } from 'lucide-react';
import { SchoolData, User, AttendanceRecord, AttendanceStatus, Student } from '../types';
import { WEEK_DAYS } from '../utils';

interface AttendanceViewProps {
  data: SchoolData;
  currentUser: User;
  onUpdateData: (newData: SchoolData) => void;
  onBack: () => void;
}

const AttendanceView: React.FC<AttendanceViewProps> = ({ data, currentUser, onUpdateData, onBack }) => {
  // Modes: Capture (Daily), Report (Monthly), Weekly (New)
  const [mode, setMode] = useState<'capture' | 'report' | 'weekly'>('capture');

  // Context Selection
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');

  // Daily State
  const [dailyAttendance, setDailyAttendance] = useState<Record<number, AttendanceStatus>>({});
  const [isSaved, setIsSaved] = useState(false);

  // --- FILTERING LOGIC ---
  const availableGrades = useMemo(() => {
     if (['admin', 'subdirector', 'secretaria', 'administrative'].includes(currentUser.role)) {
         return data.gradesStructure.map(g => g.grade);
     }
     // Teachers see grades they have assigned
     return Array.from(new Set(currentUser.assignments?.map(a => a.grade) || [])).sort();
  }, [data.gradesStructure, currentUser]);

  const availableGroups = useMemo(() => {
     if (['admin', 'subdirector', 'secretaria', 'administrative'].includes(currentUser.role)) {
         return data.gradesStructure.find(g => g.grade === selectedGrade)?.groups || [];
     }
     // Teachers see groups they have assigned in that grade
     return Array.from(new Set(currentUser.assignments?.filter(a => a.grade === selectedGrade).map(a => a.group) || [])).sort();
  }, [data.gradesStructure, currentUser, selectedGrade]);

  // Initial Selection
  useEffect(() => {
      if (!selectedGrade && availableGrades.length > 0) setSelectedGrade(availableGrades[0]);
  }, [availableGrades]);

  useEffect(() => {
      if (!selectedGroup && availableGroups.length > 0) setSelectedGroup(availableGroups[0]);
  }, [availableGroups, selectedGrade]);

  // Active Students List
  const students = useMemo(() => {
      return data.studentsData.filter(s => 
          s.grade === selectedGrade && 
          s.group === selectedGroup && 
          s.status !== 'dropped' && 
          s.status !== 'graduated'
      ).sort((a, b) => a.name.localeCompare(b.name));
  }, [data.studentsData, selectedGrade, selectedGroup]);

  // --- LOAD DAILY DATA ---
  useEffect(() => {
      if (mode === 'capture' && selectedGrade && selectedGroup && selectedDate) {
          const records = data.attendance || [];
          const currentRecords = records.filter(r => 
              r.date === selectedDate && r.grade === selectedGrade && r.group === selectedGroup
          );
          
          const newMap: Record<number, AttendanceStatus> = {};
          
          // Pre-fill with existing records
          currentRecords.forEach(r => {
              newMap[r.studentId] = r.status;
          });

          setDailyAttendance(newMap);
          setIsSaved(false);
      }
  }, [mode, selectedDate, selectedGrade, selectedGroup, data.attendance]);

  // --- ACTIONS ---

  const handleStatusChange = (studentId: number, status: AttendanceStatus) => {
      setDailyAttendance(prev => ({ ...prev, [studentId]: status }));
      setIsSaved(false);
  };

  const markAll = (status: AttendanceStatus) => {
      const newMap: Record<number, AttendanceStatus> = {};
      students.forEach(s => newMap[s.id] = status);
      setDailyAttendance(newMap);
      setIsSaved(false);
  };

  const saveAttendance = () => {
      // Filter out current day's records for this group to overwrite them
      const otherRecords = (data.attendance || []).filter(r => 
          !(r.date === selectedDate && r.grade === selectedGrade && r.group === selectedGroup)
      );

      const newRecords: AttendanceRecord[] = [];
      students.forEach(s => {
          if (dailyAttendance[s.id]) {
              newRecords.push({
                  id: `${selectedDate}-${s.id}`,
                  date: selectedDate,
                  studentId: s.id,
                  grade: selectedGrade,
                  group: selectedGroup,
                  status: dailyAttendance[s.id],
                  recordedBy: currentUser.id
              });
          }
      });

      onUpdateData({
          ...data,
          attendance: [...otherRecords, ...newRecords]
      });
      setIsSaved(true);
  };

  // --- WEEKLY REPORT HELPERS ---
  const getWeekDaysRange = (dateStr: string) => {
      const curr = new Date(dateStr + 'T00:00:00'); // Force local time avoid timezone issues
      const day = curr.getDay(); // 0 (Sun) to 6 (Sat)
      
      // Calculate Monday
      // If Sunday (0), subtract 6 days. If Mon-Sat (1-6), subtract day - 1
      const diffToMon = day === 0 ? 6 : day - 1;
      const monday = new Date(curr);
      monday.setDate(curr.getDate() - diffToMon);

      const weekDates: string[] = [];
      for (let i = 0; i < 5; i++) {
          const d = new Date(monday);
          d.setDate(monday.getDate() + i);
          weekDates.push(d.toISOString().split('T')[0]);
      }
      return weekDates;
  };

  const weekDates = useMemo(() => getWeekDaysRange(selectedDate), [selectedDate]);

  const getRecordForDate = (studentId: number, dateStr: string) => {
      const record = (data.attendance || []).find(r => r.date === dateStr && r.studentId === studentId);
      return record ? record.status : null;
  };

  // --- MONTHLY REPORT HELPERS ---
  const getDaysInMonth = (monthStr: string) => {
      const [year, month] = monthStr.split('-').map(Number);
      return new Date(year, month, 0).getDate(); // Last day of month
  };

  const daysInSelectedMonth = getDaysInMonth(selectedMonth);
  const daysArray = Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1);

  const getMonthlyRecord = (studentId: number, day: number) => {
      const dateStr = `${selectedMonth}-${String(day).padStart(2, '0')}`;
      const record = (data.attendance || []).find(r => r.date === dateStr && r.studentId === studentId);
      return record ? record.status : null;
  };

  const calculateMonthlyStats = (studentId: number) => {
      let stats = { present: 0, absent: 0, late: 0, excused: 0 };
      for (let d = 1; d <= daysInSelectedMonth; d++) {
          const status = getMonthlyRecord(studentId, d);
          if (status === 'present') stats.present++;
          if (status === 'absent') stats.absent++;
          if (status === 'late') stats.late++;
          if (status === 'excused') stats.excused++;
      }
      return stats;
  };

  const handlePrint = () => window.print();

  return (
    <div className="flex flex-col h-full">
      <style>{`
          @media print {
            @page { size: landscape; margin: 5mm; }
            body { -webkit-print-color-adjust: exact; }
          }
      `}</style>
      
      {/* HEADER CONTROLS (Hidden on Print) */}
      <div className="p-6 md:p-8 space-y-6 print:hidden bg-slate-50 border-b border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Control de Asistencia</h2>
                <p className="text-slate-500">Registro diario y reportes de inasistencias.</p>
            </div>
            
            <div className="flex gap-2 p-1 bg-white rounded-xl border border-slate-200">
                 <button 
                    onClick={() => setMode('capture')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'capture' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:bg-slate-100'}`}
                 >
                     Pase de Lista
                 </button>
                 <button 
                    onClick={() => setMode('weekly')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'weekly' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:bg-slate-100'}`}
                 >
                     Reporte Semanal
                 </button>
                 <button 
                    onClick={() => setMode('report')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'report' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:bg-slate-100'}`}
                 >
                     Reporte Mensual
                 </button>
            </div>
        </div>

        {/* FILTERS */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-end">
             {/* Common Filters */}
             <div className="flex flex-col w-32">
                <label className="text-xs font-bold text-slate-500 uppercase mb-1">Grado</label>
                <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)} className="p-2 border border-slate-300 rounded-lg text-sm">
                   {availableGrades.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
             </div>
             <div className="flex flex-col w-32">
                <label className="text-xs font-bold text-slate-500 uppercase mb-1">Grupo</label>
                <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} className="p-2 border border-slate-300 rounded-lg text-sm">
                   {availableGroups.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
             </div>

             {/* Mode Specific Filters */}
             {(mode === 'capture' || mode === 'weekly') ? (
                 <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1">{mode === 'weekly' ? 'Seleccionar Semana' : 'Fecha de Asistencia'}</label>
                    <input 
                        type="date" 
                        value={selectedDate} 
                        onChange={(e) => setSelectedDate(e.target.value)} 
                        className="p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    {mode === 'weekly' && <p className="text-[10px] text-blue-600 mt-1">Semana: {weekDates[0]} al {weekDates[4]}</p>}
                 </div>
             ) : (
                 <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1">Mes del Reporte</label>
                    <input 
                        type="month" 
                        value={selectedMonth} 
                        onChange={(e) => setSelectedMonth(e.target.value)} 
                        className="p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                 </div>
             )}

             {(mode === 'report' || mode === 'weekly') && (
                 <button onClick={handlePrint} className="ml-auto flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 shadow transition-colors font-bold text-sm">
                     <Printer size={18}/> Imprimir Reporte
                 </button>
             )}
        </div>
      </div>

      {/* --- CONTENT --- */}
      <div className="flex-1 overflow-auto bg-slate-100 p-6 md:p-8 print:p-0 print:bg-white print:overflow-visible">
          
          {/* CAPTURE MODE */}
          {mode === 'capture' && (
              <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                      <div>
                          <h3 className="font-bold text-slate-700">Lista Nominal - {selectedGrade} "{selectedGroup}"</h3>
                          <p className="text-xs text-slate-500 uppercase font-bold">{new Date(selectedDate).toLocaleDateString('es-MX', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}</p>
                      </div>
                      <div className="flex gap-2">
                          <button onClick={() => markAll('present')} className="text-xs font-bold text-green-700 bg-green-100 px-3 py-1.5 rounded hover:bg-green-200 transition-colors">
                              Todos Presentes
                          </button>
                          <button onClick={() => markAll('absent')} className="text-xs font-bold text-red-700 bg-red-100 px-3 py-1.5 rounded hover:bg-red-200 transition-colors">
                              Todos Faltan
                          </button>
                      </div>
                  </div>
                  
                  <div className="overflow-y-auto max-h-[600px]">
                      <table className="w-full text-sm">
                          <thead className="bg-slate-100 sticky top-0 z-10">
                              <tr>
                                  <th className="p-3 text-left w-12 border-b">No.</th>
                                  <th className="p-3 text-left border-b">Nombre del Alumno</th>
                                  <th className="p-3 text-center border-b w-64">Estatus</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {students.map((student, idx) => (
                                  <tr key={student.id} className="hover:bg-slate-50">
                                      <td className="p-3 text-slate-500 font-mono text-center">{idx + 1}</td>
                                      <td className="p-3 font-bold uppercase text-slate-700">{student.name}</td>
                                      <td className="p-3">
                                          <div className="flex justify-center gap-1">
                                              {[
                                                  { k: 'present', l: 'P', c: 'green', full: 'Presente' },
                                                  { k: 'absent', l: 'F', c: 'red', full: 'Falta' },
                                                  { k: 'late', l: 'R', c: 'yellow', full: 'Retardo' },
                                                  { k: 'excused', l: 'J', c: 'blue', full: 'Justif.' },
                                              ].map(opt => {
                                                  const isSelected = dailyAttendance[student.id] === opt.k;
                                                  let baseClass = `w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center transition-all border `;
                                                  if (isSelected) {
                                                      if (opt.c === 'green') baseClass += 'bg-green-600 text-white border-green-700 shadow-md transform scale-105';
                                                      if (opt.c === 'red') baseClass += 'bg-red-600 text-white border-red-700 shadow-md transform scale-105';
                                                      if (opt.c === 'yellow') baseClass += 'bg-yellow-500 text-white border-yellow-600 shadow-md transform scale-105';
                                                      if (opt.c === 'blue') baseClass += 'bg-blue-600 text-white border-blue-700 shadow-md transform scale-105';
                                                  } else {
                                                      baseClass += 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50';
                                                  }

                                                  return (
                                                      <button 
                                                          key={opt.k}
                                                          onClick={() => handleStatusChange(student.id, opt.k as AttendanceStatus)}
                                                          className={baseClass}
                                                          title={opt.full}
                                                      >
                                                          {opt.l}
                                                      </button>
                                                  )
                                              })}
                                          </div>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>

                  <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center sticky bottom-0 z-20">
                      <div className="text-xs text-slate-500 font-bold">
                          {students.length} alumnos en lista
                      </div>
                      <button 
                        onClick={saveAttendance}
                        className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg flex items-center gap-2 transition-all active:scale-95"
                      >
                          {isSaved ? <Check size={18}/> : <Save size={18}/>}
                          {isSaved ? 'Guardado' : 'Guardar Asistencia'}
                      </button>
                  </div>
              </div>
          )}

          {/* WEEKLY REPORT MODE */}
          {mode === 'weekly' && (
              <div className="bg-white shadow-lg mx-auto p-[10mm] print:shadow-none print:w-full print:max-w-none text-black">
                   <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-4">
                        <div className="text-left">
                            <h1 className="text-sm font-bold uppercase">ESCUELA SECUNDARIA DIURNA No. 27</h1>
                            <h1 className="text-sm font-bold uppercase whitespace-nowrap">"ALFREDO E. URUCHURTU"</h1>
                        </div>
                        <div className="text-center px-4">
                            <h2 className="text-lg font-bold uppercase">REPORTE SEMANAL DE ASISTENCIA</h2>
                            <p className="text-xs uppercase font-bold text-slate-600 print:text-black">
                                Semana del {new Date(weekDates[0]).toLocaleDateString('es-MX', {day: 'numeric', month: 'long'})} al {new Date(weekDates[4]).toLocaleDateString('es-MX', {day: 'numeric', month: 'long'})}
                            </p>
                        </div>
                        <div className="text-right text-xs font-bold border border-black p-2">
                             <p>GRADO: {selectedGrade}</p>
                             <p>GRUPO: {selectedGroup}</p>
                        </div>
                   </div>

                   <div className="overflow-x-auto">
                       <table className="w-full border-collapse border border-black text-[10px] print:text-[10px]">
                           <thead>
                               <tr className="bg-slate-200 print:bg-slate-300 print:print-color-adjust-exact">
                                   <th className="border border-black p-1 w-8 text-center">No.</th>
                                   <th className="border border-black p-1 text-left min-w-[200px]">NOMBRE DEL ALUMNO</th>
                                   {weekDates.map((dateStr, idx) => (
                                       <th key={dateStr} className="border border-black p-1 w-16 text-center">
                                           <div className="uppercase">{['LUN', 'MAR', 'MIE', 'JUE', 'VIE'][idx]}</div>
                                           <div className="text-[8px]">{new Date(dateStr).getDate()}</div>
                                       </th>
                                   ))}
                                   <th className="border border-black p-1 w-16 text-center font-bold">TOTAL FALTAS</th>
                               </tr>
                           </thead>
                           <tbody>
                               {students.map((student, idx) => {
                                   let weekAbsences = 0;
                                   
                                   return (
                                       <tr key={student.id} className="print:h-6">
                                           <td className="border border-black p-1 text-center">{idx + 1}</td>
                                           <td className="border border-black p-1 font-bold uppercase truncate max-w-[250px]">{student.name}</td>
                                           {weekDates.map(dateStr => {
                                               const status = getRecordForDate(student.id, dateStr);
                                               let content = '';
                                               let cellClass = '';

                                               if (status === 'absent') { 
                                                   content = '•'; 
                                                   cellClass = 'text-red-600 font-extrabold text-lg leading-none bg-red-50 print:bg-transparent';
                                                   weekAbsences++;
                                               }
                                               if (status === 'late') { content = 'R'; cellClass = 'text-yellow-600 font-bold'; }
                                               if (status === 'excused') { content = 'J'; cellClass = 'text-blue-600 font-bold'; }
                                               if (status === 'present') { content = '●'; cellClass = 'text-green-600 font-extrabold text-[10px]'; }

                                               return (
                                                   <td key={dateStr} className={`border border-black p-0 text-center align-middle ${cellClass}`}>
                                                       {content}
                                                   </td>
                                               );
                                           })}
                                           <td className="border border-black p-1 text-center font-bold bg-slate-50 print:bg-transparent">
                                               {weekAbsences > 0 ? <span className="text-red-600">{weekAbsences}</span> : '0'}
                                           </td>
                                       </tr>
                                   );
                               })}
                           </tbody>
                       </table>
                   </div>

                   <div className="mt-8 flex justify-between text-xs font-bold uppercase text-center px-12">
                        <div>
                            <div className="border-t border-black pt-2 w-48 mx-auto">{currentUser.name}</div>
                            <p>DOCENTE RESPONSABLE</p>
                        </div>
                        {/* FIRMA VINCULADA: SUBDIRECTOR DE GESTIÓN */}
                        <div>
                            <div className="border-t border-black pt-2 w-48 mx-auto">{data.subdirectorGestion || 'Lic. Pendiente Asignar'}</div>
                            <p>SUBDIRECTOR DE GESTIÓN</p>
                        </div>
                   </div>
              </div>
          )}

          {/* MONTHLY REPORT MODE */}
          {mode === 'report' && (
              <div className="bg-white shadow-lg mx-auto p-[10mm] print:shadow-none print:w-full print:max-w-none text-black">
                   <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-4">
                        <div className="text-left">
                            <h1 className="text-sm font-bold uppercase">ESCUELA SECUNDARIA DIURNA No. 27</h1>
                            <h1 className="text-sm font-bold uppercase whitespace-nowrap">"ALFREDO E. URUCHURTU"</h1>
                        </div>
                        <div className="text-center px-4">
                            <h2 className="text-lg font-bold uppercase">CONCENTRADO MENSUAL DE ASISTENCIA</h2>
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
                       <table className="w-full border-collapse border border-black text-[10px] print:text-[9px]">
                           <thead>
                               <tr className="bg-slate-200 print:bg-slate-300 print:print-color-adjust-exact">
                                   <th className="border border-black p-1 w-8 text-center">No.</th>
                                   <th className="border border-black p-1 text-left min-w-[200px]">NOMBRE DEL ALUMNO</th>
                                   {daysArray.map(d => (
                                       <th key={d} className="border border-black p-0.5 w-6 text-center">{d}</th>
                                   ))}
                                   <th className="border border-black p-1 w-8 text-center bg-green-100 print:bg-slate-200" title="Asistencias">A</th>
                                   <th className="border border-black p-1 w-8 text-center bg-yellow-100 print:bg-slate-200" title="Retardos">R</th>
                                   <th className="border border-black p-1 w-8 text-center bg-red-100 print:bg-slate-200" title="Faltas">F</th>
                               </tr>
                           </thead>
                           <tbody>
                               {students.map((student, idx) => {
                                   const stats = calculateMonthlyStats(student.id);
                                   return (
                                       <tr key={student.id} className="print:h-5">
                                           <td className="border border-black p-1 text-center">{idx + 1}</td>
                                           <td className="border border-black p-1 font-bold uppercase truncate max-w-[200px]">{student.name}</td>
                                           {daysArray.map(d => {
                                               const status = getMonthlyRecord(student.id, d);
                                               let content = '';
                                               let cellClass = '';

                                               if (status === 'absent') { content = '•'; cellClass = 'text-red-600 font-extrabold text-lg leading-none bg-red-50 print:bg-transparent'; }
                                               if (status === 'late') { content = 'R'; cellClass = 'text-yellow-600 font-bold'; }
                                               if (status === 'excused') { content = 'J'; cellClass = 'text-blue-600 font-bold'; }
                                               if (status === 'present') { content = '●'; cellClass = 'text-green-600 font-extrabold text-[10px]'; }

                                               return (
                                                   <td key={d} className={`border border-black p-0 text-center align-middle ${cellClass}`}>
                                                       {content}
                                                   </td>
                                               );
                                           })}
                                           <td className="border border-black p-1 text-center font-bold bg-green-50 print:bg-transparent">{stats.present}</td>
                                           <td className="border border-black p-1 text-center font-bold bg-yellow-50 print:bg-transparent">{stats.late}</td>
                                           <td className="border border-black p-1 text-center font-bold bg-red-50 print:bg-transparent text-red-600">{stats.absent}</td>
                                       </tr>
                                   );
                               })}
                           </tbody>
                       </table>
                   </div>

                   <div className="mt-8 flex justify-between text-xs font-bold uppercase text-center px-12">
                        <div>
                            <div className="border-t border-black pt-2 w-48 mx-auto">{currentUser.name}</div>
                            <p>DOCENTE RESPONSABLE</p>
                        </div>
                        {/* FIRMA VINCULADA: SUBDIRECTOR DE GESTIÓN */}
                        <div>
                            <div className="border-t border-black pt-2 w-48 mx-auto">{data.subdirectorGestion || 'Lic. Pendiente Asignar'}</div>
                            <p>SUBDIRECTOR DE GESTIÓN</p>
                        </div>
                   </div>
              </div>
          )}

      </div>
    </div>
  );
};

export default AttendanceView;
