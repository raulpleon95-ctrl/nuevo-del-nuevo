
import { SchoolGradeStructure, Student, SchoolData, User, SchoolEvent, UserPermissions, RoleDefinition } from './types';

export const roundGrade = (grade: number): number => {
  return Math.round(grade);
};

export const SCHOOL_GRADES: SchoolGradeStructure[] = [
  {
    grade: "1°",
    groups: ['A', 'B', 'C', 'D'],
    subjects: ['Español', 'Matemáticas', 'Biología', 'Inglés', 'Formación Cívica y Ética', 'Artes', 'Educación Física', 'Tecnología'],
    hiddenSubjects: []
  },
  {
    grade: "2°",
    groups: ['A', 'B', 'C', 'D'],
    subjects: ['Español', 'Matemáticas', 'Física', 'Inglés', 'Formación Cívica y Ética', 'Artes', 'Educación Física', 'Tecnología'],
    hiddenSubjects: []
  },
  {
    grade: "3°",
    groups: ['A', 'B', 'C', 'D'],
    subjects: ['Español', 'Matemáticas', 'Química', 'Inglés', 'Formación Cívica y Ética', 'Artes', 'Educación Física', 'Tecnología'],
    hiddenSubjects: []
  },
];

export const TECHNOLOGIES = [
  'Cocina',
  'Circuitos eléctricos',
  'Electrónica',
  'Diseño arquitectónico',
  'Industria del vestido'
];

export const WEEK_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
export const CLASS_PERIODS = [1, 2, 3, 4, 5, 6, 7];

// Generate empty grade structure for a student (New Inter-Trimester Structure)
export const generateEmptyGrades = (grade: string): Record<string, any> => {
  const gradeInfo = SCHOOL_GRADES.find(g => g.grade === grade);
  const studentGrades: Record<string, any> = {};
  
  if (gradeInfo) {
    gradeInfo.subjects.forEach(subject => {
      studentGrades[subject] = {
        inter_1: '', trim_1: '',
        inter_2: '', trim_2: '',
        inter_3: '', trim_3: '',
      };
    });
  }
  return studentGrades;
};

// Generar contraseña aleatoria de 6 caracteres (mayúsculas y números)
export const generateRandomPassword = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Caracteres legibles
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// --- DEFAULT SYSTEM ROLES ---
export const DEFAULT_ROLES: RoleDefinition[] = [
    {
        id: 'admin',
        name: 'Director (Administrador)',
        isSystem: true,
        requiresAssignments: false,
        permissions: {
            canViewDashboard: true,
            canViewStudents: true,
            canEditGrades: true,
            canViewReports: true,
            canManageStaff: true,
            canManageSchedules: true,
            canManageSubjects: true,
            canManagePeriods: true,
            canAccessSubdirection: true,
            canTakeAttendance: true,
            canConfigure: true
        }
    },
    {
        id: 'subdirector_gestion', // ID DE GESTIÓN (ANTERIORMENTE 'subdirector')
        name: 'Subdirector de Gestión', // NOMBRE ACTUALIZADO
        isSystem: true,
        requiresAssignments: false,
        permissions: {
            canViewDashboard: true,
            canViewStudents: true,
            canEditGrades: true,
            canViewReports: true,
            canManageStaff: true,
            canManageSchedules: true,
            canManageSubjects: true,
            canManagePeriods: true,
            canAccessSubdirection: true,
            canTakeAttendance: true,
            canConfigure: false
        }
    },
    {
        id: 'subdirector_academico', // NUEVO ROL
        name: 'Subdirector Académico',
        isSystem: true,
        requiresAssignments: false,
        permissions: {
            canViewDashboard: true,
            canViewStudents: true,
            canEditGrades: true,
            canViewReports: true,
            canManageStaff: true,
            canManageSchedules: true,
            canManageSubjects: true,
            canManagePeriods: true,
            canAccessSubdirection: true,
            canTakeAttendance: true,
            canConfigure: false
        }
    },
    {
        id: 'secretaria',
        name: 'Secretaria de Dirección',
        isSystem: true,
        requiresAssignments: false,
        permissions: {
            canViewDashboard: true,
            canViewStudents: true,
            canEditGrades: false,
            canViewReports: true,
            canManageStaff: true,
            canManageSchedules: true,
            canManageSubjects: true,
            canManagePeriods: true,
            canAccessSubdirection: true,
            canTakeAttendance: true,
            canConfigure: true
        }
    },
    {
        id: 'teacher',
        name: 'Docente',
        isSystem: true,
        requiresAssignments: true,
        permissions: {
            canViewDashboard: true,
            canViewStudents: false,
            canEditGrades: true,
            canViewReports: true,
            canManageStaff: true, 
            canManageSchedules: true,
            canManageSubjects: false,
            canManagePeriods: false,
            canAccessSubdirection: true,
            canTakeAttendance: true,
            canConfigure: false
        }
    },
    {
        id: 'administrative',
        name: 'Administrativo',
        isSystem: true,
        requiresAssignments: true, 
        permissions: {
            canViewDashboard: true,
            canViewStudents: true,
            canEditGrades: true,
            canViewReports: true,
            canManageStaff: true,
            canManageSchedules: false,
            canManageSubjects: false,
            canManagePeriods: false,
            canAccessSubdirection: false,
            canTakeAttendance: true, // Prefectos can take attendance
            canConfigure: false
        }
    },
    {
        id: 'apoyo',
        name: 'Personal de Apoyo',
        isSystem: true,
        requiresAssignments: false,
        permissions: {
            canViewDashboard: true,
            canViewStudents: false,
            canEditGrades: false,
            canViewReports: true,
            canManageStaff: true, 
            canManageSchedules: false,
            canManageSubjects: false,
            canManagePeriods: false,
            canAccessSubdirection: false,
            canTakeAttendance: false,
            canConfigure: false
        }
    }
];

