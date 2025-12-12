import React from 'react';
import { Book, ArrowLeft, Beaker, Calculator, Languages, Palette, Dumbbell, Globe, Cpu } from 'lucide-react';
import { SchoolData } from '../types';

interface SubjectsViewProps {
  grade: string;
  data: SchoolData;
  onSelectSubject: (subject: string) => void;
  onBack: () => void;
}

const getSubjectIcon = (subject: string) => {
  const lower = subject.toLowerCase();
  if (lower.includes('matemáticas')) return <Calculator size={32} />;
  if (lower.includes('español') || lower.includes('inglés')) return <Languages size={32} />;
  if (lower.includes('biología') || lower.includes('física') || lower.includes('química')) return <Beaker size={32} />;
  if (lower.includes('artes')) return <Palette size={32} />;
  if (lower.includes('educación física')) return <Dumbbell size={32} />;
  if (lower.includes('cívica')) return <Globe size={32} />;
  if (lower.includes('tecnología')) return <Cpu size={32} />;
  return <Book size={32} />;
};

const getSubjectColor = (subject: string) => {
  const lower = subject.toLowerCase();
  if (lower.includes('matemáticas')) return 'text-blue-600 bg-blue-50 border-blue-100 hover:border-blue-300';
  if (lower.includes('español')) return 'text-red-600 bg-red-50 border-red-100 hover:border-red-300';
  if (lower.includes('inglés')) return 'text-purple-600 bg-purple-50 border-purple-100 hover:border-purple-300';
  if (lower.includes('ciencias') || lower.includes('biología') || lower.includes('física') || lower.includes('química')) return 'text-green-600 bg-green-50 border-green-100 hover:border-green-300';
  if (lower.includes('artes')) return 'text-pink-600 bg-pink-50 border-pink-100 hover:border-pink-300';
  return 'text-slate-600 bg-slate-50 border-slate-100 hover:border-slate-300';
};

const SubjectsView: React.FC<SubjectsViewProps> = ({ grade, data, onSelectSubject, onBack }) => {
  const gradeData = data.gradesStructure.find(g => g.grade === grade);

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center space-x-4">
        <button onClick={onBack} className="p-2 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Asignaturas de {grade}</h2>
          <p className="text-slate-500">Selecciona una asignatura para registrar calificaciones</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {gradeData?.subjects.map(subject => (
          <button
            key={subject}
            onClick={() => onSelectSubject(subject)}
            className={`p-6 rounded-2xl shadow-sm border transition-all duration-300 flex flex-col items-center justify-center text-center h-48 group hover:shadow-lg transform hover:-translate-y-1 ${getSubjectColor(subject)}`}
          >
            <div className="mb-4 p-4 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform duration-300">
              {getSubjectIcon(subject)}
            </div>
            <span className="text-lg font-bold text-slate-800 group-hover:text-black">{subject}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SubjectsView;