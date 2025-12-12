

import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Calendar, AlertTriangle, Clock, ArrowRightCircle, Check, AlertCircle } from 'lucide-react';
import { SchoolData, Student, GradeScores } from '../types';
import { generateEmptyGrades } from '../utils';

interface GradeControlViewProps {
  data: SchoolData;
  onUpdateData: (newData: SchoolData) => void;
  currentCycle: string;
  onCycleChange: (newCycle: string) => void;
}

const GradeControlView: React.FC<GradeControlViewProps> = ({ data, onUpdateData, currentCycle, onCycleChange }) => {
  const [currentTimeCDMX, setCurrentTimeCDMX] = useState<string>('');
  const [showPromotionConfirm, setShowPromotionConfirm] = useState(false);
  const [promotionResults, setPromotionResults] = useState('');
  const [promotionError, setPromotionError] = useState('');

  // Clock effect
  useEffect(() => {
    const updateTime = () => {
        const now = new Date();
        const options: Intl.DateTimeFormatOptions = { 
            timeZone: "America/Mexico_City", 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            hour12: true
        };
        setCurrentTimeCDMX(new Intl.DateTimeFormat('es-MX', options).format(now));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Nuevo esquema de periodos
  const blocks = [
    { 
        id: 1, 
        title: 'Primer Momento',
        periods: [
            { key: 'inter_1', label: '1° Avance (Semáforo)' },
            { key: 'trim_1', label: '1° Trimestre (Numérico)' }
        ]
    },
    { 
        id: 2, 
        title: 'Segundo Momento',
        periods: [
            { key: 'inter_2', label: '2° Avance (Semáforo)' },
            { key: 'trim_2', label: '2° Trimestre (Numérico)' }
        ]
    },
    { 
        id: 3, 
        title: 'Tercer Momento',
        periods: [
            { key: 'inter_3', label: '3° Avance (Semáforo)' },
            { key: 'trim_3', label: '3° Trimestre (Numérico)' }
        ]
    },
  ];

  const togglePeriod = (periodKey: string) => {
    const isAllowed = data.allowedPeriods.includes(periodKey);
    let newAllowedPeriods;
    
    if (isAllowed) {
      newAllowedPeriods = data.allowedPeriods.filter(p => p !== periodKey);
    } else {
      newAllowedPeriods = [...data.allowedPeriods, periodKey];
    }

    onUpdateData({
      ...data,
      allowedPeriods: newAllowedPeriods
    });
  };

  const handleDateChange = (periodKey: string, dateValue: string) => {
      onUpdateData({
          ...data,
          periodDeadlines: {
              ...data.periodDeadlines,
              [periodKey]: dateValue
          }
      });
  };

  // --- PROMOTION LOGIC ---

  const checkAllGradesComplete = (): boolean => {
      // 1. Filtrar solo alumnos activos (no graduados)
      const activeStudents = data.studentsData.filter(s => s.status !== 'graduated' && s.grade !== 'Egresado');
      
      for (const student of activeStudents) {
          const gradeStruct = data.gradesStructure.find(g => g.grade === student.grade);
          if (!gradeStruct) continue;

          // Filtrar materias que no están ocultas
          const relevantSubjects = gradeStruct.subjects.filter(s => !gradeStruct.hiddenSubjects?.includes(s));

          for (const subj of relevantSubjects) {
               const grades = student.grades[subj] as GradeScores;
               // Verificar Trimestre 3
               if (!grades || !grades.trim_3 || grades.trim_3 === '') {
                   return false; 
               }
          }
      }
      return true;
  };

  const getNextCycle = (cycle: string) => {
      // Assuming format YYYY-YYYY (e.g., 2024-2025)
      const parts = cycle.split('-');
      if (parts.length === 2) {
          const start = parseInt(parts[0]);
          const end = parseInt(parts[1]);
          if (!isNaN(start) && !isNaN(end)) {
              return `${start + 1}-${end + 1}`;
          }
      }
      return "2025-2026"; // Fallback
  };

  const executePromotion = () => {
      // 1. Validar Calificaciones Completas
      if (!checkAllGradesComplete()) {
          setPromotionError('No se puede promover: Faltan calificaciones del 3er Trimestre en algunos alumnos activos.');
          return;
      }
      setPromotionError('');

      let movedToNext = 0;
      let graduated = 0;
      let unchanged = 0;

      // 2. Promover Alumnos y Limpiar Calificaciones
      const updatedStudents = data.studentsData.map(student => {
          // Si ya es egresado, se queda igual
          if (student.status === 'graduated' || student.grade === 'Egresado') {
              unchanged++;
              return student;
          }

          // 3° Grado -> Graduado
          if (student.grade === '3°') {
              graduated++;
              return {
                  ...student,
                  grade: 'Egresado',
                  status: 'graduated' as const,
                  group: `Gen. ${currentCycle}` // Guardar generación
              };
          }

          // 2° -> 3°
          if (student.grade === '2°') {
              movedToNext++;
              return {
                  ...student,
                  grade: '3°',
                  grades: generateEmptyGrades('3°') // Limpiar calificaciones
              };
          }

          // 1° -> 2°
          if (student.grade === '1°') {
              movedToNext++;
              return {
                  ...student,
                  grade: '2°',
                  grades: generateEmptyGrades('2°') // Limpiar calificaciones
              };
          }

          unchanged++;
          return student;
      });

      // 3. Resetear Asignaciones de Profesores (assignment array vacío)
      //    Pero mantener perfil, usuario y contraseña.
      const updatedUsers = data.users.map(u => {
          if (u.role === 'teacher') {
              return { ...u, assignments: [] };
          }
          if (u.role === 'administrative' || u.role === 'apoyo') {
             // Podríamos querer limpiar workSchedule también si es necesario, 
             // pero la solicitud dice "asignación de asignaturas y grupos".
             return { ...u, assignments: [] };
          }
          return u;
      });

      // 4. Calcular Nuevo Ciclo
      const nextCycle = getNextCycle(currentCycle);

      // 5. Resetear Datos Globales
      const newData: SchoolData = {
          ...data,
          studentsData: updatedStudents,
          users: updatedUsers,
          schedules: [], // Limpiar Horarios
          sabanaLayout: { // Resetear Layout de Sábana
              academic: [],
              technology: [],
              support: []
          },
          allowedPeriods: ['inter_1'], // Reiniciar a solo 1er periodo abierto
          periodDeadlines: {}, // Limpiar fechas límite
          citations: [], // Opcional: ¿Limpiar citatorios? Generalmente sí por ciclo.
          visitLogs: [],
          minutas: []
      };

      onUpdateData(newData);
      onCycleChange(nextCycle); // Actualizar ciclo global

      setPromotionResults(`¡Transición Exitosa! Ciclo escolar actualizado a ${nextCycle}. ${movedToNext} alumnos promovidos, ${graduated} egresados. Horarios y asignaciones reseteados.`);
      setShowPromotionConfirm(false);
  };

  const canPromote = checkAllGradesComplete();

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div className="space-y-2">
            <h2 className="text-3xl font-bold text-slate-800">Control de Periodos</h2>
            <p className="text-slate-500">Administra la apertura y cierre automático de evaluaciones.</p>
        </div>
        <div className="bg-slate-800 text-white px-5 py-3 rounded-xl flex items-center shadow-lg">
            <Clock className="mr-3 text-blue-400" size={24} />
            <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Hora CDMX</p>
                <p className="text-2xl font-mono font-bold leading-none">{currentTimeCDMX}</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {blocks.map(block => (
          <div key={block.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-700">{block.title}</h3>
              <Calendar size={18} className="text-slate-400" />
            </div>
            <div className="divide-y divide-slate-100 flex-1">
              {block.periods.map(period => {
                const isOpen = data.allowedPeriods.includes(period.key);
                const isInter = period.key.startsWith('inter');
                const deadline = data.periodDeadlines?.[period.key] || '';
                
                return (
                  <div key={period.key} className="p-4 flex flex-col gap-3 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="font-medium text-slate-800 text-sm">{period.label}</span>
                            <span className={`text-xs font-bold ${isInter ? 'text-orange-500' : 'text-blue-500'}`}>
                                {isInter ? 'Cualitativo (Verde/Rojo)' : 'Cuantitativo (0-10)'}
                            </span>
                        </div>
                        
                        <button
                        onClick={() => togglePeriod(period.key)}
                        className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-all duration-200 shadow-sm ${
                            isOpen 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200' 
                            : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100'
                        }`}
                        >
                        {isOpen ? <Unlock size={16} /> : <Lock size={16} />}
                        <span className="text-xs font-bold uppercase">{isOpen ? 'Abierto' : 'Cerrado'}</span>
                        </button>
                    </div>

                    {/* Auto Close Input */}
                    <div className="bg-slate-50 p-2 rounded border border-slate-200">
                        <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1 mb-1">
                            <Clock size={10} /> Cierre Automático (Día y Hora)
                        </label>
                        <input 
                            type="datetime-local" 
                            value={deadline}
                            onChange={(e) => handleDateChange(period.key, e.target.value)}
                            disabled={!isOpen}
                            className="w-full text-xs p-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none disabled:opacity-50 disabled:bg-slate-100"
                        />
                        {deadline && isOpen && (
                            <div className="mt-1 text-[9px] text-blue-600 font-medium">
                                Se cerrará el: {new Date(deadline).toLocaleString('es-MX')}
                            </div>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 items-start">
          <AlertTriangle className="text-blue-600 flex-shrink-0" size={20} />
          <div className="text-sm text-blue-800">
              <p className="font-bold">Nota importante:</p>
              <p>Si programas una fecha y hora de cierre, el sistema bloqueará automáticamente la captura cuando el reloj de la CDMX marque ese momento. Asegúrate de comunicar esta fecha límite a los docentes.</p>
          </div>
      </div>

      {/* --- PROMOTION SECTION --- */}
      <div className="border-t border-slate-200 pt-8 mt-8">
          <h3 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <ArrowRightCircle /> Transición de Ciclo Escolar
          </h3>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
             <p className="text-slate-600 mb-4">
                 Esta acción promoverá a todos los alumnos activos al siguiente grado escolar para iniciar el nuevo ciclo.
                 <br />
                 <span className="text-red-600 font-bold text-sm">
                     * Los alumnos de 3° Grado pasarán a estatus "Egresado".
                     <br/>
                     * Los alumnos de 1° y 2° pasarán al siguiente nivel y sus calificaciones se reiniciarán a cero.
                     <br/>
                     * Se resetearán los horarios y las asignaciones de grupos de los profesores.
                 </span>
             </p>
             
             {promotionResults && (
                 <div className="mb-4 p-4 bg-green-50 text-green-700 border border-green-200 rounded-xl flex items-center gap-2">
                     <Check size={20} />
                     {promotionResults}
                 </div>
             )}

             {promotionError && (
                 <div className="mb-4 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-center gap-2">
                     <AlertCircle size={20} />
                     {promotionError}
                 </div>
             )}

             {!showPromotionConfirm ? (
                 <div className="flex flex-col gap-2">
                    <button 
                        onClick={() => {
                            if (canPromote) {
                                setShowPromotionConfirm(true);
                                setPromotionError('');
                            } else {
                                setPromotionError('No se puede promover: Aún hay alumnos sin calificación del 3er Trimestre. Complete las evaluaciones.');
                            }
                        }}
                        className={`bg-slate-800 text-white px-6 py-3 rounded-xl font-bold transition-colors w-fit ${!canPromote ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-900'}`}
                    >
                        Promover Alumnos al Siguiente Grado
                    </button>
                    {!canPromote && <p className="text-xs text-red-500 font-bold">* Opción deshabilitada hasta completar calificaciones del 3er Trimestre.</p>}
                 </div>
             ) : (
                 <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
                     <p className="font-bold text-red-800 mb-2">¿Estás completamente seguro?</p>
                     <p className="text-sm text-red-700 mb-4">
                         Se generará el ciclo <strong>{getNextCycle(currentCycle)}</strong>. 
                         Esta acción modificará los grados de todos los alumnos, limpiará calificaciones y borrará horarios actuales.
                     </p>
                     <div className="flex gap-4">
                         <button 
                            onClick={executePromotion}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700"
                         >
                             Sí, Promover e Iniciar Nuevo Ciclo
                         </button>
                         <button 
                            onClick={() => setShowPromotionConfirm(false)}
                            className="bg-white text-slate-700 border border-slate-300 px-4 py-2 rounded-lg font-bold hover:bg-slate-50"
                         >
                             Cancelar
                         </button>
                     </div>
                 </div>
             )}
          </div>
      </div>
    </div>
  );
};

export default GradeControlView;