

export interface GradeScores {
  // Periodo 1
  inter_1: 'GREEN' | 'RED' | ''; // Semáforo
  trim_1: string; // Numérico
  
  // Periodo 2
  inter_2: 'GREEN' | 'RED' | '';
  trim_2: string;

  // Periodo 3
  inter_3: 'GREEN' | 'RED' | '';
  trim_3: string;
  
  [key: string]: string;
}

export interface Student {
  id: number;
  name: string;
  grade: string; // "1°", "2°", "3°", "Egresado"
  group: string; // "A", "B", "C", "D"
  technology?: string; // Nuevo campo para el Taller
  grades: Record<string, GradeScores>; // Key is Subject Name
  status?: 'active' | 'graduated' | 'dropped'; // Nuevo campo de estatus
  dropoutReason?: string; // Motivo de baja
  dropoutDate?: string; // Fecha de baja
}

export interface SchoolGradeStructure {
  grade: string;
  groups: string[];
  subjects: string[];
  hiddenSubjects?: string[]; // Asignaturas que no aparecen en boleta ni promedio
}

// export type Role = 'admin' | 'subdirector' | 'secretaria' | 'teacher' | 'administrative' | 'red_escolar' | 'laboratorista' | 'apoyo';

export interface SubjectAssignment {
  grade: string;
  group: string;
  subject: string;
  technology?: string; // Opcional: Solo si la materia es Tecnología
}

// --- HOJA DE DATOS INTERFACES ---
export interface PersonalData {
  rfc: string;
  curp: string;
  filiacion?: string; // Added Filiación
  civilStatus: string;
  birthDate: string;
  birthPlace: string;
  address: {
    street: string;
    extNum: string;
    intNum: string;
    colonia: string;
    alcaldia: string;
    postalCode: string;
    phone: string;
    cellphone: string;
    email: string;
  };
}

export interface SchoolingData {
  lastDegree: string; // Último grado de escolaridad
  institution: string;
  isPasante: string; // Changed to string for "SI/NO" text input
  isTitled: string; // Changed to string for "SI/NO" text input
  cedula: string;
  cedulaDate: string;
  specialization: string; // Licenciatura, Maestria o Doctorado en...
}

export interface LaborData {
  keys: string[]; // Claves presupuestales (hasta 6)
  lastOrderDate: string; // Fecha ultima orden de presentación
  previousSchools: string;
  admissionDateGov: string; // Gobierno Fed
  admissionDateSep: string; // SEP
  admissionDateCses: string; // C.S.E.S.
  yearsService: string;
  otherJob: 'SI' | 'NO'; // Declaro bajo protesta...
  entryDate: string; // Fecha de ingreso (al final)
  cargo?: string;
  especialidad?: string;
  
  // Campos específicos para "Otro Empleo"
  otherJobName?: string; // EMPLEO
  otherJobCategory?: string; // CATEGORIA
  otherJobKey?: string; // CLAVE(S)
  otherJobStartDate?: string; // FECHA DE INGRESO (OTRO EMPLEO)
}

export interface UserPermissions {
  canViewDashboard: boolean;
  canViewStudents: boolean;      // Alumnos y Grupos
  canEditGrades: boolean;        // Registro de Calificaciones
  canViewReports: boolean;       // Formatos y Reportes
  canManageStaff: boolean;       // Ver/Editar Personal (TeacherView)
  canManageSchedules: boolean;   // Horarios
  canManageSubjects: boolean;    // Configuración Asignaturas
  canManagePeriods: boolean;     // Control de Periodos
  canAccessSubdirection: boolean;// Citatorios y Bitácora
  canTakeAttendance: boolean;    // NUEVO: Asistencia Diaria
  canConfigure: boolean;         // Configuración Global (DB)
}

export interface RoleDefinition {
    id: string; // Unique key
    name: string; // Display Name
    permissions: UserPermissions; // Default permissions for this role
    requiresAssignments?: boolean; // Whether to show the Assignment panel (Grade/Group/Subject)
    isSystem?: boolean; // If true, ID cannot be changed/deleted easily
}

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string; // Added for credential management simulation
  role: string; // Changed to string to support dynamic roles
  permissions?: UserPermissions; // NEW: Granular permissions
  assignments?: SubjectAssignment[]; // Only for teachers
  workSchedule?: Record<string, string>; // Para personal de apoyo: { "Lunes": "14:00-19:00", ... }
  
  // Hoja de Datos Fields
  personalData?: PersonalData;
  schoolingData?: SchoolingData;
  laborData?: LaborData;
  hojaDatosCycle?: string; // Ciclo escolar específico para la hoja de datos
}

export interface Citation {
  id: string;
  studentId?: number | null; // Made optional for manual entry
  studentName: string;
  group: string; // Now stores full string like "1° A"
  date: string;
  time: string;
  reason: string;
  createdAt: string;
  teacherId?: string; // ID del profesor que cita
  teacherName?: string; // Nombre del profesor que cita
}

export interface VisitLog {
  id: string;
  logType: 'inasistencia' | 'conducta' | 'accidente'; // Distingue el formato
  studentId?: number | null;
  studentName: string;
  grade: string; 
  group: string; 
  parentName: string; 
  date: string;
  startTime: string; // HORA
  endTime: string; // Only for generic use or internal tracking
  
