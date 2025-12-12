import React, { useState, useMemo } from 'react';
import { Printer, Calendar, FileText, PenTool, Plus, ArrowLeft, ClipboardList, Eye, Save, Trash2, User, CheckSquare, Square } from 'lucide-react';
import { SchoolData, VisitLog, Minuta, Citation, User as UserType } from '../types';

// Updated Logo Placeholder and Constants
const LOGO_URL = "https://cdn1.sharemyimage.com/smi/2025/10/05/27tv.png"; 
const CCT = "09DES4027P";

interface SubdireccionViewProps {
  data: SchoolData;
  onUpdateData: (newData: SchoolData) => void;
  currentUser: UserType;
  currentCycle: string;
}

type SubTab = 'citatorios' | 'bitacora' | 'minuta';
type Mode = 'list' | 'create';
type BitacoraType = 'inasistencia' | 'conducta' | 'accidente';

const SubdireccionView: React.FC<SubdireccionViewProps> = ({ data, onUpdateData, currentUser, currentCycle }) => {
  const [activeTab, setActiveTab] = useState<SubTab>('citatorios');
  
  // Global Config for Subdireccion Formats
  const [schoolCycle, setSchoolCycle] = useState(currentCycle);

  // Admins, Subdirector, and Secretaria can edit.
  const canEdit = ['admin', 'subdirector', 'secretaria', 'subdirector_gestion'].includes(currentUser.role);

  // Use the name directly from Config (Editable Text)
  const subGestionName = data.subdirectorGestion || 'NOMBRE SUB. GESTIÓN';

  const getOfficialRoleName = (role: string) => {
      switch (role) {
          case 'admin': return 'DIRECTOR';
          case 'subdirector': return 'SUBDIRECTOR DE GESTIÓN';
          case 'subdirector_gestion': return 'SUBDIRECTOR DE GESTIÓN'; 
          case 'subdirector_academico': return 'SUBDIRECTOR ACADÉMICO'; 
          case 'secretaria': return 'SECRETARIA';
          case 'teacher': return 'DOCENTE';
          case 'administrative': return 'ADMINISTRATIVO';
          case 'prefecto': return 'PREFECTO';
          case 'trabajador_social': return 'TRABAJADOR SOCIAL';
          default: return 'PERSONAL ESCOLAR';
      }
  };

  const handlePrint = () => window.print();

  // --- CITATORIOS LOGIC ---
  const [citationMode, setCitationMode] = useState<Mode>('list');
  const [newCitation, setNewCitation] = useState<Partial<Citation>>({ date: new Date().toISOString().split('T')[0] });
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);

  const handleSaveCitation = () => {
      if (!newCitation.studentName || !newCitation.date || !newCitation.reason) return;
      
      const citation: Citation = {
          id: Date.now().toString(),
          studentName: newCitation.studentName,
          group: newCitation.group || '',
          date: newCitation.date,
          time: newCitation.time || '00:00',
          reason: newCitation.reason,
          createdAt: new Date().toISOString(),
          teacherId: currentUser.id,
          teacherName: currentUser.name
      };

      onUpdateData({ ...data, citations: [...data.citations, citation] });
      setCitationMode('list');
      setNewCitation({ date: new Date().toISOString().split('T')[0] });
  };

  const handleDeleteCitation = (id: string) => {
      if (!canEdit && currentUser.role !== 'teacher') return;
      if (confirm('¿Eliminar citatorio?')) {
          onUpdateData({ ...data, citations: data.citations.filter(c => c.id !== id) });
      }
  };

  // --- BITACORA LOGIC ---
  const [bitacoraMode, setBitacoraMode] = useState<Mode>('list');
  const [bitacoraType, setBitacoraType] = useState<BitacoraType>('inasistencia'); // Default
  const [newLog, setNewLog] = useState<Partial<VisitLog>>({ 
      date: new Date().toISOString().split('T')[0],
      startTime: new Date().toLocaleTimeString('es-MX', {hour: '2-digit', minute:'2-digit'}),
      logType: 'inasistencia'
  });
  const [selectedLog, setSelectedLog] = useState<VisitLog | null>(null);

  const handleSaveLog = () => {
      if (!newLog.studentName) return;
      
      const log: VisitLog = {
          id: Date.now().toString(),
          logType: bitacoraType, // Use current selected type
          studentName: newLog.studentName,
          grade: newLog.grade || '',
          group: newLog.group || '',
          parentName: newLog.parentName || '',
          date: newLog.date || '',
          startTime: newLog.startTime || '',
          endTime: newLog.endTime || '',
          location: newLog.location || '',
          whoReported: newLog.whoReported || currentUser.name,
          involvedStudents: newLog.involvedStudents || '',
          narrative: newLog.narrative || '',
          
          informedDirector: !!newLog.informedDirector,
          informedSubdirector: !!newLog.informedSubdirector,
          informedParent: !!newLog.informedParent,
          informedUdeei: !!newLog.informedUdeei,

          teacherActions: newLog.teacherActions || '',
          formativeAction: newLog.formativeAction || '',
          generatedCitation: !!newLog.generatedCitation,
          udeeiActions: newLog.udeeiActions || '',
          technicalMeasure: newLog.technicalMeasure || '',

          pedagogicalMeasure: newLog.pedagogicalMeasure || '',
          conciliation: !!newLog.conciliation,
          canalization: !!newLog.canalization,
          canalizationInstitution: newLog.canalizationInstitution || '',
          bullyingProtocol: !!newLog.bullyingProtocol,
          bullyingProtocolReason: newLog.bullyingProtocolReason || '',
          vaSeguro: !!newLog.vaSeguro,
          vaSeguroObservation: newLog.vaSeguroObservation || '',

          agreementsParent: newLog.agreementsParent || '',
          agreementsStudent: newLog.agreementsStudent || '',
          attentionToParent: newLog.attentionToParent || '',
          
          conformityStaffId: newLog.conformityStaffId
      } as VisitLog;

      onUpdateData({ ...data, visitLogs: [...data.visitLogs, log] });
      setBitacoraMode('list');
      setNewLog({ 
          date: new Date().toISOString().split('T')[0], 
          startTime: new Date().toLocaleTimeString('es-MX', {hour: '2-digit', minute:'2-digit'}),
          logType: bitacoraType
      });
  };

  const handleDeleteLog = (id: string) => {
      if (!canEdit) return;
      if (confirm('¿Eliminar registro?')) {
          onUpdateData({ ...data, visitLogs: data.visitLogs.filter(l => l.id !== id) });
      }
  };

  return (
    <div className="flex flex-col h-full">
      <style>{`
          @media print {
            @page { size: letter portrait; margin: 10mm; }
            .no-print { display: none !important; }
            body { -webkit-print-color-adjust: exact; }
          }
      `}</style>

      {/* Header Controls (No Print) */}
      <div className="p-6 md:p-8 bg-slate-50 border-b border-slate-200 no-print space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-3xl font-bold text-slate-800">Subdirección de Gestión Escolar</h2>
                <p className="text-slate-500">Gestión de citatorios, bitácoras de atención y minutas.</p>
            </div>
            {/* TABS */}
            <div className="flex gap-2 bg-white p-1 rounded-xl border border-slate-200">
                <button onClick={() => setActiveTab('citatorios')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${activeTab === 'citatorios' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}>
                    <Calendar size={16}/> Citatorios
                </button>
                <button onClick={() => setActiveTab('bitacora')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${activeTab === 'bitacora' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}>
                    <ClipboardList size={16}/> Bitácora
                </button>
                <button onClick={() => setActiveTab('minuta')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${activeTab === 'minuta' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}>
                    <FileText size={16}/> Minutas
                </button>
            </div>
          </div>
      </div>

      <div className="flex-1 overflow-auto bg-slate-100 p-6 md:p-8 print:p-0 print:bg-white print:overflow-visible">
          
          {/* --- CITATORIOS TAB --- */}
          {activeTab === 'citatorios' && (
              <>
                {/* LISTA CITATORIOS */}
                {!selectedCitation && citationMode === 'list' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center no-print">
                            <h3 className="font-bold text-slate-700">Historial de Citatorios</h3>
                            <button onClick={() => setCitationMode('create')} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow font-bold text-sm">
                                <Plus size={18}/> Nuevo Citatorio
                            </button>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-slate-500 font-bold">
                                    <tr>
                                        <th className="p-4 text-left">Fecha</th>
                                        <th className="p-4 text-left">Alumno</th>
                                        <th className="p-4 text-left">Grupo</th>
                                        <th className="p-4 text-left">Motivo</th>
                                        <th className="p-4 text-left">Solicita</th>
                                        <th className="p-4 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {data.citations.map(cit => (
                                        <tr key={cit.id} className="hover:bg-slate-50">
                                            <td className="p-4">{new Date(cit.date).toLocaleDateString()}</td>
                                            <td className="p-4 font-bold uppercase">{cit.studentName}</td>
                                            <td className="p-4">{cit.group}</td>
                                            <td className="p-4 truncate max-w-[200px]">{cit.reason}</td>
                                            <td className="p-4 text-xs">{cit.teacherName}</td>
                                            <td className="p-4 flex justify-center gap-2">
                                                <button onClick={() => setSelectedCitation(cit)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Eye size={16}/></button>
                                                {canEdit && <button onClick={() => handleDeleteCitation(cit.id)} className="p-2 text-red-400 hover:bg-red-50 rounded"><Trash2 size={16}/></button>}
                                            </td>
                                        </tr>
                                    ))}
                                    {data.citations.length === 0 && (
                                        <tr><td colSpan={6} className="p-8 text-center text-slate-400 italic">No hay citatorios registrados.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* FORMULARIO CREAR CITATORIO */}
                {citationMode === 'create' && (
                    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-6 no-print">
                        <h3 className="font-bold text-lg text-slate-800 mb-4">Generar Nuevo Citatorio</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre del Alumno</label>
                                <input type="text" className="w-full p-2 border rounded-lg" value={newCitation.studentName || ''} onChange={e => setNewCitation({...newCitation, studentName: e.target.value})} placeholder="Nombre completo..."/>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Grupo</label>
                                    <select className="w-full p-2 border rounded-lg" value={newCitation.group || ''} onChange={e => setNewCitation({...newCitation, group: e.target.value})}>
                                        <option value="">-- Seleccionar --</option>
                                        {['1° A','1° B','1° C','1° D','2° A','2° B','2° C','2° D','3° A','3° B','3° C','3° D'].map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha Cita</label>
                                    <input type="date" className="w-full p-2 border rounded-lg" value={newCitation.date} onChange={e => setNewCitation({...newCitation, date: e.target.value})}/>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hora</label>
                                <input type="time" className="w-full p-2 border rounded-lg" value={newCitation.time} onChange={e => setNewCitation({...newCitation, time: e.target.value})}/>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Motivo</label>
                                <textarea className="w-full p-2 border rounded-lg h-24" value={newCitation.reason || ''} onChange={e => setNewCitation({...newCitation, reason: e.target.value})} placeholder="Describa el motivo..."/>
                            </div>
                            <div className="flex gap-2 pt-4">
                                <button onClick={() => setCitationMode('list')} className="flex-1 py-2 border rounded-lg font-bold text-slate-600 hover:bg-slate-50">Cancelar</button>
                                <button onClick={handleSaveCitation} className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow">Guardar Citatorio</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* VISTA PREVIA / IMPRESIÓN CITATORIO (FORMATO OFICIAL) */}
                {selectedCitation && (
                    <div className="print:w-full print:h-full">
                        {/* Toolbar */}
                        <div className="no-print mb-6 flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <button onClick={() => setSelectedCitation(null)} className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-bold"><ArrowLeft size={18}/> Volver</button>
                            <button onClick={handlePrint} className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-900 shadow"><Printer size={18}/> Imprimir</button>
                        </div>

                        {/* DOCUMENTO - FIRMA VINCULADA AL SUBDIRECTOR DE GESTIÓN */}
                        <div className="bg-white shadow-lg mx-auto max-w-[215mm] p-[20mm] print:shadow-none print:w-full print:max-w-none text-black font-serif">
                            <div className="flex justify-between items-start mb-8">
                                <img src={LOGO_URL} alt="Logo" className="h-20 w-auto object-contain" />
                                <div className="text-right text-xs">
                                    <p className="font-bold">ESCUELA SECUNDARIA DIURNA No. 27</p>
                                    <p className="font-bold">"ALFREDO E. URUCHURTU"</p>
                                    <p>TURNO VESPERTINO</p>
                                    <p>C.C.T. {CCT}</p>
                                    <p className="mt-2">C. JOSÉ MORENO SALIDO No. 47</p>
                                    <p>COL. BARRANCA SECA</p>
                                    <p>ALCALDÍA LA MAGDALENA CONTRERAS</p>
                                    <p>TEL. 55-54-25-24</p>
                                </div>
                            </div>

                            <div className="text-right mb-8">
                                <p className="font-bold">ASUNTO: CITATORIO</p>
                                <p className="mt-2">Ciudad de México, a {new Date().toLocaleDateString('es-MX', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
                            </div>

                            <div className="mb-8">
                                <p className="font-bold mb-2">C. PADRE DE FAMILIA O TUTOR</p>
                                <p className="font-bold">P R E S E N T E</p>
                            </div>

                            <div className="text-justify leading-relaxed mb-12 space-y-4">
                                <p>
                                    Por medio de la presente, solicito su presencia en este plantel el día <strong>{new Date(selectedCitation.date).toLocaleDateString('es-MX', {weekday: 'long', day: 'numeric', month: 'long'})}</strong> a las <strong>{selectedCitation.time} hrs.</strong>, para tratar asuntos relacionados con la educación y conducta de su hijo(a):
                                </p>
                                <p className="text-center font-bold text-lg uppercase border-b border-black inline-block px-8 py-1 mx-auto w-full">
                                    {selectedCitation.studentName}
                                </p>
                                <p className="text-center font-bold">
                                    DEL GRUPO: {selectedCitation.group}
                                </p>
                                <p>
                                    MOTIVO: <span className="italic">{selectedCitation.reason}</span>
                                </p>
                                <p>
                                    Agradezco de antemano su puntual asistencia y colaboración para el beneficio educativo de su hijo(a).
                                </p>
                            </div>

                            <div className="mt-24 flex justify-between text-center">
                                <div>
                                    <div className="border-t border-black w-64 mx-auto pt-2 font-bold uppercase">{currentUser.name}</div>
                                    <p className="text-xs">{getOfficialRoleName(currentUser.role)}</p>
                                </div>
                                {/* FIRMA VINCULADA: SUBDIRECTOR DE GESTIÓN */}
                                <div>
                                    <div className="border-t border-black w-64 mx-auto pt-2 font-bold uppercase">{data.subdirectorGestion || 'Lic. Pendiente Asignar'}</div>
                                    <p className="text-xs">SUBDIRECTOR DE GESTIÓN</p>
                                </div>
                            </div>

                            <div className="mt-16 text-center text-xs italic text-slate-500">
                                "La educación es tarea de todos"
                            </div>
                        </div>
                    </div>
                )}
              </>
          )}

          {/* --- BITÁCORA TAB --- */}
          {activeTab === 'bitacora' && (
              <>
                {/* LISTA BITACORAS */}
                {!selectedLog && bitacoraMode === 'list' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center no-print">
                            <h3 className="font-bold text-slate-700">Bitácora de Atención (Subdirección)</h3>
                            <div className="flex gap-2">
                                <button onClick={() => { setBitacoraType('inasistencia'); setBitacoraMode('create'); }} className="bg-white border border-slate-300 px-3 py-2 rounded-lg text-xs font-bold hover:bg-slate-50">
                                    + Inasistencia
                                </button>
                                <button onClick={() => { setBitacoraType('conducta'); setBitacoraMode('create'); }} className="bg-white border border-slate-300 px-3 py-2 rounded-lg text-xs font-bold hover:bg-slate-50">
                                    + Conducta
                                </button>
                                <button onClick={() => { setBitacoraType('accidente'); setBitacoraMode('create'); }} className="bg-white border border-slate-300 px-3 py-2 rounded-lg text-xs font-bold hover:bg-slate-50">
                                    + Accidente Escolar
                                </button>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-slate-500 font-bold">
                                    <tr>
                                        <th className="p-4 text-left">Tipo</th>
                                        <th className="p-4 text-left">Fecha</th>
                                        <th className="p-4 text-left">Alumno</th>
                                        <th className="p-4 text-left">Reporta</th>
                                        <th className="p-4 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {data.visitLogs.map(log => (
                                        <tr key={log.id} className="hover:bg-slate-50">
                                            <td className="p-4">
                                                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${log.logType === 'inasistencia' ? 'bg-orange-100 text-orange-700' : log.logType === 'accidente' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {log.logType}
                                                </span>
                                            </td>
                                            <td className="p-4">{new Date(log.date).toLocaleDateString()}</td>
                                            <td className="p-4 font-bold uppercase">{log.studentName}</td>
                                            <td className="p-4 text-xs">{log.whoReported}</td>
                                            <td className="p-4 flex justify-center gap-2">
                                                <button onClick={() => setSelectedLog(log)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Eye size={16}/></button>
                                                {canEdit && <button onClick={() => handleDeleteLog(log.id)} className="p-2 text-red-400 hover:bg-red-50 rounded"><Trash2 size={16}/></button>}
                                            </td>
                                        </tr>
                                    ))}
                                    {data.visitLogs.length === 0 && (
                                        <tr><td colSpan={5} className="p-8 text-center text-slate-400 italic">No hay registros en bitácora.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* FORMULARIO BITACORA (GENERICO CON CAMPOS ESPECIFICOS) */}
                {bitacoraMode === 'create' && (
                    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-6 no-print">
                        <h3 className="font-bold text-lg text-slate-800 mb-4 uppercase border-b pb-2">Nuevo Registro: {bitacoraType}</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Alumno(a)</label>
                                <input type="text" className="w-full p-2 border rounded-lg" value={newLog.studentName || ''} onChange={e => setNewLog({...newLog, studentName: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Grado</label>
                                    <select className="w-full p-2 border rounded-lg" value={newLog.grade || ''} onChange={e => setNewLog({...newLog, grade: e.target.value})}>
                                        <option value="">-</option>
                                        <option value="1°">1°</option><option value="2°">2°</option><option value="3°">3°</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Grupo</label>
                                    <select className="w-full p-2 border rounded-lg" value={newLog.group || ''} onChange={e => setNewLog({...newLog, group: e.target.value})}>
                                        <option value="">-</option>
                                        {['A','B','C','D'].map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Padre/Tutor</label>
                                <input type="text" className="w-full p-2 border rounded-lg" value={newLog.parentName || ''} onChange={e => setNewLog({...newLog, parentName: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Quien Reporta</label>
                                <input type="text" className="w-full p-2 border rounded-lg" value={newLog.whoReported || currentUser.name} onChange={e => setNewLog({...newLog, whoReported: e.target.value})} />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Narración de los Hechos</label>
                            <textarea className="w-full p-2 border rounded-lg h-32" value={newLog.narrative || ''} onChange={e => setNewLog({...newLog, narrative: e.target.value})} placeholder="Describa la situación..."></textarea>
                        </div>

                        {/* CAMPOS ESPECÍFICOS SEGÚN TIPO */}
                        {bitacoraType === 'inasistencia' && (
                            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 mb-4 space-y-3">
                                <h4 className="font-bold text-orange-800 text-sm uppercase">Protocolo de Inasistencia</h4>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Acciones como Docente</label>
                                    <input type="text" className="w-full p-2 border rounded-lg text-sm" value={newLog.teacherActions || ''} onChange={e => setNewLog({...newLog, teacherActions: e.target.value})} />
                                </div>
                                <div className="flex gap-4 items-center">
                                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                                        <input type="checkbox" checked={newLog.generatedCitation || false} onChange={e => setNewLog({...newLog, generatedCitation: e.target.checked})} />
                                        Se generó Citatorio
                                    </label>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2 pt-4 border-t border-slate-100">
                            <button onClick={() => setBitacoraMode('list')} className="flex-1 py-2 border rounded-lg font-bold text-slate-600 hover:bg-slate-50">Cancelar</button>
                            <button onClick={handleSaveLog} className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow">Guardar Registro</button>
                        </div>
                    </div>
                )}

                {/* VISTA PREVIA BITACORA (FORMATO OFICIAL) - FIRMA VINCULADA AL SUBDIRECTOR GESTIÓN */}
                {selectedLog && (
                    <div className="print:w-full">
                        <div className="no-print mb-6 flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <button onClick={() => setSelectedLog(null)} className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-bold"><ArrowLeft size={18}/> Volver</button>
                            <button onClick={handlePrint} className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-900 shadow"><Printer size={18}/> Imprimir</button>
                        </div>

                        {/* FORMATO IMPRESO GENÉRICO ADAPTADO */}
                        <div className="bg-white shadow-lg mx-auto max-w-[215mm] p-[15mm] print:shadow-none print:w-full print:max-w-none text-black font-sans text-xs">
                            <div className="flex items-start justify-between border-b-2 border-black pb-2 mb-4">
                                <img src={LOGO_URL} alt="Logo" className="h-16 w-auto object-contain" />
                                <div className="text-center font-bold">
                                    <p>ESCUELA SECUNDARIA DIURNA No. 27 "ALFREDO E. URUCHURTU"</p>
                                    <p>TURNO VESPERTINO C.C.T. {CCT}</p>
                                    <p className="mt-1 text-sm bg-slate-100 px-2 uppercase">BITÁCORA DE {selectedLog.logType}</p>
                                </div>
                                <div className="text-right">
                                    <p>FECHA: {selectedLog.date}</p>
                                    <p>HORA: {selectedLog.startTime}</p>
                                </div>
                            </div>

                            <div className="mb-4 grid grid-cols-2 gap-x-8 gap-y-2 border border-black p-2">
                                <p><span className="font-bold">ALUMNO:</span> <span className="uppercase">{selectedLog.studentName}</span></p>
                                <p><span className="font-bold">GRADO Y GRUPO:</span> {selectedLog.grade} "{selectedLog.group}"</p>
                                <p><span className="font-bold">PADRE O TUTOR:</span> <span className="uppercase">{selectedLog.parentName}</span></p>
                                <p><span className="font-bold">QUIEN REPORTA:</span> {selectedLog.whoReported}</p>
                            </div>

                            <div className="mb-4">
                                <p className="font-bold bg-slate-200 p-1 mb-1">NARRACIÓN DE LOS HECHOS:</p>
                                <div className="border border-black p-2 h-32 whitespace-pre-wrap">{selectedLog.narrative}</div>
                            </div>

                            <div className="mb-4">
                                <p className="font-bold bg-slate-200 p-1 mb-1">ACUERDOS Y COMPROMISOS:</p>
                                <div className="border border-black p-2 h-24 whitespace-pre-wrap">
                                    {selectedLog.agreementsParent || selectedLog.agreementsStudent || 'Sin acuerdos registrados.'}
                                </div>
                            </div>

                            <div className="mt-16 grid grid-cols-3 gap-8 text-center uppercase">
                                <div>
                                    <div className="border-t border-black pt-1 font-bold">{selectedLog.parentName}</div>
                                    <p className="text-[10px]">PADRE DE FAMILIA O TUTOR</p>
                                </div>
                                <div>
                                    <div className="border-t border-black pt-1 font-bold">{selectedLog.whoReported}</div>
                                    <p className="text-[10px]">QUIEN REPORTA</p>
                                </div>
                                {/* FIRMA VINCULADA: SUBDIRECTOR DE GESTIÓN */}
                                <div>
                                    <div className="border-t border-black pt-1 font-bold">{data.subdirectorGestion}</div>
                                    <p className="text-[10px]">SUBDIRECTOR DE GESTIÓN</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
              </>
          )}

          {/* --- MINUTAS TAB (NO CHANGES REQUIRED, BUT INCLUDED FOR COMPLETENESS) --- */}
          {activeTab === 'minuta' && (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                  <FileText size={48} className="mb-2"/>
                  <p>Módulo de Minutas en desarrollo.</p>
              </div>
          )}

      </div>
    </div>
  );
};

export default SubdireccionView;