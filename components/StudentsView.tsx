




import React, { useState, useRef, useMemo } from 'react';
import { ArrowLeft, Search, Filter, Plus, X, Users, Cpu, Upload, Download, Settings2, FileSpreadsheet, Check, Pencil, AlertCircle, CheckSquare, Square, UserMinus, RotateCcw, Archive } from 'lucide-react';
import { SchoolData, Student } from '../types';
import { generateEmptyGrades } from '../utils';
import * as XLSX from 'xlsx';

interface StudentsViewProps {
  grade: string;
  group: string;
  data: SchoolData;
  onBack: () => void;
  onChangeContext: (grade: string, group: string) => void;
  onUpdateData: (newData: SchoolData) => void;
}

const StudentsView: React.FC<StudentsViewProps> = ({ grade, group, data, onBack, onChangeContext, onUpdateData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewStatus, setViewStatus] = useState<'active' | 'dropped'>('active');
  
  // --- ADD STUDENT STATE ---
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentTech, setNewStudentTech] = useState('');

  // --- DROP STUDENT STATE ---
  const [studentToDrop, setStudentToDrop] = useState<Student | null>(null);
  const [dropReason, setDropReason] = useState('');
  const [dropDate, setDropDate] = useState(new Date().toISOString().split('T')[0]);

  // --- EDIT STUDENT STATE ---
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editName, setEditName] = useState('');
  const [editTech, setEditTech] = useState('');
  const [editGrade, setEditGrade] = useState('');
  const [editGroup, setEditGroup] = useState('');

  // --- IMPORT PREVIEW STATE ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [fullImportData, setFullImportData] = useState<any[][]>([]);
  const [selectedHeaderIndex, setSelectedHeaderIndex] = useState<number>(-1); // -1 means not selected
  const [previewFileName, setPreviewFileName] = useState('');
  const [selectedRowIndices, setSelectedRowIndices] = useState<Set<number>>(new Set());
  const [columnMapping, setColumnMapping] = useState<{name: number, tech: number}>({ name: -1, tech: -1 });
  
  const studentsInGroup = data.studentsData.filter(student => student.grade === grade && student.group === group);
  
  // Helper for dropdowns
  const allGrades = data.gradesStructure.map(g => g.grade);
  const availableGroups = data.gradesStructure.find(g => g.grade === grade)?.groups || [];

  // Determine Tech Block
  const techBlock = (group === 'A' || group === 'C') ? 'Bloque 1 (A + C)' : (group === 'B' || group === 'D') ? 'Bloque 2 (B + D)' : 'General';
  const blockColor = (group === 'A' || group === 'C') ? 'text-blue-600 bg-blue-50' : 'text-purple-600 bg-purple-50';

  const filteredStudents = studentsInGroup.filter(student => {
    // Basic search filter
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          student.id.toString().includes(searchTerm);
    
    // Status filter
    if (viewStatus === 'active') {
        return matchesSearch && (student.status === 'active' || !student.status); // Default to active if undefined
    } else {
        return matchesSearch && student.status === 'dropped';
    }
  }).sort((a, b) => a.name.localeCompare(b.name));

  // --- ADD HANDLERS ---
  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    // Generate safe ID even if list is empty
    const maxId = data.studentsData.length > 0 ? Math.max(...data.studentsData.map(s => s.id)) : 0;
    const newId = maxId + 1;
    
    const newStudent: Student = {
      id: newId,
      name: newStudentName.toUpperCase(),
      grade: grade,
      group: group,
      technology: newStudentTech,
      status: 'active',
      grades: generateEmptyGrades(grade)
    };

    const updatedStudentsList = [...data.studentsData, newStudent].sort((a, b) => a.name.localeCompare(b.name));

    onUpdateData({
      ...data,
      studentsData: updatedStudentsList,
      studentsCount: data.studentsCount + 1
    });
    setShowAddModal(false);
    setNewStudentName('');
    setNewStudentTech('');
  };

  // --- EDIT HANDLERS ---
  const handleEditClick = (student: Student) => {
      setEditingStudent(student);
      setEditName(student.name);
      setEditTech(student.technology || '');
      setEditGrade(student.grade);
      setEditGroup(student.group);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingStudent || !editName.trim()) return;

      const updatedStudents = data.studentsData.map(s => {
          if (s.id === editingStudent.id) {
              return {
                  ...s,
                  name: editName.toUpperCase(),
                  grade: editGrade,
                  group: editGroup,
                  technology: editTech
              };
          }
          return s;
      }).sort((a, b) => a.name.localeCompare(b.name));

      onUpdateData({
          ...data,
          studentsData: updatedStudents
      });
      setEditingStudent(null);
  };

  // --- DROP HANDLERS ---
  const handleDropClick = (student: Student) => {
      setStudentToDrop(student);
      setDropReason('');
      setDropDate(new Date().toISOString().split('T')[0]);
  }

  const confirmDropStudent = () => {
      if (!studentToDrop || !dropReason) return;

      const updatedStudents = data.studentsData.map(s => {
          if (s.id === studentToDrop.id) {
              return {
                  ...s,
                  status: 'dropped' as const,
                  dropoutReason: dropReason,
                  dropoutDate: dropDate
              };
          }
          return s;
      });

      onUpdateData({ ...data, studentsData: updatedStudents });
      setStudentToDrop(null);
  };

  const reactivateStudent = (student: Student) => {
      if (!confirm(`¿Estás seguro de reactivar al alumno ${student.name}? Volverá a aparecer en las listas y cuadros.`)) return;
      const updatedStudents = data.studentsData.map(s => {
          if (s.id === student.id) {
              return {
                  ...s,
                  status: 'active' as const,
                  dropoutReason: undefined,
                  dropoutDate: undefined
              };
          }
          return s;
      });
      onUpdateData({ ...data, studentsData: updatedStudents });
  }

  // --- IMPORT HANDLERS ---
  const handleFileScanComplete = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setPreviewFileName(file.name);

      try {
          const dataBuffer = await file.arrayBuffer();
          const workbook = XLSX.read(dataBuffer);
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
          
          if (jsonData.length === 0) { alert("Archivo vacío"); return; }
          
          setFullImportData(jsonData); 
          setShowPreview(true);
          setSelectedHeaderIndex(-1); 
          setSelectedRowIndices(new Set());
          setColumnMapping({ name: -1, tech: -1 });

      } catch (err) {
          alert("Error leyendo archivo");
          console.error(err);
      }
       if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleHeaderSelect = (rowIndex: number) => {
      setSelectedHeaderIndex(rowIndex);
      
      const headers = fullImportData[rowIndex];
      
      // Auto-detect columns
      let colNameIdx = -1;
      let colTechIdx = -1;

      headers.forEach((cell, idx) => {
          if (!cell) return;
          const val = String(cell).toLowerCase().trim();
          if (val.includes('nombre') || val.includes('alumno') || val === 'name') colNameIdx = idx;
          if (val.includes('tecnologia') || val.includes('taller') || val === 'tech') colTechIdx = idx;
      });

      // Fallback: If no name column found, try the first non-empty column? 
      // Better: Don't guess too aggressively, let user verify.
      
      setColumnMapping({ name: colNameIdx, tech: colTechIdx });

      // Auto-select rows below header that have data in the Name column
      const newSelectedIndices = new Set<number>();
      
      // If we found a name column, use it to validate rows. If not, use first column.
      const validationCol = colNameIdx !== -1 ? colNameIdx : 0;

      for (let i = rowIndex + 1; i < fullImportData.length; i++) {
          const row = fullImportData[i];
          // Check if row has data in the validation column
          if (row[validationCol] && String(row[validationCol]).trim().length > 1) {
              newSelectedIndices.add(i);
          }
      }
      setSelectedRowIndices(newSelectedIndices);
  };

  const toggleRowSelection = (rowIndex: number) => {
      const newSet = new Set(selectedRowIndices);
      if (newSet.has(rowIndex)) {
          newSet.delete(rowIndex);
      } else {
          newSet.add(rowIndex);
      }
      setSelectedRowIndices(newSet);
  };

  const executeImport = () => {
      if (selectedHeaderIndex === -1) {
          alert("Por favor selecciona la fila de encabezados primero.");
          return;
      }
      if (selectedRowIndices.size === 0) {
          alert("No hay alumnos seleccionados para importar.");
          return;
      }

      // Determine mapping to use
      let nameIdx = columnMapping.name;
      let techIdx = columnMapping.tech;

      // If detection failed, default to 0 for name if possible, or warn
      if (nameIdx === -1) {
           if (!confirm("No se detectó automáticamente la columna 'Nombre'. Se usará la primera columna como nombre. ¿Continuar?")) {
               return;
           }
           nameIdx = 0;
      }

      let addedCount = 0;
      let maxId = data.studentsData.length > 0 ? Math.max(...data.studentsData.map(s => s.id)) : 0;
      const newStudents: Student[] = [];

      // Iterate through checked rows
      Array.from(selectedRowIndices).sort((a: number, b: number) => a - b).forEach(rowIndex => {
          const row = fullImportData[rowIndex];
          const rawName = row[nameIdx];
          
          if (rawName && typeof rawName === 'string') {
              const rawTech = techIdx > -1 ? row[techIdx] : '';
              // Validate tech against known list
              const cleanTech = data.technologies.includes(rawTech) ? rawTech : '';

              maxId++;
              newStudents.push({
                  id: maxId,
                  name: String(rawName).toUpperCase().trim(),
                  grade: grade,
                  group: group,
                  technology: cleanTech,
                  status: 'active',
                  grades: generateEmptyGrades(grade)
              });
              addedCount++;
          }
      });

      if (addedCount > 0) {
          const updatedList = [...data.studentsData, ...newStudents].sort((a, b) => a.name.localeCompare(b.name));
          onUpdateData({
              ...data,
              studentsData: updatedList,
              studentsCount: data.studentsCount + addedCount
          });
          alert(`Importación exitosa: ${addedCount} alumnos agregados.`);
          setShowPreview(false);
          setFullImportData([]);
          setSelectedRowIndices(new Set());
      } else {
          alert("No se pudieron procesar los datos seleccionados.");
      }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onBack} 
            className="p-2 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          
          {/* Navigation Dropdowns */}
          <div className="flex items-center gap-2">
             <div className="flex flex-col">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Grado</label>
                 <select 
                    value={grade} 
                    onChange={(e) => onChangeContext(e.target.value, 'A')} 
                    className="font-bold text-xl bg-transparent text-slate-800 border-none outline-none cursor-pointer hover:text-blue-600 focus:ring-0 p-0"
                 >
                    {allGrades.map(g => <option key={g} value={g}>{g}</option>)}
                 </select>
             </div>
             <span className="text-slate-300 text-2xl font-light">/</span>
             <div className="flex flex-col">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Grupo</label>
                 <select 
                    value={group} 
                    onChange={(e) => onChangeContext(grade, e.target.value)}
                    className="font-bold text-xl bg-transparent text-slate-800 border-none outline-none cursor-pointer hover:text-blue-600 focus:ring-0 p-0"
                 >
                    {availableGroups.map(g => <option key={g} value={g}>{g}</option>)}
                 </select>
             </div>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap items-center">
          <div className="relative flex-grow md:flex-grow-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar alumno..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 w-full md:w-48 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
            />
          </div>
          
          <input 
             type="file" 
             ref={fileInputRef} 
             onChange={handleFileScanComplete} 
             hidden 
             accept=".xlsx, .xls"
          />
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-sm transition-colors"
            title="Importar lista desde Excel"
          >
            <Upload size={20} />
            <span className="hidden sm:inline">Importar Excel</span>
          </button>

          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-sm transition-colors"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Agregar</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200">
          <button 
            onClick={() => setViewStatus('active')}
            className={`pb-2 px-4 font-bold text-sm transition-colors border-b-2 ${viewStatus === 'active' ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
          >
              <div className="flex items-center gap-2">
                  <Users size={16}/> Alumnos Activos
              </div>
          </button>
          <button 
            onClick={() => setViewStatus('dropped')}
            className={`pb-2 px-4 font-bold text-sm transition-colors border-b-2 ${viewStatus === 'dropped' ? 'text-red-600 border-red-600' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
          >
              <div className="flex items-center gap-2">
                  <Archive size={16}/> Bajas
              </div>
          </button>
      </div>

      {/* Student List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                    {viewStatus === 'active' ? <Users size={20} className="text-slate-400"/> : <Archive size={20} className="text-red-400"/>}
                    {viewStatus === 'active' ? `Lista del Grupo ${grade} "${group}"` : `Alumnos dados de baja en ${grade} "${group}"`}
                </h3>
                {viewStatus === 'active' && (
                    <span className={`px-2 py-0.5 rounded text-xs font-bold border ${blockColor.replace('text', 'border').replace('bg', 'border-opacity-20')} ${blockColor}`}>
                    Tecnología: {techBlock}
                    </span>
                )}
            </div>
            <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-500">
              {filteredStudents.length} alumnos
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-white">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-24">ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre Completo</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tecnología</th>
                  {viewStatus === 'active' ? (
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estatus</th>
                  ) : (
                      <>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Motivo Baja</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha Baja</th>
                      </>
                  )}
                  <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {filteredStudents.length > 0 ? filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-blue-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">#{student.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800 uppercase">{student.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        {student.technology ? (
                            <span className="flex items-center gap-1.5 text-sm text-slate-700">
                                <Cpu size={14} className="text-blue-500" />
                                {student.technology}
                            </span>
                        ) : (
                            <span className="text-xs text-slate-400 italic">Sin asignar</span>
                        )}
                    </td>
                    
                    {viewStatus === 'active' ? (
                         <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-semibold leading-5 text-green-800 bg-green-100 rounded-full">
                                Activo
                            </span>
                         </td>
                    ) : (
                        <>
                            <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600">{student.dropoutReason || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600">{student.dropoutDate ? new Date(student.dropoutDate).toLocaleDateString() : '-'}</td>
                        </>
                    )}

                    <td className="px-6 py-4 whitespace-nowrap text-right">
                       {viewStatus === 'active' ? (
                           <div className="flex gap-2 justify-end">
                                <button 
                                    onClick={() => handleEditClick(student)}
                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                    title="Editar / Reubicar"
                                >
                                    <Pencil size={16} />
                                </button>
                                <button 
                                    onClick={() => handleDropClick(student)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                    title="Dar de Baja"
                                >
                                    <UserMinus size={16} />
                                </button>
                           </div>
                       ) : (
                           <button 
                                onClick={() => reactivateStudent(student)}
                                className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                                title="Reactivar Alumno"
                           >
                               <RotateCcw size={16} />
                           </button>
                       )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={viewStatus === 'active' ? 5 : 6} className="px-6 py-12 text-center text-slate-400 text-sm">
                      {viewStatus === 'active' ? (
                          <>
                             No hay alumnos activos registrados en el grupo {group}.
                             <br/>
                             <span className="text-xs">Usa el botón "Importar" o "Agregar" para comenzar.</span>
                          </>
                      ) : (
                          <>No hay alumnos dados de baja en este grupo.</>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
      </div>

      {/* --- ADD STUDENT MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Registrar Nuevo Alumno</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddStudent} className="p-6 space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs text-blue-800 mb-4">
                  Registrando en <strong>{grade} "{group}"</strong>.
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                <input 
                  type="text" required value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej. Hernández López María"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tecnología</label>
                <select 
                  value={newStudentTech} onChange={(e) => setNewStudentTech(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                    <option value="">-- Seleccionar Tecnología --</option>
                    {data.technologies.map(tech => <option key={tech} value={tech}>{tech}</option>)}
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DROP STUDENT MODAL --- */}
      {studentToDrop && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-red-50">
                    <h3 className="text-lg font-bold text-red-800 flex items-center gap-2"><UserMinus size={20}/> Baja de Alumno</h3>
                    <button onClick={() => setStudentToDrop(null)} className="text-red-400 hover:text-red-600">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="text-sm text-slate-600 mb-2">
                        Se dará de baja a: <strong className="uppercase">{studentToDrop.name}</strong>
                        <p className="text-xs mt-1 text-slate-500">Este alumno dejará de aparecer en listas de asistencia y cuadros de evaluación, y se moverá a la pestaña de "Bajas".</p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Motivo de la Baja</label>
                        <textarea 
                            value={dropReason}
                            onChange={(e) => setDropReason(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                            placeholder="Ej. Cambio de domicilio, Traslado a otra escuela..."
                            rows={3}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Fecha Oficial de Baja</label>
                        <input 
                            type="date"
                            value={dropDate}
                            onChange={(e) => setDropDate(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={() => setStudentToDrop(null)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium">Cancelar</button>
                        <button 
                            onClick={confirmDropStudent} 
                            disabled={!dropReason}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Confirmar Baja
                        </button>
                    </div>
                </div>
            </div>
          </div>
      )}

      {/* --- EDIT STUDENT MODAL --- */}
      {editingStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800">Editar / Reubicar Alumno</h3>
                    <button onClick={() => setEditingStudent(null)} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 text-xs text-amber-800 mb-2 flex items-start gap-2">
                        <AlertCircle size={16} className="flex-shrink-0 mt-0.5"/>
                        <span>Puedes corregir los datos o cambiar el Grado/Grupo para mover al alumno a otra lista.</span>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                        <input 
                            type="text" required value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Grado</label>
                            <select 
                                value={editGrade} onChange={(e) => setEditGrade(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-xl bg-white"
                            >
                                {allGrades.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Grupo</label>
                            <select 
                                value={editGroup} onChange={(e) => setEditGroup(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-xl bg-white"
                            >
                                {['A','B','C','D'].map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tecnología</label>
                        <select 
                            value={editTech} onChange={(e) => setEditTech(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="">-- Seleccionar Tecnología --</option>
                            {data.technologies.map(tech => <option key={tech} value={tech}>{tech}</option>)}
                        </select>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={() => setEditingStudent(null)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium">Cancelar</button>
                        <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium">Actualizar</button>
                    </div>
                </form>
            </div>
          </div>
      )}

      {/* --- IMPORT PREVIEW MODAL --- */}
      {showPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col animate-fade-in-up overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><FileSpreadsheet size={20}/> Importar Alumnos</h3>
                        <p className="text-xs text-slate-500 font-mono mt-1">{previewFileName}</p>
                    </div>
                    <button onClick={() => setShowPreview(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                </div>
                
                <div className="p-4 bg-blue-50 border-b border-blue-100 text-sm text-blue-800 space-y-2">
                    <div className="flex items-start gap-2">
                        <AlertCircle size={18} className="flex-shrink-0 mt-0.5"/>
                        <p>1. Haz clic en la <strong>FILA</strong> que contiene los títulos (ej. "Nombre del Alumno").</p>
                    </div>
                    <div className="flex items-start gap-2">
                        <CheckSquare size={18} className="flex-shrink-0 mt-0.5"/>
                        <p>2. Verifica las casillas de los alumnos que deseas importar. Las filas vacías se ignoran automáticamente.</p>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-4 bg-slate-100">
                    <div className="bg-white border border-slate-300 shadow-sm rounded-lg overflow-hidden inline-block min-w-full">
                        <table className="border-collapse text-xs w-full">
                            <tbody>
                                {fullImportData.map((row, rIdx) => {
                                    const isHeader = rIdx === selectedHeaderIndex;
                                    const isSelected = selectedRowIndices.has(rIdx);
                                    const isDisabled = selectedHeaderIndex !== -1 && rIdx < selectedHeaderIndex;
                                    
                                    return (
                                        <tr 
                                            key={rIdx} 
                                            className={`
                                                transition-colors border-b border-slate-200
                                                ${isHeader ? 'bg-blue-600 text-white font-bold' : ''}
                                                ${isDisabled ? 'bg-slate-100 opacity-50 text-slate-400 cursor-not-allowed' : 'hover:bg-slate-50 cursor-pointer'}
                                                ${isSelected ? 'bg-green-50' : ''}
                                            `}
                                            onClick={() => {
                                                if (selectedHeaderIndex === -1) {
                                                    handleHeaderSelect(rIdx);
                                                } else if (!isDisabled && !isHeader) {
                                                    toggleRowSelection(rIdx);
                                                }
                                            }}
                                        >
                                            {/* CHECKBOX / ROW NUMBER */}
                                            <td className="p-2 border-r border-slate-200 w-12 text-center bg-slate-50">
                                                {isHeader ? (
                                                    <span className="text-xs">ENC</span>
                                                ) : isDisabled ? (
                                                    <span className="text-[10px]">{rIdx + 1}</span>
                                                ) : (
                                                    <div className="flex justify-center">
                                                        {isSelected ? <CheckSquare size={16} className="text-green-600" /> : <Square size={16} className="text-slate-300" />}
                                                    </div>
                                                )}
                                            </td>

                                            {/* DATA CELLS */}
                                            {row.map((cell: any, cIdx: number) => {
                                                let suffix = '';
                                                if (isHeader) {
                                                    if (cIdx === columnMapping.name) suffix = ' [NOMBRE]';
                                                    if (cIdx === columnMapping.tech) suffix = ' [TECNOLOGÍA]';
                                                }

                                                return (
                                                    <td key={cIdx} className="p-2 border-r border-slate-200 max-w-[200px] truncate">
                                                        {cell}
                                                        {suffix && <span className="ml-1 bg-white/20 px-1 rounded text-[9px] font-mono">{suffix}</span>}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
                    <div className="text-xs text-slate-500 font-bold">
                        {selectedRowIndices.size} alumnos seleccionados
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => { setSelectedHeaderIndex(-1); setSelectedRowIndices(new Set()); }}
                            className="px-4 py-2 text-slate-500 hover:text-blue-600 underline text-sm"
                            disabled={selectedHeaderIndex === -1}
                        >
                            Re-seleccionar Títulos
                        </button>
                        <button onClick={() => setShowPreview(false)} className="px-6 py-2 border border-slate-300 rounded-xl text-slate-600 font-bold hover:bg-white text-sm">
                            Cancelar
                        </button>
                        <button 
                            onClick={executeImport} 
                            disabled={selectedRowIndices.size === 0}
                            className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                            <Check size={18} /> Importar {selectedRowIndices.size > 0 ? `(${selectedRowIndices.size})` : ''}
                        </button>
                    </div>
                </div>
             </div>
          </div>
      )}

    </div>
  );
};

export default StudentsView;