// --- PERMISSIONS FACTORY (Legacy Wrapper) ---
// This is now mainly used if looking up by string ID in the defaults
export const getPermissionsByRole = (roleId: string): UserPermissions => {
    const roleDef = DEFAULT_ROLES.find(r => r.id === roleId);
    if (roleDef) return roleDef.permissions;

    // Fallback safe default
    return {
        canViewDashboard: true,
        canViewStudents: false,
        canEditGrades: false,
        canViewReports: false,
        canManageStaff: false,
        canManageSchedules: false,
        canManageSubjects: false,
        canManagePeriods: false,
        canAccessSubdirection: false,
        canTakeAttendance: false,
        canConfigure: false
    };
};

export const generateInitialData = (): SchoolData => {
  const studentsData: Student[] = [];

  const initialUsers: User[] = [
    {
      id: 'admin',
      name: 'Director Gerardo Durán',
      username: 'director',
      password: '123',
      role: 'admin',
      permissions: getPermissionsByRole('admin')
    },
    // USUARIO INICIAL SUBDIRECTOR DE GESTIÓN (USANDO EL NUEVO ID Y ROL)
    {
      id: 'sub_gestion',
      name: 'Subdirector de Gestión',
      username: 'gestion',
      password: '123',
      role: 'subdirector_gestion',
      permissions: getPermissionsByRole('subdirector_gestion')
    },
    // USUARIO INICIAL SUBDIRECTOR ACADÉMICO
    {
      id: 'sub_acad',
      name: 'Subdirector Académico',
      username: 'academico',
      password: '123',
      role: 'subdirector_academico',
      permissions: getPermissionsByRole('subdirector_academico')
    },
    // Usuario de ejemplo (Profesor)
    {
      id: 't1',
      name: 'Prof. Juan Pérez (Matemáticas)',
      username: 'profe',
      password: '123',
      role: 'teacher',
      assignments: [
        { grade: '1°', group: 'A', subject: 'Matemáticas' },
        { grade: '1°', group: 'B', subject: 'Matemáticas' },
        { grade: '2°', group: 'A', subject: 'Matemáticas' },
      ],
      permissions: getPermissionsByRole('teacher')
    }
  ];

  const defaultEvents: SchoolEvent[] = [
      {
          id: '1',
          title: 'Entrega de Boletas 1er Trimestre',
          date: '2025-11-25',
          type: 'urgent'
      },
      {
          id: '2',
          title: 'Junta de Consejo Técnico',
          date: '2025-11-30',
          type: 'info'
      }
  ];

  const defaultData: SchoolData = {
    name: "Escuela Secundaria Diurna No. 27 TV. “Alfredo E Uruchurtu”",
    director: "Gerardo Durán Diaz",
    // CAMPOS DE SUBDIRECTOR ACTUALIZADOS
    subdirector: "Nombre del Subdirector(a)", // Mantener por compatibilidad legacy
    subdirectorGestion: "Subdirector de Gestión", 
    subdirectorAcademico: "Subdirector Académico",
    teachers: 25,
    studentsCount: 0, 
    gradesStructure: SCHOOL_GRADES,
    technologies: TECHNOLOGIES, // Inicializar con la lista por defecto
    studentsData: studentsData,
    users: initialUsers,
    roles: DEFAULT_ROLES, // INITIALIZE ROLES HERE
    allowedPeriods: ['inter_1'], // Start with 1st Inter-period open
    periodDeadlines: {}, // Inicializar mapa de fechas límite vacío
    citations: [],
    visitLogs: [],
    minutas: [],
    schedules: [],
    attendance: [], // Inicializar asistencia
    scheduleFooterText: "El presente horario atiende a los numerales 3. Organización del Colectivo Escolar, 3.5. Organización Escolar, y 50. Asignación de grados y grupos al personal docente de la Guía Operativa para la Organización y Funcionamiento de los Servicios de Educación Básica, Especial y para Adultos de Escuelas Públicas en la Ciudad de México. Considerando, las necesidades del servicio y puede ser modificado en el presente ciclo con base en lo citado.",
    // Inicializar layout de sábana con el profesor de ejemplo para que no esté vacío al inicio
    sabanaLayout: {
        academic: ['t1'],
        technology: [],
        tutoria: [], // Nueva sección
        support: []
    },
    alcaldia: "LA MAGDALENA CONTRERAS",
    zonaEscolar: "069",
    turno: "VESPERTINO",
    events: defaultEvents // Eventos iniciales
  };
  
  return defaultData;
};

export const MOCK_USERS: User[] = [];
