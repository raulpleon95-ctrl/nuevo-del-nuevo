

import React, { useState } from 'react';
import { Edit2, Save, X, Library, AlertTriangle, CheckCircle2, Plus, Eye, EyeOff, Cpu, Trash2 } from 'lucide-react';
import { SchoolData, GradeScores } from '../types';

interface SubjectsConfigViewProps {
  data: SchoolData;
  onUpdateData: (newData: SchoolData) => void;
}

const SubjectsConfigView: React.FC<SubjectsConfigViewProps> = ({ data, onUpdateData }) => {
  // Estados para Edición (Renombrar)
  const [editingGrade, setEditingGrade] = useState<string | null>(null);
  const [editingSubjectOldName, setEditingSubjectOldName] = useState<string | null>(null);
  const [newSubjectName, setNewSubjectName] = useState('');
  
  // Estados para Agregar Nueva Materia
  const [addingToGrade, setAddingToGrade] = useState<string | null>(null);
  const [newAddName, setNewAddName] = useState('');

  // Estados para Tecnologías
  const [editingTechOldName, setEditingTechOldName] = useState<string | null>(null);
  const [newTechName, setNewTechName] = useState('');
  const [addingTech, setAddingTech] = useState(false);
  const [newAddTechName, setNewAddTechName] = useState('');

  const [message, setMessage] = useState<{ type: 'success' | 'warning', text: string } | null>(null);

  // --- Lógica de Visibilidad (Ocultar/Mostrar en Boleta y Promedio) ---
  const toggleVisibility = (grade: string, subject: string) => {
      const newData = { ...data };
      const gradeStruct = newData.gradesStructure.find(g => g.grade === grade);
      
      if (gradeStruct) {
          const hiddenList = gradeStruct.hiddenSubjects || [];
          if (hiddenList.includes(subject)) {
              // Hacer visible (remover de la lista de ocultos)
              gradeStruct.hiddenSubjects = hiddenList.filter(s => s !== subject);
          } else {
              // Ocultar (agregar a la lista)
              gradeStruct.hiddenSubjects = [...hiddenList, subject];
          }
          onUpdateData(newData);
      }
  };

  // --- Lógica de Renombrado Asignaturas ---
  const startEditing = (grade: string, subject: string) => {
    setEditingGrade(grade);
    setEditingSubjectOldName(subject);
    setNewSubjectName(subject);
    // Cancelar otros modos
    setAddingToGrade(null);
    setNewAddName('');
    setEditingTechOldName(null);
    setAddingTech(false);
    setMessage(null);
  };

  const cancelEditing = () => {
    setEditingGrade(null);
    setEditingSubjectOldName(null);
    setNewSubjectName('');
  };

  const handleSaveSubject = () => {
    if (!editingGrade || !editingSubjectOldName || !newSubjectName.trim()) return;
    
    if (newSubjectName.trim() === editingSubjectOldName) {
        cancelEditing();
        return;
    }

    const newData = { ...data };

    // 1. Actualizar la estructura general (Lista de materias)
    const gradeStruct = newData.gradesStructure.find(g => g.grade === editingGrade);
    if (gradeStruct) {
        // Verificar duplicados
        if (gradeStruct.subjects.includes(newSubjectName) && newSubjectName !== editingSubjectOldName) {
            alert('Ya existe una materia con ese nombre en este grado.');
            return;
        }
        gradeStruct.subjects = gradeStruct.subjects.map(s => s === editingSubjectOldName ? newSubjectName : s);
        
        // Actualizar lista de ocultos si la materia estaba oculta
        if (gradeStruct.hiddenSubjects && gradeStruct.hiddenSubjects.includes(editingSubjectOldName)) {
            gradeStruct.hiddenSubjects = gradeStruct.hiddenSubjects.map(s => s === editingSubjectOldName ? newSubjectName : s);
        }
    }

    // 2. Migrar calificaciones de los alumnos
    let studentsUpdated = 0;
    newData.studentsData = newData.studentsData.map(student => {
        if (student.grade === editingGrade) {
            const newGrades = { ...student.grades };
            // Si el alumno tiene calificaciones en la materia vieja
            if (newGrades[editingSubjectOldName]) {
                // Asignar al nuevo nombre
                newGrades[newSubjectName] = newGrades[editingSubjectOldName];
                // Borrar el viejo nombre
                delete newGrades[editingSubjectOldName];
                studentsUpdated++;
            }
            return { ...student, grades: newGrades };
        }
        return student;
    });

    // 3. Actualizar asignaciones de profesores
    let teachersUpdated = 0;
    newData.users = newData.users.map(user => {
        if ((user.role === 'teacher' || user.role === 'administrative') && user.assignments) {
            let hasChanges = false;
            const newAssignments = user.assignments.map(assign => {
                if (assign.grade === editingGrade && assign.subject === editingSubjectOldName) {
                    hasChanges = true;
                    return { ...assign, subject: newSubjectName };
                }
                return assign;
            });
            
            if (hasChanges) {
                teachersUpdated++;
                return { ...user, assignments: newAssignments };
            }
        }
        return user;
    });

    // Guardar cambios
    onUpdateData(newData);
    setMessage({ 
        type: 'success', 
        text: `Materia actualizada. Se migraron datos de ${studentsUpdated} alumnos y ${teachersUpdated} asignaciones de personal.` 
    });
    
    // Si se renombró "Tecnología", mostrar advertencia
    if (editingSubjectOldName === 'Tecnología' && newSubjectName !== 'Tecnología') {
        setTimeout(() => {
             alert('Advertencia: Has renombrado "Tecnología". La funcionalidad de talleres específicos (Cocina, Electrónica, etc.) depende del nombre "Tecnología". Al cambiarlo, esta materia se comportará como una asignatura académica normal.');
        }, 500);
    }

    cancelEditing();
  };

  // --- Lógica de Agregar Nueva Materia ---
  const startAdding = (grade: string) => {
      setAddingToGrade(grade);
      setNewAddName('');
      // Cancelar otros modos
      cancelEditing();
      setEditingTechOldName(null);
      setAddingTech(false);
      setMessage(null);
  };

  const cancelAdding = () => {
      setAddingToGrade(null);
      setNewAddName('');
  };

  const handleAddSubject = () => {
      if (!addingToGrade || !newAddName.trim()) return;

      const newData = { ...data };
      const gradeStruct = newData.gradesStructure.find(g => g.grade === addingToGrade);

      if (!gradeStruct) return;

      // Validar duplicados
      if (gradeStruct.subjects.includes(newAddName.trim())) {
          alert('Esta asignatura ya existe en este grado.');
          return;
      }

      // 1. Agregar a la estructura del grado
      gradeStruct.subjects.push(newAddName.trim());

      // 2. Inicializar objeto de calificaciones en todos los alumnos de ese grado
      const emptyScores: GradeScores = {
        inter_1: '', trim_1: '',
        inter_2: '', trim_2: '',
        inter_3: '', trim_3: '',
      };

      let studentsUpdated = 0;
      newData.studentsData = newData.studentsData.map(student => {
          if (student.grade === addingToGrade) {
              // Crear una copia de grades y agregar la nueva materia vacía
              const updatedGrades = { ...student.grades, [newAddName.trim()]: { ...emptyScores } };
              studentsUpdated++;
              return { ...student, grades: updatedGrades };
          }
          return student;
      });

      onUpdateData(newData);
      setMessage({
          type: 'success',
          text: `Asignatura "${newAddName}" agregada exitosamente. Se actualizó el perfil de ${studentsUpdated} alumnos.`
      });

      cancelAdding();
  };

  // --- LÓGICA DE TECNOLOGÍAS ---

  const startEditingTech = (techName: string) => {
      setEditingTechOldName(techName);
      setNewTechName(techName);
      // Cancelar otros modos
      cancelEditing();
      setAddingToGrade(null);
      setAddingTech(false);
      setMessage(null);
  }

  const handleSaveTech = () => {
      if (!editingTechOldName || !newTechName.trim()) return;
      
      if (newTechName.trim() === editingTechOldName) {
          setEditingTechOldName(null);
          return;
      }

      const newData = { ...data };

      // 1. Validar duplicados
      if (newData.technologies.includes(newTechName.trim())) {
          alert('Ya existe un taller con este nombre.');
          return;
      }

      // 2. Actualizar la lista global
      newData.technologies = newData.technologies.map(t => t === editingTechOldName ? newTechName.trim() : t);

      // 3. Actualizar Alumnos
      let studentsUpdated = 0;
      newData.studentsData = newData.studentsData.map(s => {
          if (s.technology === editingTechOldName) {
              studentsUpdated++;
              return { ...s, technology: newTechName.trim() };
          }
          return s;
      });

      // 4. Actualizar Profesores (asignaciones)
      let teachersUpdated = 0;
      newData.users = newData.users.map(u => {
          if (u.assignments) {
              let hasChanges = false;
              const newAssignments = u.assignments.map(a => {
                  if (a.technology === editingTechOldName) {
                      hasChanges = true;
                      return { ...a, technology: newTechName.trim() };
                  }
                  return a;
              });
              if (hasChanges) {
                  teachersUpdated++;
                  return { ...u, assignments: newAssignments };
              }
          }
          return u;
      });

      onUpdateData(newData);
      setMessage({
          type: 'success',
          text: `Taller renombrado a "${newTechName}". Se actualizaron ${studentsUpdated} alumnos y ${teachersUpdated} docentes.`
      });
      setEditingTechOldName(null);
  }

  const handleAddTech = () => {
      if (!newAddTechName.trim()) return;
      const newData = { ...data };
      
      if (newData.technologies.includes(newAddTechName.trim())) {
          alert('Ya existe un taller con este nombre.');
          return;
      }

      newData.technologies.push(newAddTechName.trim());
      
      onUpdateData(newData);
      setMessage({
          type: 'success',
          text: `Taller "${newAddTechName}" agregado correctamente.`
      });
      setAddingTech(false);
      setNewAddTechName('');
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-slate-800">Gestión de Asignaturas y Talleres</h2>
        <p className="text-slate-500">Edita los nombres de las materias y los talleres tecnológicos. Los cambios se aplican globalmente.</p>
      </div>

      {message && (
          <div className={`p-4 rounded-xl flex items-center space-x-2 animate-fade-in ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
              <CheckCircle2 size={20} />
              <span>{message.text}</span>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* --- COLUMNA DE ASIGNATURAS (3/4) --- */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.gradesStructure.map(gradeInfo => (
                <div key={gradeInfo.grade} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
                    <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
                        <h3 className="font-bold text-lg text-slate-700">{gradeInfo.grade} Grado</h3>
                        <Library size={18} className="text-slate-400" />
                    </div>
                    <div className="p-4 flex-1 overflow-y-auto custom-scrollbar min-h-[300px]">
                        <ul className="space-y-2">
                            {gradeInfo.subjects.map(subject => {
                                const isEditing = editingGrade === gradeInfo.grade && editingSubjectOldName === subject;
                                const isHidden = gradeInfo.hiddenSubjects?.includes(subject);
                                
                                return (
                                    <li key={subject} className={`flex items-center justify-between p-2 rounded-lg group transition-colors ${isHidden ? 'bg-slate-100' : 'hover:bg-slate-50'}`}>
                                        {isEditing ? (
                                            <div className="flex items-center gap-2 w-full animate-fade-in">
                                                <input 
                                                    type="text" 
                                                    value={newSubjectName}
                                                    onChange={(e) => setNewSubjectName(e.target.value)}
                                                    className="flex-1 px-2 py-1 border border-blue-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                                                    autoFocus
                                                />
                                                <button onClick={handleSaveSubject} className="p-1.5 bg-green-100 text-green-600 rounded hover:bg-green-200">
                                                    <Save size={16} />
                                                </button>
                                                <button onClick={cancelEditing} className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200">
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <span className={`text-sm font-medium flex-1 ${isHidden ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                                    {subject}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => toggleVisibility(gradeInfo.grade, subject)}
                                                        className={`p-1.5 rounded transition-colors ${isHidden ? 'text-slate-400 hover:text-slate-600' : 'text-green-500 hover:text-green-700 bg-green-50'}`}
                                                        title={isHidden ? "Materia oculta en boletas y promedio" : "Materia visible"}
                                                    >
                                                        {isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                                                    </button>
                                                    <button 
                                                        onClick={() => startEditing(gradeInfo.grade, subject)}
                                                        className="p-1.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                                                        title="Renombrar asignatura"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                    
                    {/* Footer Agregar Asignatura */}
                    <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                        {addingToGrade === gradeInfo.grade ? (
                            <div className="flex flex-col gap-2 animate-fade-in">
                                <input 
                                    type="text" 
                                    value={newAddName}
                                    onChange={(e) => setNewAddName(e.target.value)}
                                    placeholder="Nombre nueva materia..."
                                    className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <button 
                                        onClick={handleAddSubject}
                                        className="flex-1 py-1.5 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700"
                                    >
                                        Guardar
                                    </button>
                                    <button 
                                        onClick={cancelAdding}
                                        className="px-3 py-1.5 bg-white border border-slate-300 text-slate-600 rounded text-xs font-bold hover:bg-slate-50"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button 
                                onClick={() => startAdding(gradeInfo.grade)}
                                className="w-full py-2 border-2 border-dashed border-slate-300 text-slate-500 rounded-lg text-sm font-bold hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus size={16} /> Agregar Asignatura
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>

        {/* --- COLUMNA DE TECNOLOGÍAS (1/4) --- */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
             <div className="bg-blue-50 p-4 border-b border-blue-100 flex items-center justify-between">
                <h3 className="font-bold text-lg text-blue-800">Talleres</h3>
                <Cpu size={18} className="text-blue-500" />
            </div>
            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar min-h-[300px]">
                <ul className="space-y-2">
                    {data.technologies.map(tech => {
                        const isEditing = editingTechOldName === tech;
                        return (
                            <li key={tech} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors group">
                                {isEditing ? (
                                    <div className="flex items-center gap-2 w-full animate-fade-in">
                                        <input 
                                            type="text" 
                                            value={newTechName}
                                            onChange={(e) => setNewTechName(e.target.value)}
                                            className="flex-1 px-2 py-1 border border-blue-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                                            autoFocus
                                        />
                                        <button onClick={handleSaveTech} className="p-1.5 bg-green-100 text-green-600 rounded hover:bg-green-200">
                                            <Save size={14} />
                                        </button>
                                        <button onClick={() => setEditingTechOldName(null)} className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200">
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <span className="text-sm font-medium text-slate-700 flex-1">{tech}</span>
                                        <button 
                                            onClick={() => startEditingTech(tech)}
                                            className="p-1.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                                            title="Renombrar taller"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                    </>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </div>
            {/* Footer Agregar Tech */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                {addingTech ? (
                    <div className="flex flex-col gap-2 animate-fade-in">
                        <input 
                            type="text" 
                            value={newAddTechName}
                            onChange={(e) => setNewAddTechName(e.target.value)}
                            placeholder="Nombre del taller..."
                            className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <button 
                                onClick={handleAddTech}
                                className="flex-1 py-1.5 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700"
                            >
                                Guardar
                            </button>
                            <button 
                                onClick={() => { setAddingTech(false); setNewAddTechName(''); }}
                                className="px-3 py-1.5 bg-white border border-slate-300 text-slate-600 rounded text-xs font-bold hover:bg-slate-50"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                ) : (
                    <button 
                        onClick={() => setAddingTech(true)}
                        className="w-full py-2 border-2 border-dashed border-slate-300 text-slate-500 rounded-lg text-sm font-bold hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={16} /> Nuevo Taller
                    </button>
                )}
            </div>
        </div>

      </div>
      
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="text-blue-600 flex-shrink-0" size={20} />
          <div className="text-sm text-blue-800">
              <p className="font-bold mb-1">Notas:</p>
              <ul className="list-disc list-inside space-y-1">
                  <li>Usa el botón de <strong>Ojo</strong> para ocultar asignaturas en las boletas. Las materias ocultas <strong>no se promedian</strong>.</li>
                  <li>Al renombrar una asignatura o taller, el sistema migrará automáticamente las calificaciones y asignaciones.</li>
              </ul>
          </div>
      </div>
    </div>
  );
};

export default SubjectsConfigView;
