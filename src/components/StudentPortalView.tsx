
import React, { useState } from 'react';
import { LogOut, Printer, User as UserIcon, GraduationCap, School } from 'lucide-react';
import { SchoolData, User, GradeScores, Student } from '../types';

// Constantes visuales
const LOGO_URL = "https://cdn1.sharemyimage.com/smi/2025/10/05/27tv.png";
const SEP_LOGO_URL = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSDxcKIcMNGVUxi6N-EpVbrw1Y7HNcrm2FqqQ&s";
const CCT = "09DES4027P";

interface StudentPortalViewProps {
  studentUser: User;
  data: SchoolData;
  onLogout: () => void;
  currentCycle: string;
}

const StudentPortalView: React.FC<StudentPortalViewProps> = ({ studentUser, data, onLogout, currentCycle }) => {
  // Now we find by ID which is the CURP string
  const student = data.studentsData.find(s => s.id === studentUser.id);
  
  if (!student) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-slate-100 flex-col gap-4">
              <p className="text-red-500 font-bold">Error: No se encontraron datos del alumno.</p>
              <button onClick={onLogout} className="text-blue-600 underline">Volver al inicio</button>
          </div>
      );
  }

  // Helpers de Cálculo
  const calculateFinalAverage = (t1: string, t2: string, t3: string): string => {
    const v1 = parseFloat(t1);
    const v2 = parseFloat(t2);
    const v3 = parseFloat(t3);
    if (!isNaN(v1) && !isNaN(v2) && !isNaN(v3)) {
        const avg = (v1 + v2 + v3) / 3;
        return avg.toFixed(1);
    }
    return '';
  };

  const calculateGeneralAverage = () => {
      const gradeStruct = data.gradesStructure.find(g => g.grade === student.grade);
      const hiddenSubjects = gradeStruct?.hiddenSubjects || [];

      let sum = 0;
      let count = 0;
      Object.entries(student.grades).forEach(([subjectName, val]) => {
          if (hiddenSubjects.includes(subjectName)) return;
          const scores = val as GradeScores;
          const final = calculateFinalAverage(scores.trim_1, scores.trim_2, scores.trim_3);
          if (final) {
              sum += parseFloat(final);
              count++;
          }
      });
      return count > 0 ? (sum / count).toFixed(1) : '';
  };

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-slate-100">
        <style>{`
          @media print {
            @page { size: letter portrait; margin: 5mm; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
            /* Hide URL headers/footers */
            html, body { height: auto; }
          }
        `}</style>

        {/* --- NAVBAR --- */}
        <nav className="bg-emerald-900 text-white p-4 shadow-md no-print">
            <div className="max-w-5xl mx-auto flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="bg-white p-1 rounded-full"><img src={LOGO_URL} alt="Logo" className="w-8 h-8 object-contain"/></div>
                    <div>
                        <h1 className="font-bold text-sm md:text-base leading-none">Portal del Alumno</h1>
                        <p className="text-[10px] text-emerald-200">Secundaria 27 "Alfredo E. Uruchurtu"</p>
                    </div>
                </div>
                <button 
                    onClick={onLogout}
                    className="flex items-center gap-2 text-xs font-bold bg-emerald-800 hover:bg-red-900 px-3 py-2 rounded-lg transition-colors border border-emerald-700"
                >
                    <LogOut size={16}/> <span className="hidden md:inline">Cerrar Sesión</span>
                </button>
            </div>
        </nav>

        {/* --- MAIN CONTENT --- */}
        <main className="max-w-5xl mx-auto p-4 md:p-8">
            
            {/* WELCOME CARD (NO PRINT) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8 flex flex-col md:flex-row justify-between items-center gap-4 no-print">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                        <UserIcon size={32} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 uppercase">{student.name}</h2>
                        <div className="flex gap-3 text-sm text-slate-500 mt-1">
                            <span className="flex items-center gap-1"><GraduationCap size={16}/> Grado: {student.grade}</span>
                            <span className="flex items-center gap-1"><School size={16}/> Grupo: {student.group}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={handlePrint}
                        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg transition-all active:scale-95"
                    >
                        <Printer size={20} /> Descargar Boleta
                    </button>
                </div>
            </div>

            {/* --- BOLETA OFICIAL PREVIEW --- */}
            <div className="bg-white shadow-xl mx-auto max-w-[215mm] min-h-[279mm] p-[10mm] text-black font-sans print:shadow-none print:w-full print:max-w-none relative">
                
                {/* HEADER BOLETA */}
                <div className="flex justify-between items-start mb-4">
                    <img src={SEP_LOGO_URL} alt="SEP" className="h-12 object-contain" />
                    <div className="text-center font-bold text-xs uppercase flex-1 px-4">
                        <p>SECRETARÍA DE EDUCACIÓN PÚBLICA</p>
                        <p>AUTORIDAD EDUCATIVA FEDERAL EN LA CIUDAD DE MÉXICO</p>
                        <p className="text-lg mt-2 mb-1 border-b-2 border-black inline-block px-8">BOLETA DE EVALUACIÓN</p>
                        <p>EDUCACIÓN SECUNDARIA CICLO ESCOLAR {currentCycle}</p>
                    </div>
                    <img src={LOGO_URL} alt="Logo" className="h-14 object-contain" />
                </div>

                {/* STUDENT INFO GRID */}
                <div className="grid grid-cols-4 gap-0 border border-black text-[10px] mb-6">
                    <div className="col-span-3 border-b border-r border-black p-1 bg-slate-100 font-bold uppercase">NOMBRE DEL ALUMNO: <span className="text-black ml-2 font-normal">{student.name}</span></div>
                    <div className="col-span-1 border-b border-black p-1 bg-slate-100 font-bold uppercase">GRADO Y GRUPO: <span className="text-black ml-2 font-normal">{student.grade} "{student.group}"</span></div>
                    
                    <div className="col-span-2 border-b border-r border-black p-1 font-bold uppercase">CURP: <span className="ml-2 font-normal">{student.id}</span></div>
                    <div className="col-span-2 border-b border-black p-1 font-bold uppercase">CCT: <span className="ml-2 font-normal">{CCT}</span></div>
                    
                    <div className="col-span-4 p-1 font-bold uppercase">ESCUELA: <span className="ml-2 font-normal">{data.name}</span></div>
                </div>

                {/* GRADES TABLE */}
                <table className="w-full border-collapse border-2 border-black text-[10px] text-center mb-8">
                    <thead>
                        <tr className="bg-slate-200">
                            <th className="border border-black p-1 w-8">No.</th>
                            <th className="border border-black p-1 text-left w-64 pl-2">ASIGNATURA</th>
                            <th className="border border-black p-1 w-12">1° PER</th>
                            <th className="border border-black p-1 w-12">2° PER</th>
                            <th className="border border-black p-1 w-12">3° PER</th>
                            <th className="border border-black p-1 w-12 bg-slate-300 font-bold">PROM</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(() => {
                            const gradeStruct = data.gradesStructure.find(g => g.grade === student.grade);
                            let subjects = gradeStruct?.subjects.filter(s => !gradeStruct.hiddenSubjects?.includes(s)) || [];
                            
                            return subjects.map((subj, i) => {
                                const grades = student.grades[subj] as GradeScores;
                                const t1 = grades?.trim_1 || '';
                                const t2 = grades?.trim_2 || '';
                                const t3 = grades?.trim_3 || '';
                                const final = calculateFinalAverage(t1, t2, t3);

                                return (
                                    <tr key={subj} className="h-8">
                                        <td className="border border-black p-1 font-bold">{i + 1}</td>
                                        <td className="border border-black p-1 text-left pl-2 font-bold uppercase">{subj}</td>
                                        <td className="border border-black p-1 text-sm">{t1}</td>
                                        <td className="border border-black p-1 text-sm">{t2}</td>
                                        <td className="border border-black p-1 text-sm">{t3}</td>
                                        <td className="border border-black p-1 text-sm font-bold bg-slate-100">{final}</td>
                                    </tr>
                                );
                            });
                        })()}
                        {/* PROMEDIO GENERAL ROW */}
                        <tr className="h-10 border-t-2 border-black">
                            <td colSpan={5} className="border border-black p-1 text-right pr-4 font-bold uppercase bg-slate-200">PROMEDIO GENERAL:</td>
                            <td className="border border-black p-1 font-extrabold text-sm bg-slate-300">{calculateGeneralAverage()}</td>
                        </tr>
                    </tbody>
                </table>

                {/* SIGNATURES FOOTER */}
                <div className="mt-auto pt-24 flex justify-around text-center text-[10px] uppercase font-bold">
                    <div>
                        <div className="border-t border-black w-48 mx-auto pt-2">{data.director}</div>
                        <p>NOMBRE Y FIRMA DEL DIRECTOR</p>
                    </div>
                    <div>
                        <div className="border-t border-black w-48 mx-auto pt-2"></div>
                        <p>SELLO DEL SISTEMA</p>
                    </div>
                </div>
            </div>

        </main>
    </div>
  );
};

export default StudentPortalView;
