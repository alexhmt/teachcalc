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
    if (parsed.scheduledClasses) {
      parsed.scheduledClasses = parsed.scheduledClasses.map((sc: any) => ({
        ...sc,
        startTime: new Date(sc.startTime),
        endTime: new Date(sc.endTime),
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
 * Import data from JSON file
 */
export const importFromJSON = (file: File): Promise<AppData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);

        // Validate data structure
        if (!data.teachers || !data.groups || !data.students || !data.scheduledClasses) {
          throw new Error('Invalid data format: missing required fields');
        }

        // Convert date strings back to Date objects
        if (data.scheduledClasses) {
          data.scheduledClasses = data.scheduledClasses.map((sc: any) => ({
            ...sc,
            startTime: new Date(sc.startTime),
            endTime: new Date(sc.endTime),
          }));
        }

        resolve(data);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Error reading file'));
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
