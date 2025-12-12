
import React, { useState, useMemo } from 'react';
import { Users, Building2, GraduationCap, Home, Calendar, AlertCircle, Bell, Pencil, Trash2, Plus, X, Megaphone, FileWarning } from 'lucide-react';
import InfoCard from './InfoCard';
import { SchoolData, PageId, User, SchoolEvent, Citation } from '../types';

interface DashboardViewProps {
  data: SchoolData;
  onNavigate?: (page: PageId) => void; 
  currentUser: User;
  onUpdateData: (newData: SchoolData) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ data, onNavigate, currentUser, onUpdateData }) => {
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEventType, setNewEventType] = useState<'info' | 'important' | 'urgent'>('info');

  const canManageEvents = ['admin', 'subdirector', 'secretaria'].includes(currentUser.role);

  // --- LÓGICA UNIFICADA: AVISOS Y CITATORIOS ---
  const dashboardFeed = useMemo(() => {
      const items: Array<{type: 'citation' | 'event', date: string, data: any, id: string}> = [];

      // 1. Agregar Eventos (Avisos de Dirección)
      if (data.events) {
          data.events.forEach(event => {
              items.push({
                  type: 'event',
                  date: event.date,
                  id: `ev-${event.id}`,
                  data: event
              });
          });
      }

      // 2. Agregar Citatorios (Filtrados por rol)
      if (data.citations) {
          const relevantCitations = data.citations.filter(cit => {
              // Admin/Sub/Secretaria ven todo
              if (['admin', 'subdirector', 'secretaria'].includes(currentUser.role)) return true;
              // Profesores ven solo los que ellos generaron
              if (currentUser.role === 'teacher') return cit.teacherId === currentUser.id;
              // Otros roles no ven citatorios por defecto (o ajustar según necesidad)
              return false;
          });

          relevantCitations.forEach(cit => {
              items.push({
                  type: 'citation',
                  date: cit.date, // Fecha de la cita
                  id: `cit-${cit.id}`,
                  data: cit
              });
          });
      }

      // 3. Ordenar por fecha (Más próximo a hoy primero, o más reciente creación)
      // Aquí ordenamos por fecha del evento/cita ascendente (lo que va a pasar pronto)
      return items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  }, [data.events, data.citations, currentUser]);


  const handleAddEvent = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newEventTitle || !newEventDate) return;

      const newEvent: SchoolEvent = {
          id: Date.now().toString(),
          title: newEventTitle,
          date: newEventDate,
          type: newEventType
      };

      const updatedEvents = [...(data.events || []), newEvent];
      
      onUpdateData({
          ...data,
          events: updatedEvents
      });

      setNewEventTitle('');
      setShowEventModal(false);
  };

  const handleDeleteEvent = (id: string) => {
      if (!confirm("¿Eliminar este aviso?")) return;
      const updatedEvents = (data.events || []).filter(e => e.id !== id);
      onUpdateData({
          ...data,
          events: updatedEvents
      });
  };

  const getEventColor = (type: string) => {
      switch(type) {
          case 'urgent': return { bg: 'bg-red-50', border: 'border-l-red-500', text: 'text-red-900', iconColor: 'text-red-500' };
          case 'important': return { bg: 'bg-amber-50', border: 'border-l-amber-500', text: 'text-amber-900', iconColor: 'text-amber-500' };
          default: return { bg: 'bg-blue-50', border: 'border-l-blue-500', text: 'text-blue-900', iconColor: 'text-blue-500' };
      }
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Bienvenido, {currentUser.name}</h2>
        <p className="text-slate-500">Resumen general de {data.name}</p>
      </div>

      {/* Tarjetas Superiores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <InfoCard
          title="Alumnos Totales"
          value={data.studentsCount}
          icon={<Users className="text-purple-600" size={24} />}
          className="bg-purple-50 border-purple-100"
        />
        <InfoCard
          title="Profesores"
          value={data.teachers}
          icon={<Building2 className="text-emerald-600" size={24} />}
          className="bg-emerald-50 border-emerald-100"
        />
        <InfoCard
          title="Director"
          value={data.director}
          icon={<GraduationCap className="text-amber-600" size={24} />}
          className="bg-amber-50 border-amber-100"
        />
        <InfoCard
          title="Escuela"
          value="Secundaria 27"
          icon={<Home className="text-blue-600" size={24} />}
          className="bg-blue-50 border-blue-100"
        />
      </div>

      {/* Main Content Grid - REORGANIZADO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: FEED DE AVISOS Y CITATORIOS (2/3 del ancho) */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                    <Bell className="mr-2 text-slate-600" size={24} />
                    Avisos y Citatorios
                </h3>
                
                <div className="space-y-4">
                    {dashboardFeed.length > 0 ? (
                        dashboardFeed.map((item) => {
                            // RENDERIZADO DE CITATORIO
                            if (item.type === 'citation') {
                                const cit = item.data as Citation;
                                return (
                                    <div key={item.id} className="flex p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-orange-500">
                                        <div className="mr-4 mt-1">
                                            <div className="p-2 bg-orange-100 rounded-full text-orange-600">
                                                <FileWarning size={20} />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-bold text-slate-800 text-sm uppercase">Citatorio: {cit.studentName}</h4>
                                                <span className="text-xs font-bold bg-orange-100 text-orange-800 px-2 py-1 rounded-lg">
                                                    {new Date(cit.date).toLocaleDateString()} - {cit.time}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-600 mt-1">
                                                <span className="font-semibold">Grupo:</span> {cit.group}
                                            </p>
                                            <p className="text-sm text-slate-500 mt-1 italic">
                                                "{cit.reason}"
                                            </p>
                                            <p className="text-xs text-slate-400 mt-2">
                                                Solicitado por: {cit.teacherName || 'Dirección'}
                                            </p>
                                        </div>
                                    </div>
                                );
                            } 
                            // RENDERIZADO DE AVISO (EVENTO)
                            else {
                                const ev = item.data as SchoolEvent;
                                const colors = getEventColor(ev.type);
                                return (
                                    <div key={item.id} className={`flex p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow border-l-4 ${colors.border}`}>
                                        <div className="mr-4 mt-1">
                                            <div className={`p-2 rounded-full ${colors.bg} ${colors.iconColor}`}>
                                                <Megaphone size={20} />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h4 className={`font-bold text-sm uppercase ${colors.text}`}>{ev.title}</h4>
                                                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${colors.bg} ${colors.text}`}>
                                                    {new Date(ev.date).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-500 mt-1">
                                                Aviso Institucional
                                            </p>
                                            {canManageEvents && (
                                                <button 
                                                    onClick={() => handleDeleteEvent(ev.id)}
                                                    className="text-xs text-red-400 hover:text-red-600 mt-2 flex items-center gap-1"
                                                >
                                                    <Trash2 size={12}/> Eliminar Aviso
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            }
                        })
                    ) : (
                        <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <AlertCircle className="mx-auto mb-2 opacity-50" size={32} />
                            <p className="text-sm font-medium">No hay avisos ni citatorios pendientes.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* COLUMNA DERECHA: GESTIÓN Y CALENDARIO (1/3 del ancho) */}
        <div className="lg:col-span-1 space-y-6">
            
            {/* Widget de Gestión de Avisos (Solo Admins) */}
            {canManageEvents && (
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl shadow-lg text-white">
                    <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                        <Pencil size={20} /> Publicar Aviso
                    </h3>
                    <p className="text-slate-300 text-sm mb-4">Crea un anuncio visible para todo el personal.</p>
                    <button 
                        onClick={() => setShowEventModal(true)}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <Plus size={18} /> Nuevo Aviso
                    </button>
                </div>
            )}

            {/* Widget Informativo */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Calendar size={20} className="text-blue-600"/> Próximas Fechas
                </h3>
                <div className="space-y-3">
                    {/* Filtramos solo eventos futuros para este widget rápido */}
                    {(data.events || []).filter(e => new Date(e.date) >= new Date()).slice(0, 3).map(ev => (
                        <div key={ev.id} className="text-sm border-b border-slate-100 pb-2 last:border-0">
                            <p className="font-bold text-slate-700">{ev.title}</p>
                            <p className="text-xs text-slate-500">{new Date(ev.date).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                        </div>
                    ))}
                    {(data.events || []).filter(e => new Date(e.date) >= new Date()).length === 0 && (
                        <p className="text-xs text-slate-400 italic">Sin eventos futuros programados.</p>
                    )}
                </div>
            </div>

        </div>

      </div>

      {/* --- ADD EVENT MODAL --- */}
      {showEventModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in-up">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold text-slate-800">Publicar Aviso Institucional</h3>
                      <button onClick={() => setShowEventModal(false)} className="text-slate-400 hover:text-slate-600">
                          <X size={20} />
                      </button>
                  </div>
                  <form onSubmit={handleAddEvent} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Título del Aviso</label>
                          <input 
                            type="text" 
                            required 
                            value={newEventTitle}
                            onChange={(e) => setNewEventTitle(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ej. Suspensión de labores, Entrega de documentación..."
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Relevante</label>
                          <input 
                            type="date" 
                            required 
                            value={newEventDate}
                            onChange={(e) => setNewEventDate(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Prioridad</label>
                          <div className="flex gap-2">
                              <button type="button" onClick={() => setNewEventType('info')} className={`flex-1 py-2 rounded-lg text-xs font-bold border ${newEventType === 'info' ? 'bg-blue-100 border-blue-500 text-blue-700' : 'border-slate-200 text-slate-500'}`}>Normal</button>
                              <button type="button" onClick={() => setNewEventType('important')} className={`flex-1 py-2 rounded-lg text-xs font-bold border ${newEventType === 'important' ? 'bg-amber-100 border-amber-500 text-amber-700' : 'border-slate-200 text-slate-500'}`}>Importante</button>
                              <button type="button" onClick={() => setNewEventType('urgent')} className={`flex-1 py-2 rounded-lg text-xs font-bold border ${newEventType === 'urgent' ? 'bg-red-100 border-red-500 text-red-700' : 'border-slate-200 text-slate-500'}`}>Urgente</button>
                          </div>
                      </div>
                      <button type="submit" className="w-full py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-colors shadow-lg flex items-center justify-center gap-2">
                          <Plus size={18} /> Publicar
                      </button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default DashboardView;
