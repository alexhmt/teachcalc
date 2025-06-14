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
    const initialScheduledClasses: ScheduledClass[] = [
      {
        id: 'sc1',
        groupId: 'g1',
        teacherId: 't1',
        startTime: new Date(new Date().setHours(10, 0, 0, 0)), // Example: Today at 10:00 AM
        endTime: new Date(new Date().setHours(11, 0, 0, 0))   // Example: Today at 11:00 AM
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
    console.log("Conflict check for new class:", newClassWithId.id, "Result:", conflicts);

    if (!conflicts) {
      console.log('Adding ScheduledClass (no conflict):', newClassWithId);
      setScheduledClasses(prev => [...prev, newClassWithId]);
    } else {
      console.warn('Could not add ScheduledClass due to conflict:', newClassWithId);
      // Here you might want to provide user feedback
    }
  };

  const updateScheduledClass = (itemToUpdate: ScheduledClass) => {
    const conflicts = checkForConflicts(itemToUpdate, scheduledClasses);
    console.log("Conflict check for updated class:", itemToUpdate.id, "Result:", conflicts);

    if (!conflicts) {
      console.log('Updating ScheduledClass (no conflict):', itemToUpdate);
      setScheduledClasses(prev => prev.map(sc => sc.id === itemToUpdate.id ? itemToUpdate : sc));
    } else {
      console.warn('Could not update ScheduledClass due to conflict:', itemToUpdate);
      // Here you might want to revert the change or provide user feedback
    }
  };

  const deleteScheduledClass = (id: string) => {
    console.log('Deleting ScheduledClass with id:', id);
    setScheduledClasses(prev => prev.filter(sc => sc.id !== id));
  };

  const contextValue = {
    teachers,
    groups,
    students,
    scheduledClasses,
    addScheduledClass,
    updateScheduledClass,
    deleteScheduledClass,
  };

  return (
    <SchedulerContext.Provider value={contextValue}>
      {children}
    </SchedulerContext.Provider>
  );
};

export default SchedulerProvider;
