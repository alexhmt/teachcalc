import React, { useState, ReactNode, useEffect } from 'react';
import { SchedulerContext } from './SchedulerContext';
import { Teacher, Group, Student, ScheduledClass } from '../types';
import { checkForConflicts } from '../utils/schedulerUtils';
import {
  saveToLocalStorage,
  loadFromLocalStorage,
  AppData,
  exportToJSON,
  clearLocalStorage
} from '../utils/storageUtils';
import { useSnackbar } from 'notistack';

interface SchedulerProviderProps {
  children: ReactNode;
}

export const SchedulerProvider: React.FC<SchedulerProviderProps> = ({ children }) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [scheduledClasses, setScheduledClasses] = useState<ScheduledClass[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  // Load data from LocalStorage or initialize with mock data
  useEffect(() => {
    const savedData = loadFromLocalStorage();

    if (savedData) {
      // Load from LocalStorage
      setTeachers(savedData.teachers);
      setGroups(savedData.groups);
      setStudents(savedData.students);
      setScheduledClasses(savedData.scheduledClasses);
    } else {
      // Initialize with mock data
      const initialTeachers: Teacher[] = [
        { id: 't1', name: 'Dr. Smith' },
        { id: 't2', name: 'Prof. Jones' }
      ];
      const initialStudents: Student[] = [
        { id: 's1', name: 'Alice', crmProfileLink: 'link1' },
        { id: 's2', name: 'Bob', crmProfileLink: 'link2' }
      ];
      const initialGroups: Group[] = [
        { id: 'g1', name: 'Math 101', teacherId: 't1', studentIds: ['s1', 's2'] }
      ];
      const startTime = new Date();
      startTime.setHours(10, 0, 0, 0);
      const endTime = new Date();
      endTime.setHours(11, 0, 0, 0);

      const initialScheduledClasses: ScheduledClass[] = [
        {
          id: 'sc1',
          groupId: 'g1',
          teacherId: 't1',
          startTime,
          endTime
        }
      ];

      setTeachers(initialTeachers);
      setStudents(initialStudents);
      setGroups(initialGroups);
      setScheduledClasses(initialScheduledClasses);
    }

    setIsDataLoaded(true);
  }, []);

  // Auto-save to LocalStorage whenever data changes
  useEffect(() => {
    if (!isDataLoaded) return; // Don't save during initial load

    const dataToSave: AppData = {
      teachers,
      groups,
      students,
      scheduledClasses,
      version: '1.0',
      lastModified: new Date().toISOString(),
    };

    saveToLocalStorage(dataToSave);
  }, [teachers, groups, students, scheduledClasses, isDataLoaded]);

  const addScheduledClass = (itemToAdd: ScheduledClass) => {
    // Create a new ID for the class to be added
    const newClassWithId = { ...itemToAdd, id: `sc${scheduledClasses.length + 1}${Date.now()}` };

    const conflict = checkForConflicts(newClassWithId, scheduledClasses);

    if (!conflict) {
      setScheduledClasses(prev => [...prev, newClassWithId]);
      enqueueSnackbar('Занятие успешно создано', { variant: 'success' });
    } else {
      enqueueSnackbar(`Конфликт расписания: ${conflict.message}`, { variant: 'error' });
    }
  };

  const updateScheduledClass = (itemToUpdate: ScheduledClass) => {
    const conflict = checkForConflicts(itemToUpdate, scheduledClasses);

    if (!conflict) {
      setScheduledClasses(prev => prev.map(sc => sc.id === itemToUpdate.id ? itemToUpdate : sc));
      enqueueSnackbar('Занятие успешно обновлено', { variant: 'success' });
    } else {
      enqueueSnackbar(`Конфликт расписания: ${conflict.message}`, { variant: 'error' });
    }
  };

  const deleteScheduledClass = (id: string) => {
    setScheduledClasses(prev => prev.filter(sc => sc.id !== id));
    enqueueSnackbar('Занятие удалено', { variant: 'info' });
  };

  // Teacher management
  const addTeacher = (teacher: Teacher) => {
    setTeachers(prev => [...prev, teacher]);
    enqueueSnackbar('Преподаватель добавлен', { variant: 'success' });
  };

  const updateTeacher = (teacher: Teacher) => {
    setTeachers(prev => prev.map(t => t.id === teacher.id ? teacher : t));
    enqueueSnackbar('Преподаватель обновлён', { variant: 'success' });
  };

  const deleteTeacher = (id: string) => {
    setTeachers(prev => prev.filter(t => t.id !== id));
    // Also remove teacher from groups and scheduled classes
    setGroups(prev => prev.filter(g => g.teacherId !== id));
    setScheduledClasses(prev => prev.filter(sc => sc.teacherId !== id));
    enqueueSnackbar('Преподаватель удалён', { variant: 'info' });
  };

  // Group management
  const addGroup = (group: Group) => {
    setGroups(prev => [...prev, group]);
    enqueueSnackbar('Группа добавлена', { variant: 'success' });
  };

  const updateGroup = (group: Group) => {
    setGroups(prev => prev.map(g => g.id === group.id ? group : g));
    enqueueSnackbar('Группа обновлена', { variant: 'success' });
  };

  const deleteGroup = (id: string) => {
    setGroups(prev => prev.filter(g => g.id !== id));
    // Also remove group from scheduled classes
    setScheduledClasses(prev => prev.filter(sc => sc.groupId !== id));
    enqueueSnackbar('Группа удалена', { variant: 'info' });
  };

  // Student management
  const addStudent = (student: Student) => {
    setStudents(prev => [...prev, student]);
    enqueueSnackbar('Студент добавлен', { variant: 'success' });
  };

  const updateStudent = (student: Student) => {
    setStudents(prev => prev.map(s => s.id === student.id ? student : s));
    enqueueSnackbar('Студент обновлён', { variant: 'success' });
  };

  const deleteStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    // Also remove student from groups
    setGroups(prev => prev.map(g => ({
      ...g,
      studentIds: g.studentIds.filter(sid => sid !== id)
    })));
    // Also remove student's individual classes
    setScheduledClasses(prev => prev.filter(sc => sc.studentId !== id));
    enqueueSnackbar('Студент удалён', { variant: 'info' });
  };

  // Data management
  const exportData = () => {
    const dataToExport: AppData = {
      teachers,
      groups,
      students,
      scheduledClasses,
      version: '1.0',
      lastModified: new Date().toISOString(),
    };
    exportToJSON(dataToExport);
  };

  const importData = (data: AppData) => {
    setTeachers(data.teachers);
    setGroups(data.groups);
    setStudents(data.students);
    setScheduledClasses(data.scheduledClasses);
  };

  const clearAllData = () => {
    if (window.confirm('Вы уверены, что хотите удалить все данные? Это действие необратимо.')) {
      clearLocalStorage();
      setTeachers([]);
      setGroups([]);
      setStudents([]);
      setScheduledClasses([]);
      enqueueSnackbar('Все данные удалены', { variant: 'info' });
    }
  };

  const contextValue = {
    teachers,
    groups,
    students,
    scheduledClasses,
    addScheduledClass,
    updateScheduledClass,
    deleteScheduledClass,
    addTeacher,
    updateTeacher,
    deleteTeacher,
    addGroup,
    updateGroup,
    deleteGroup,
    addStudent,
    updateStudent,
    deleteStudent,
    exportData,
    importData,
    clearAllData,
  };

  return (
    <SchedulerContext.Provider value={contextValue}>
      {children}
    </SchedulerContext.Provider>
  );
};

export default SchedulerProvider;
