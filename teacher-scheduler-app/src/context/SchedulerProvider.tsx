import React, { useState, ReactNode, useEffect } from 'react'; // Added useEffect
import { SchedulerContext } from './SchedulerContext';
import { Teacher, Group, Student, ScheduledClass } from '../types';
import { checkForConflicts } from '../utils/schedulerUtils'; // Import the conflict checker

interface SchedulerProviderProps {
  children: ReactNode;
}

export const SchedulerProvider: React.FC<SchedulerProviderProps> = ({ children }) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [scheduledClasses, setScheduledClasses] = useState<ScheduledClass[]>([]);

  // Mock data for initialization
  useEffect(() => { // Changed from useState to useEffect for initialization
    const initialTeachers: Teacher[] = [{ id: 't1', name: 'Dr. Smith' }, { id: 't2', name: 'Prof. Jones' }];
    const initialStudents: Student[] = [{ id: 's1', name: 'Alice', crmProfileLink: 'link1' }, { id: 's2', name: 'Bob', crmProfileLink: 'link2' }];
    const initialGroups: Group[] = [{ id: 'g1', name: 'Math 101', teacherId: 't1', studentIds: ['s1', 's2'] }];
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
  }, []);

  const addScheduledClass = (itemToAdd: ScheduledClass) => {
    // Create a new ID for the class to be added
    const newClassWithId = { ...itemToAdd, id: `sc${scheduledClasses.length + 1}${Date.now()}` };

    const conflicts = checkForConflicts(newClassWithId, scheduledClasses);

    if (!conflicts) {
      setScheduledClasses(prev => [...prev, newClassWithId]);
    }
    // If conflicts exist, the class is not added (silent failure for now)
  };

  const updateScheduledClass = (itemToUpdate: ScheduledClass) => {
    const conflicts = checkForConflicts(itemToUpdate, scheduledClasses);

    if (!conflicts) {
      setScheduledClasses(prev => prev.map(sc => sc.id === itemToUpdate.id ? itemToUpdate : sc));
    }
    // If conflicts exist, the update is not applied (silent failure for now)
  };

  const deleteScheduledClass = (id: string) => {
    setScheduledClasses(prev => prev.filter(sc => sc.id !== id));
  };

  // Teacher management
  const addTeacher = (teacher: Teacher) => {
    setTeachers(prev => [...prev, teacher]);
  };

  const updateTeacher = (teacher: Teacher) => {
    setTeachers(prev => prev.map(t => t.id === teacher.id ? teacher : t));
  };

  const deleteTeacher = (id: string) => {
    setTeachers(prev => prev.filter(t => t.id !== id));
    // Also remove teacher from groups and scheduled classes
    setGroups(prev => prev.filter(g => g.teacherId !== id));
    setScheduledClasses(prev => prev.filter(sc => sc.teacherId !== id));
  };

  // Group management
  const addGroup = (group: Group) => {
    setGroups(prev => [...prev, group]);
  };

  const updateGroup = (group: Group) => {
    setGroups(prev => prev.map(g => g.id === group.id ? group : g));
  };

  const deleteGroup = (id: string) => {
    setGroups(prev => prev.filter(g => g.id !== id));
    // Also remove group from scheduled classes
    setScheduledClasses(prev => prev.filter(sc => sc.groupId !== id));
  };

  // Student management
  const addStudent = (student: Student) => {
    setStudents(prev => [...prev, student]);
  };

  const updateStudent = (student: Student) => {
    setStudents(prev => prev.map(s => s.id === student.id ? student : s));
  };

  const deleteStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    // Also remove student from groups
    setGroups(prev => prev.map(g => ({
      ...g,
      studentIds: g.studentIds.filter(sid => sid !== id)
    })));
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
  };

  return (
    <SchedulerContext.Provider value={contextValue}>
      {children}
    </SchedulerContext.Provider>
  );
};

export default SchedulerProvider;
