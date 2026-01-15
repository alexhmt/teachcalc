import { Teacher, Group, Student, ScheduledClass } from '../types';

const STORAGE_KEY = 'teachcalc_data';

export interface AppData {
  teachers: Teacher[];
  groups: Group[];
  students: Student[];
  scheduledClasses: ScheduledClass[];
  version: string;
  lastModified: string;
}

// Type for raw JSON data before validation
interface RawScheduledClass {
  id: unknown;
  groupId?: unknown;
  studentId?: unknown;
  teacherId: unknown;
  startTime: unknown;
  endTime: unknown;
}

interface RawTeacher {
  id: unknown;
  name: unknown;
}

interface RawGroup {
  id: unknown;
  name: unknown;
  teacherId: unknown;
  studentIds: unknown;
}

interface RawStudent {
  id: unknown;
  name: unknown;
  crmProfileLink: unknown;
}

interface RawAppData {
  teachers: unknown;
  groups: unknown;
  students: unknown;
  scheduledClasses: unknown;
  version?: unknown;
  lastModified?: unknown;
}

/**
 * Validation error class for detailed error messages
 */
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validates that a value is a non-empty string
 */
const isValidString = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim().length > 0;
};

/**
 * Validates that a value is a string (can be empty)
 */
const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

/**
 * Validates that a value is a valid date string or Date object
 */
const isValidDate = (value: unknown): boolean => {
  if (value instanceof Date) return !isNaN(value.getTime());
  if (typeof value === 'string') {
    const date = new Date(value);
    return !isNaN(date.getTime());
  }
  return false;
};

/**
 * Validates a Teacher object
 */
const validateTeacher = (teacher: RawTeacher, index: number): Teacher => {
  if (!isValidString(teacher.id)) {
    throw new ValidationError(`Преподаватель #${index + 1}: отсутствует или неверный ID`, 'teachers');
  }
  if (!isValidString(teacher.name)) {
    throw new ValidationError(`Преподаватель #${index + 1}: отсутствует или неверное имя`, 'teachers');
  }
  return { id: teacher.id, name: teacher.name };
};

/**
 * Validates a Group object
 */
const validateGroup = (group: RawGroup, index: number, teacherIds: Set<string>): Group => {
  if (!isValidString(group.id)) {
    throw new ValidationError(`Группа #${index + 1}: отсутствует или неверный ID`, 'groups');
  }
  if (!isValidString(group.name)) {
    throw new ValidationError(`Группа #${index + 1}: отсутствует или неверное название`, 'groups');
  }
  if (!isValidString(group.teacherId)) {
    throw new ValidationError(`Группа #${index + 1}: отсутствует или неверный ID преподавателя`, 'groups');
  }
  if (!teacherIds.has(group.teacherId)) {
    throw new ValidationError(`Группа "${group.name}": указан несуществующий преподаватель`, 'groups');
  }
  if (!Array.isArray(group.studentIds)) {
    throw new ValidationError(`Группа #${index + 1}: studentIds должен быть массивом`, 'groups');
  }
  const validStudentIds = group.studentIds.filter((id): id is string => isString(id));

  return {
    id: group.id,
    name: group.name,
    teacherId: group.teacherId,
    studentIds: validStudentIds,
  };
};

/**
 * Validates a Student object
 */
const validateStudent = (student: RawStudent, index: number): Student => {
  if (!isValidString(student.id)) {
    throw new ValidationError(`Студент #${index + 1}: отсутствует или неверный ID`, 'students');
  }
  if (!isValidString(student.name)) {
    throw new ValidationError(`Студент #${index + 1}: отсутствует или неверное имя`, 'students');
  }

  // crmProfileLink is optional, default to empty string
  const crmProfileLink = isString(student.crmProfileLink) ? student.crmProfileLink : '';

  return { id: student.id, name: student.name, crmProfileLink };
};

/**
 * Validates a ScheduledClass object
 */
const validateScheduledClass = (
  sc: RawScheduledClass,
  index: number,
  teacherIds: Set<string>,
  groupIds: Set<string>,
  studentIds: Set<string>
): ScheduledClass => {
  if (!isValidString(sc.id)) {
    throw new ValidationError(`Занятие #${index + 1}: отсутствует или неверный ID`, 'scheduledClasses');
  }
  if (!isValidString(sc.teacherId)) {
    throw new ValidationError(`Занятие #${index + 1}: отсутствует или неверный ID преподавателя`, 'scheduledClasses');
  }
  if (!teacherIds.has(sc.teacherId)) {
    throw new ValidationError(`Занятие #${index + 1}: указан несуществующий преподаватель`, 'scheduledClasses');
  }
  if (!isValidDate(sc.startTime)) {
    throw new ValidationError(`Занятие #${index + 1}: неверный формат времени начала`, 'scheduledClasses');
  }
  if (!isValidDate(sc.endTime)) {
    throw new ValidationError(`Занятие #${index + 1}: неверный формат времени окончания`, 'scheduledClasses');
  }

  // Validate groupId if present
  if (sc.groupId !== undefined && sc.groupId !== null) {
    if (!isString(sc.groupId)) {
      throw new ValidationError(`Занятие #${index + 1}: неверный формат ID группы`, 'scheduledClasses');
    }
    if (sc.groupId && !groupIds.has(sc.groupId)) {
      throw new ValidationError(`Занятие #${index + 1}: указана несуществующая группа`, 'scheduledClasses');
    }
  }

  // Validate studentId if present
  if (sc.studentId !== undefined && sc.studentId !== null) {
    if (!isString(sc.studentId)) {
      throw new ValidationError(`Занятие #${index + 1}: неверный формат ID студента`, 'scheduledClasses');
    }
    if (sc.studentId && !studentIds.has(sc.studentId)) {
      throw new ValidationError(`Занятие #${index + 1}: указан несуществующий студент`, 'scheduledClasses');
    }
  }

  return {
    id: sc.id,
    teacherId: sc.teacherId,
    groupId: isString(sc.groupId) ? sc.groupId : undefined,
    studentId: isString(sc.studentId) ? sc.studentId : undefined,
    startTime: new Date(sc.startTime as string | Date),
    endTime: new Date(sc.endTime as string | Date),
  };
};