  // Common Fields
  location: string; // LUGAR
  whoReported: string; // QUIEN REPORTA
  involvedStudents: string; // ALUMNO(A)S INVOLUCRADO (S)
  narrative: string; // NARRACIÓN DE LOS HECHOS
  
  // Checkboxes "A QUIÉN INFORMÉ"
  informedDirector: boolean;
  informedSubdirector: boolean;
  informedParent: boolean;
  informedUdeei: boolean;

  // INASISTENCIA Specifics (INAS-APR)
  teacherActions: string; // ACCIONES QUE APLIQUÉ COMO DOCENTE
  formativeAction: string; // ACCIÓN FORMATIVA APLICADA
  generatedCitation: boolean; // ¿SE GENERÓ CITATORIO?
  udeeiActions: string; // QUÉ ACCIONES REALIZARÉ CON APOYO UDEEI
  technicalMeasure: string; // MEDIDAS TECNICO PEDAGÓGICA (No asista)

  // CONDUCTA Specifics (C / AE) & ACCIDENTE (AE)
  pedagogicalMeasure: string; // ACCIONES QUE APLIQUÉ (MEDIDAS TÉCNICO PEDAGÓGICAS)
  conciliation: boolean; // ¿SE REALIZÓ CONCILIACIÓN?
  canalization: boolean; // ¿REQUIRIÓ CANALIZACIÓN?
  canalizationInstitution: string; // A QUE INSTITUCIÓN
  bullyingProtocol: boolean; // ¿SE VA APLICAR PROTOCOLO ACOSO?
  bullyingProtocolReason: string; // PORQUÉ
  vaSeguro: boolean; // ¿SE ACTIVÓ VA SEGURO?
  vaSeguroObservation: string; // OBSERVACIÓN

  // Footer Fields
  agreementsParent: string; // ACUERDOS PADRE
  agreementsStudent: string; // ACUERDOS ALUMNOS (Conducta)
  attentionToParent: string; // QUÉ ATENCIÓN SE LE DIO AL PADRE

  conformityStaffId?: string; // ID del personal que atiende (para aviso conformidad)
}

export interface Minuta {
  id: string;
  studentId?: number | null; // Made optional
  studentName: string;
  grade: string;
  group: string;
  parentName: string;
  date: string;
  startTime: string;
  subject: string; // Motivo de la atencion/queja
  description: string; // Descripción de la situación
  previousActions: string; // Acciones realizadas / Respuesta previa
  agreements: string; // Acuerdos
  attendedBy?: string; // Nombre de quien atiende (manual)
}

export interface ScheduleEntry {
  id: string;
  teacherId: string;
  day: string; // 'Lunes', 'Martes', etc.
  period: number; // 1 to 7
  gradeGroup: string; // "1A", "2B" for Academic OR "11", "12" for Tech
  type?: 'academic' | 'technology' | 'support'; // Added 'technology' type
}

export interface SchoolEvent {
  id: string;
  title: string;
  date: string;
  type: 'info' | 'important' | 'urgent'; // Azul, Naranja, Rojo
}

// --- ATTENDANCE TYPES ---
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceRecord {
    id: string;
    date: string; // YYYY-MM-DD
    studentId: number;
    grade: string;
    group: string;
    status: AttendanceStatus;
    recordedBy?: string; // User ID
}

export interface SchoolData {
  name: string;
  director: string;
  subdirector: string; // Legacy
  subdirectorGestion: string; // Nuevo
  subdirectorAcademico: string; // Nuevo
  teachers: number;
  studentsCount: number;
  gradesStructure: SchoolGradeStructure[];
  technologies: string[]; // Lista dinámica de talleres
  studentsData: Student[];
  users: User[];
  roles: RoleDefinition[]; // Nuevo: Lista dinámica de roles
  allowedPeriods: string[]; // Changed from allowedMonths to allowedPeriods (inter_1, trim_1, etc)
  periodDeadlines?: Record<string, string>; // Map period key to ISO date string deadline
  citations: Citation[];
  visitLogs: VisitLog[];
  minutas: Minuta[];
  schedules: ScheduleEntry[]; // Horarios
  attendance?: AttendanceRecord[]; // NUEVO: Asistencia diaria
  scheduleFooterText?: string; // TEXTO EDITABLE DEL HORARIO
  events?: SchoolEvent[]; // NUEVO: LISTA DE EVENTOS
  
  // Layout persistente de la sábana para guardar el orden y selección de filas
  sabanaLayout?: {
      academic: string[]; // Array de teacherIds
      technology: string[]; // Array de teacherIds (Nuevo)
      support: string[];  // Array de teacherIds
  };

  subdirectorName?: string;
  // New Official Fields
  alcaldia: string;
  zonaEscolar: string;
  turno: string;
  currentCycle?: string; // Added to store selected cycle
}

export type PageId = 'dashboard' | 'grades' | 'grade-registration' | 'teachers' | 'subdireccion' | 'students-list' | 'subjects-selection' | 'grade-entry' | 'reports' | 'teacher-classes' | 'grade-control' | 'subjects-config' | 'schedules' | 'attendance' | 'config';