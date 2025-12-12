

import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle2, Search, Lock, Cpu, Filter, BookOpen, Circle, AlertTriangle } from 'lucide-react';
import { SchoolData, User, GradeScores } from '../types';

interface GradeRegistrationViewProps {
  currentUser: User;
  data: SchoolData;
  onBack: () => void;
  onUpdateData: (newData: SchoolData) => void;
}

const GradeRegistrationView: React.FC<GradeRegistrationViewProps> = ({ 
  currentUser,
  data, 
  onBack, 
  onUpdateData 
}) => {
  const [localData, setLocalData] = useState<SchoolData>(data);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  
  // Sync local data with prop data (for real-time updates)
  useEffect(() => {
      setLocalData(data);
  }, [data]);

  // --- SELECTION STATE ---
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedTech, setSelectedTech] = useState<string>('');
  const [selectedGroupOrSection, setSelectedGroupOrSection] = useState<string>(''); 
  const [searchTerm, setSearchTerm] = useState('');

  // --- DERIVED LISTS ---
  const availableGrades = React.useMemo(() => {
    if (currentUser.role === 'admin' || currentUser.role === 'subdirector') {
        return data.gradesStructure.map(g => g.grade);
    } else {
        return Array.from(new Set(currentUser.assignments?.map(a => a.grade) || [])).sort();
    }
  }, [currentUser, data]);

  const availableSubjects = React.useMemo(() => {
    if (!selectedGrade) return [];
    if (currentUser.role === 'admin' || currentUser.role === 'subdirector') {
        return data.gradesStructure.find(g => g.grade === selectedGrade)?.subjects || [];
    } else if (currentUser.role === 'administrative') {
         // Administrativos assigned to a grade can see ALL subjects for that grade
         const isAssigned = currentUser.assignments?.some(a => a.grade === selectedGrade);
         return isAssigned ? (data.gradesStructure.find(g => g.grade === selectedGrade)?.subjects || []) : [];
    } else {
        return Array.from(new Set(
            currentUser.assignments
                ?.filter(a => a.grade === selectedGrade)
                .map(a => a.subject) || []
        )).sort();
    }
  }, [selectedGrade, currentUser, data]);

  const availableGroupsOrSections = React.useMemo(() => {
    if (!selectedGrade || !selectedSubject) return [];
    const isTech = selectedSubject === 'Tecnología';

    if (currentUser.role === 'admin' || currentUser.role === 'subdirector') {
        if (isTech) {
            return [
                { value: 'AC', label: 'Sección 1 (A + C)' },
                { value: 'BD', label: 'Sección 2 (B + D)' }
            ];
        } else {
            const groups = data.gradesStructure.find(g => g.grade === selectedGrade)?.groups || [];
            return groups.map(g => ({ value: g, label: `Grupo ${g}` }));
        }
    } else {
        // Teachers and Administrative
        const relevantAssignments = currentUser.assignments?.filter(a => 
            a.grade === selectedGrade && 
            (currentUser.role === 'administrative' ? true : a.subject === selectedSubject)
        ) || [];

        if (isTech) {
             const groups = relevantAssignments.map(a => a.group);
             const options = [];
             if (groups.includes('A') || groups.includes('C')) options.push({ value: 'AC', label: 'Sección 1 (A + C)' });
             if (groups.includes('B') || groups.includes('D')) options.push({ value: 'BD', label: 'Sección 2 (B + D)' });
             return options.filter((v,i,a)=>a.findIndex(t=>(t.value===v.value))===i);
        } else {
            // Unique groups
            const groups = Array.from(new Set(relevantAssignments.map(a => a.group))).sort();
            return groups.map(g => ({ value: g, label: `Grupo ${g}` }));
        }
    }
  }, [selectedGrade, selectedSubject, currentUser, data]);

  const availableTechnologies = React.useMemo(() => {
      if (selectedSubject !== 'Tecnología') return [];
      if (currentUser.role === 'admin' || currentUser.role === 'subdirector') {
          return data.technologies;
      } else {
          // If Administrative, show all technologies available in the system (since they manage the group)
          if (currentUser.role === 'administrative') return data.technologies;

          const relevantAssignments = currentUser.assignments?.filter(a => 
            a.grade === selectedGrade && 
            a.subject === selectedSubject &&
            (
                (selectedGroupOrSection === 'AC' && (a.group === 'A' || a.group === 'C')) ||
                (selectedGroupOrSection === 'BD' && (a.group === 'B' || a.group === 'D')) ||
                (!selectedGroupOrSection)
            )
          );
          return Array.from(new Set(relevantAssignments?.map(a => a.technology).filter(Boolean) as string[]) || []);
      }
  }, [selectedSubject, selectedGrade, selectedGroupOrSection, currentUser, data.technologies]);

  // --- AUTO-SELECTION ---
  useEffect(() => {
      if (availableGrades.length === 1 && !selectedGrade) setSelectedGrade(availableGrades[0]);
  }, [availableGrades, selectedGrade]);

  useEffect(() => {
      if (availableSubjects.length === 1 && !selectedSubject) setSelectedSubject(availableSubjects[0]);
      else if (!availableSubjects.includes(selectedSubject)) setSelectedSubject('');
  }, [availableSubjects, selectedSubject]);

  useEffect(() => {
      if (availableGroupsOrSections.length === 1 && !selectedGroupOrSection) setSelectedGroupOrSection(availableGroupsOrSections[0].value);
      else if (!availableGroupsOrSections.find(g => g.value === selectedGroupOrSection)) setSelectedGroupOrSection('');
  }, [availableGroupsOrSections, selectedGroupOrSection]);

  useEffect(() => {
      if (availableTechnologies.length === 1 && !selectedTech) setSelectedTech(availableTechnologies[0]);
      else if (!availableTechnologies.includes(selectedTech)) {
           if (currentUser.role === 'teacher' && availableTechnologies.length > 0) setSelectedTech(availableTechnologies[0]);
           else setSelectedTech('');
      }
  }, [availableTechnologies, selectedTech, currentUser]);

  // --- FILTERING ---
  const isTechSubject = selectedSubject === 'Tecnología';
  const showTable = selectedGrade && selectedSubject && selectedGroupOrSection && (isTechSubject ? selectedTech : true);

  const students = localData.studentsData.filter(s => s.grade === selectedGrade && s.status !== 'dropped' && s.status !== 'graduated');
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.id.toString().includes(searchTerm);
    if (!matchesSearch) return false;

    if (isTechSubject) {
        if (selectedTech && s.technology !== selectedTech) return false;
        if (selectedGroupOrSection === 'AC') return s.group === 'A' || s.group === 'C';
        else if (selectedGroupOrSection === 'BD') return s.group === 'B' || s.group === 'D';
        return false;
    } else {
        return s.group === selectedGroupOrSection;
    }
  }).sort((a, b) => a.name.localeCompare(b.name));

  // --- VISIBILITY LOGIC ---
  // Determines if a column should be visible based on user role and open periods
  const shouldShowColumn = (periodKey: string) => {
      // Admins and Administrative staff see EVERYTHING always
      if (['admin', 'subdirector', 'administrative'].includes(currentUser.role)) {
          return true;
      }
      // Teachers only see OPEN periods
      return data.allowedPeriods.includes(periodKey);
  };

  // --- GRADING HANDLERS ---

  // Cambiar estatus de Semáforo (Inter-trimestral)
  const handleStatusChange = (studentId: number, period: string, status: 'GREEN' | 'RED') => {
      if (!data.allowedPeriods.includes(period)) return;

      setLocalData(prevData => {
          const newData = { ...prevData };
          const studentIndex = newData.studentsData.findIndex(s => s.id === studentId);
          if (studentIndex === -1) return prevData;

          const updatedStudent = { ...newData.studentsData[studentIndex] };
          const updatedGrades = { ...updatedStudent.grades };
          // Toggle: Si ya tiene ese status, lo quitamos (vacío). Si no, lo ponemos.
          const currentStatus = updatedGrades[selectedSubject][period];
          const newStatus = currentStatus === status ? '' : status;

          updatedGrades[selectedSubject] = { ...updatedGrades[selectedSubject], [period]: newStatus };
          updatedStudent.grades = updatedGrades;
          newData.studentsData[studentIndex] = updatedStudent;
          return newData;
      });
  };

  // Cambiar calificación numérica (Trimestral) - LÓGICA 5-10 SIN DECIMALES
  const handleNumericChange = (studentId: number, period: string, value: string) => {
      if (!data.allowedPeriods.includes(period)) return;
      
      // Permitir borrar
      if (value === '') {
          updateGrade(studentId, period, value);
          return;
      }

      // Bloquear decimales y caracteres no numéricos
      if (value.includes('.') || value.includes(',') || /\D/.test(value)) return;

      const num = parseInt(value, 10);

      // Reglas de negocio:
      // 1. Debe ser un entero.
      // 2. Rango válido de calificación: 5 a 10.
      // 3. Excepción: Permitimos escribir '1' para que el usuario pueda completar '10'.
      if ((num >= 5 && num <= 10) || num === 1) {
         updateGrade(studentId, period, value);
      }
      // Si el número es 0, 2, 3, 4 (excepto 1), 11, etc., no se actualiza el estado (input bloqueado).
  };

  const updateGrade = (studentId: number, period: string, value: string) => {
      setLocalData(prevData => {
          const newData = { ...prevData };
          const studentIndex = newData.studentsData.findIndex(s => s.id === studentId);
          if (studentIndex === -1) return prevData;

          const updatedStudent = { ...newData.studentsData[studentIndex] };
          const updatedGrades = { ...updatedStudent.grades };
          updatedGrades[selectedSubject] = { ...updatedGrades[selectedSubject], [period]: value };
          updatedStudent.grades = updatedGrades;
          newData.studentsData[studentIndex] = updatedStudent;
          return newData;
      });
  }

  const handleSave = () => {
    setIsSaving(true);
    setSaveMessage(null);
    setTimeout(() => {
      onUpdateData(localData);
      setIsSaving(false);
      setSaveMessage({ type: 'success', text: 'Cambios guardados exitosamente.' });
      setTimeout(() => setSaveMessage(null), 3000);
    }, 800);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 h-full flex flex-col">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-3xl font-bold text-slate-800">Registro de Evaluación</h2>
                <p className="text-slate-500">Semáforo de Alerta (Intermedio) y Calificaciones Trimestrales.</p>
            </div>
             {showTable && (
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white font-semibold rounded-xl shadow-lg hover:bg-blue-700 hover:shadow-blue-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed animate-fade-in"
                >
                    {isSaving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save size={18} />}
                    <span>{isSaving ? 'Guardando...' : 'Guardar'}</span>
                </button>
             )}
        </div>

        {/* SELECTOR BAR */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 items-end">
            {/* Grade */}
            <div className="flex flex-col">
                 <label className="text-xs font-bold text-slate-500 uppercase mb-1">Grado</label>
                 <select value={selectedGrade} onChange={(e) => { setSelectedGrade(e.target.value); setSelectedSubject(''); setSelectedGroupOrSection(''); setSelectedTech(''); }} className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">-- Seleccionar --</option>
                    {availableGrades.map(g => <option key={g} value={g}>{g}</option>)}
                 </select>
            </div>
            {/* Subject */}
            <div className="flex flex-col md:col-span-2 lg:col-span-1">
                 <label className="text-xs font-bold text-slate-500 uppercase mb-1">Asignatura</label>
                 <select value={selectedSubject} onChange={(e) => { setSelectedSubject(e.target.value); setSelectedGroupOrSection(''); setSelectedTech(''); }} disabled={!selectedGrade} className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-400">
                    <option value="">-- Seleccionar --</option>
                    {availableSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
            </div>
            {/* Tech */}
            {isTechSubject && (
                 <div className="flex flex-col animate-fade-in">
                    <label className="text-xs font-bold text-blue-600 uppercase mb-1 flex items-center gap-1"><Cpu size={12}/> Taller</label>
                    <select value={selectedTech} onChange={(e) => setSelectedTech(e.target.value)} className="w-full p-2.5 border border-blue-200 bg-blue-50 text-blue-900 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="">-- Taller --</option>
                        {availableTechnologies.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            )}
            {/* Group/Section */}
            <div className="flex flex-col">
                 <label className="text-xs font-bold text-slate-500 uppercase mb-1">{isTechSubject ? 'Sección' : 'Grupo'}</label>
                 <select value={selectedGroupOrSection} onChange={(e) => setSelectedGroupOrSection(e.target.value)} disabled={!selectedSubject} className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-400">
                    <option value="">-- {isTechSubject ? 'Sección' : 'Grupo'} --</option>
                    {availableGroupsOrSections.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
                 </select>
            </div>
             {/* Search */}
             <div className="flex flex-col md:col-span-4 lg:col-span-1">
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><Filter size={12} /> Filtrar</label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                    <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} disabled={!showTable} className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-slate-50"/>
                </div>
            </div>
        </div>
      </div>

      {saveMessage && (
        <div className={`p-4 rounded-xl flex items-center space-x-2 ${saveMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'} animate-fade-in`}>
            {saveMessage.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span>{saveMessage.text}</span>
        </div>
      )}

      {/* --- TABLE AREA --- */}
      <div className="flex-1 overflow-hidden bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col relative">
        {!showTable ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                <BookOpen size={48} className="mb-4 opacity-20" />
                <p className="text-lg font-medium">Selecciona parámetros para ver la lista</p>
            </div>
        ) : (
            <div className="overflow-auto h-full">
                <table className="min-w-max divide-y divide-slate-200">
                <thead className="bg-slate-50 sticky top-0 z-10">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50 sticky left-0 z-20 shadow-r border-b border-slate-200 min-w-[250px]">Alumno</th>
                        {[1, 2, 3].map(num => (
                            <React.Fragment key={num}>
                                {/* Inter-period Header */}
                                {shouldShowColumn(`inter_${num}`) && (
                                    <th className={`px-2 py-2 text-center border-l border-b border-slate-200 min-w-[100px] ${!data.allowedPeriods.includes(`inter_${num}`) ? 'bg-slate-100' : 'bg-orange-50'}`}>
                                        <div className="flex flex-col items-center">
                                            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Avance {num}</span>
                                            {!data.allowedPeriods.includes(`inter_${num}`) ? <Lock size={12} className="text-slate-400"/> : <AlertTriangle size={12} className="text-orange-400"/>}
                                        </div>
                                    </th>
                                )}
                                {/* Trim Header */}
                                {shouldShowColumn(`trim_${num}`) && (
                                    <th className={`px-2 py-2 text-center border-l border-b border-slate-200 w-20 ${!data.allowedPeriods.includes(`trim_${num}`) ? 'bg-slate-100' : 'bg-blue-50'}`}>
                                        <div className="flex flex-col items-center">
                                            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Trim {num}</span>
                                            {!data.allowedPeriods.includes(`trim_${num}`) && <Lock size={12} className="text-slate-400"/>}
                                        </div>
                                    </th>
                                )}
                            </React.Fragment>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                    {filteredStudents.map(student => {
                        const grades = student.grades[selectedSubject] as GradeScores;
                        return (
                            <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3 text-sm font-medium text-slate-900 sticky left-0 bg-white group-hover:bg-slate-50 border-r border-slate-100">
                                    <div className="flex flex-col">
                                        <span className="uppercase">{student.name}</span>
                                        <div className="flex gap-2 text-xs">
                                            <span className="text-slate-400">{student.grade} - {student.group}</span>
                                            {isTechSubject && <span className="text-blue-500 font-bold">{student.technology}</span>}
                                        </div>
                                    </div>
                                </td>
                                {[1, 2, 3].map(num => {
                                    const interKey = `inter_${num}`;
                                    const trimKey = `trim_${num}`;
                                    const interLocked = !data.allowedPeriods.includes(interKey);
                                    const trimLocked = !data.allowedPeriods.includes(trimKey);
                                    const status = grades ? grades[interKey] : '';
                                    const grade = grades ? grades[trimKey] : '';

                                    return (
                                        <React.Fragment key={num}>
                                            {/* TRAFFIC LIGHT BUTTONS */}
                                            {shouldShowColumn(interKey) && (
                                                <td className={`px-2 py-3 border-l border-slate-100 text-center ${interLocked ? 'bg-slate-50' : ''}`}>
                                                    <div className="flex items-center justify-center gap-3">
                                                        <button 
                                                            disabled={interLocked}
                                                            onClick={() => handleStatusChange(student.id, interKey, 'GREEN')}
                                                            title="Alumno Regular"
                                                            className={`w-6 h-6 rounded-full border transition-all shadow-sm flex items-center justify-center
                                                                ${status === 'GREEN' 
                                                                    ? 'bg-green-500 border-green-600 ring-2 ring-green-200 scale-110' 
                                                                    : 'bg-green-100 border-green-200 hover:bg-green-200' 
                                                                } 
                                                                ${interLocked 
                                                                    ? (status === 'GREEN' ? 'opacity-100' : 'opacity-20') 
                                                                    : 'opacity-100'
                                                                }
                                                                disabled:cursor-not-allowed`}
                                                        >
                                                        </button>
                                                        <button 
                                                            disabled={interLocked}
                                                            onClick={() => handleStatusChange(student.id, interKey, 'RED')}
                                                            title="Requiere Apoyo"
                                                            className={`w-6 h-6 rounded-full border transition-all shadow-sm flex items-center justify-center
                                                                ${status === 'RED' 
                                                                    ? 'bg-red-500 border-red-600 ring-2 ring-red-200 scale-110' 
                                                                    : 'bg-red-100 border-red-200 hover:bg-red-200'
                                                                }
                                                                ${interLocked 
                                                                    ? (status === 'RED' ? 'opacity-100' : 'opacity-20') 
                                                                    : 'opacity-100'
                                                                }
                                                                disabled:cursor-not-allowed`}
                                                        >
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                            {/* NUMERIC INPUT */}
                                            {shouldShowColumn(trimKey) && (
                                                <td className={`px-2 py-3 border-l border-slate-100 ${trimLocked ? 'bg-slate-50' : ''}`}>
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        maxLength={2}
                                                        disabled={trimLocked}
                                                        value={grade}
                                                        onChange={(e) => handleNumericChange(student.id, trimKey, e.target.value)}
                                                        className={`w-full px-2 py-1.5 text-center text-sm font-bold border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                                                            disabled:bg-transparent disabled:border-none disabled:text-slate-900 disabled:font-extrabold disabled:shadow-none
                                                            ${!trimLocked && grade !== '' && Number(grade) < 6 ? 'text-red-600 bg-red-50 border-red-200' : 'text-slate-700 border-slate-200'}
                                                        `}
                                                        placeholder={trimLocked ? '' : '-'}
                                                    />
                                                </td>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
                </table>
            </div>
        )}
      </div>
    </div>
  );
};

export default GradeRegistrationView;
