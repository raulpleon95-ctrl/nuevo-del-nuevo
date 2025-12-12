import React from 'react';
import { Book, ChevronRight, Calendar } from 'lucide-react';
import { SubjectAssignment } from '../types';

interface TeacherClassesViewProps {
  assignments: SubjectAssignment[];
  onSelectClass: (assignment: SubjectAssignment) => void;
}

const TeacherClassesView: React.FC<TeacherClassesViewProps> = ({ assignments, onSelectClass }) => {
  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-slate-800">Mis Asignaturas</h2>
        <p className="text-slate-500">Selecciona un grupo para registrar calificaciones.</p>
      </div>

      {assignments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignments.map((assignment, index) => (
            <button
                key={`${assignment.grade}-${assignment.group}-${assignment.subject}-${index}`}
                onClick={() => onSelectClass(assignment)}
                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all text-left group"
            >
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                        <Book size={24} />
                    </div>
                    <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-semibold text-slate-600">
                        {assignment.grade} "{assignment.group}"
                    </span>
                </div>
                
                <h3 className="text-xl font-bold text-slate-800 mb-1">{assignment.subject}</h3>
                <p className="text-sm text-slate-500 flex items-center gap-1">
                    <Calendar size={14} /> Ciclo 2023-2024
                </p>

                <div className="mt-6 flex items-center text-blue-600 font-medium text-sm group-hover:translate-x-1 transition-transform">
                    Capturar Evaluación <ChevronRight size={16} className="ml-1" />
                </div>
            </button>
            ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
            <Book size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900">Sin asignaciones</h3>
            <p className="text-slate-500">No tienes grupos asignados actualmente.</p>
        </div>
      )}
    </div>
  );
};

export default TeacherClassesView;