/**
 * Validates the complete AppData structure
 */
export const validateAppData = (data: unknown): AppData => {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Данные должны быть объектом');
  }

  const rawData = data as RawAppData;

  // Check required arrays exist
  if (!Array.isArray(rawData.teachers)) {
    throw new ValidationError('Поле "teachers" должно быть массивом', 'teachers');
  }
  if (!Array.isArray(rawData.groups)) {
    throw new ValidationError('Поле "groups" должно быть массивом', 'groups');
  }
  if (!Array.isArray(rawData.students)) {
    throw new ValidationError('Поле "students" должно быть массивом', 'students');
  }
  if (!Array.isArray(rawData.scheduledClasses)) {
    throw new ValidationError('Поле "scheduledClasses" должно быть массивом', 'scheduledClasses');
  }

  // Validate teachers first
  const teachers: Teacher[] = rawData.teachers.map((t, i) =>
    validateTeacher(t as RawTeacher, i)
  );
  const teacherIds = new Set(teachers.map(t => t.id));

  // Validate students
  const students: Student[] = rawData.students.map((s, i) =>
    validateStudent(s as RawStudent, i)
  );
  const studentIds = new Set(students.map(s => s.id));

  // Validate groups (requires teacherIds)
  const groups: Group[] = rawData.groups.map((g, i) =>
    validateGroup(g as RawGroup, i, teacherIds)
  );
  const groupIds = new Set(groups.map(g => g.id));

  // Validate scheduled classes (requires all IDs)
  const scheduledClasses: ScheduledClass[] = rawData.scheduledClasses.map((sc, i) =>
    validateScheduledClass(sc as RawScheduledClass, i, teacherIds, groupIds, studentIds)
  );

  return {
    teachers,
    groups,
    students,
    scheduledClasses,
    version: isString(rawData.version) ? rawData.version : '1.0',
    lastModified: isString(rawData.lastModified) ? rawData.lastModified : new Date().toISOString(),
  };
};

/**
 * Save data to LocalStorage
 */
export const saveToLocalStorage = (data: AppData): boolean => {
  try {
    const dataToSave = {
      ...data,
      lastModified: new Date().toISOString(),
      version: '1.0',
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    return true;
  } catch (error) {
    console.error('Error saving to LocalStorage:', error);
    return false;
  }
};

/**
 * Load data from LocalStorage
 */
export const loadFromLocalStorage = (): AppData | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;

    const parsed = JSON.parse(data);

    // Convert date strings back to Date objects for scheduledClasses
    if (parsed.scheduledClasses && Array.isArray(parsed.scheduledClasses)) {
      parsed.scheduledClasses = parsed.scheduledClasses.map((sc: RawScheduledClass) => ({
        ...sc,
        startTime: new Date(sc.startTime as string),
        endTime: new Date(sc.endTime as string),
      }));
    }

    return parsed;
  } catch (error) {
    console.error('Error loading from LocalStorage:', error);
    return null;
  }
};

/**
 * Clear all data from LocalStorage
 */
export const clearLocalStorage = (): boolean => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing LocalStorage:', error);
    return false;
  }
};

/**
 * Export data as JSON file
 */
export const exportToJSON = (data: AppData): void => {
  const dataToExport = {
    ...data,
    lastModified: new Date().toISOString(),
    version: '1.0',
  };

  const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
    type: 'application/json',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `teachcalc-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Import data from JSON file with strict validation
 */
export const importFromJSON = (file: File): Promise<AppData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const rawData = JSON.parse(text);

        // Validate data structure with strict type checking
        const validatedData = validateAppData(rawData);

        resolve(validatedData);
      } catch (error) {
        if (error instanceof ValidationError) {
          reject(error);
        } else if (error instanceof SyntaxError) {
          reject(new ValidationError('Неверный формат JSON файла'));
        } else {
          reject(new ValidationError('Ошибка при чтении файла'));
        }
      }
    };

    reader.onerror = () => {
      reject(new ValidationError('Ошибка при чтении файла'));
    };

    reader.readAsText(file);
  });
};

/**
 * Get storage size in KB
 */
export const getStorageSize = (): number => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return 0;
    return new Blob([data]).size / 1024; // Size in KB
  } catch (error) {
    return 0;
  }
};
