
import React from 'react';
import { ChevronRight, GraduationCap, Users } from 'lucide-react';
import { SchoolData } from '../types';

interface GradeSelectionViewProps {
  data: SchoolData;
  onSelectGrade: (grade: string, group?: string) => void;
  title: string;
  subtitle: string;
  showGroups?: boolean;
}

const GradeSelectionView: React.FC<GradeSelectionViewProps> = ({ 
  data, 
  onSelectGrade, 
  title, 
  subtitle,
  showGroups = true 
}) => {
  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-slate-800">{title}</h2>
        <p className="text-slate-500">{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {data.gradesStructure.map((gradeInfo) => (
          <div
            key={gradeInfo.grade}
            className="group relative bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl hover:border-blue-200 transition-all duration-300"
          >
             {/* Card Header (Clickable to default 'A' or just grade) */}
            <div 
                className="p-8 relative cursor-pointer"
                onClick={() => onSelectGrade(gradeInfo.grade)}
            >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                   <GraduationCap size={100} className="text-blue-600 transform rotate-12" />
                </div>
                
                <div className="relative z-10 pointer-events-none">
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold mb-4">
                    Nivel Secundaria
                  </span>
                  <h3 className="text-4xl font-bold text-slate-800 mb-2">{gradeInfo.grade} Grado</h3>
                  <p className="text-slate-500 mb-2">{gradeInfo.groups.length} Grupos</p>
                </div>
            </div>

            {/* Group Buttons Area */}
            {showGroups && (
                <div className="px-6 pb-6 bg-slate-50/50 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-3 pt-4">Seleccionar Grupo</p>
                    <div className="grid grid-cols-4 gap-2">
                        {gradeInfo.groups.map(group => (
                            <button
                                key={group}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectGrade(gradeInfo.grade, group);
                                }}
                                className="flex flex-col items-center justify-center py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors shadow-sm"
                            >
                                <span>{group}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
            
            {!showGroups && (
                 <div className="px-8 pb-8 pointer-events-none">
                    <div className="flex items-center text-blue-600 font-medium">
                         Seleccionar <ChevronRight size={20} className="ml-1" />
                    </div>
                 </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GradeSelectionView;
