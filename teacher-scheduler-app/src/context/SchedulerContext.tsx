import { createContext, useContext } from 'react';
import { Teacher, Group, Student, ScheduledClass } from '../types';

// 1. Interfaces for Context State
export interface ISchedulerState {
  teachers: Teacher[];
  groups: Group[];
  students: Student[];
  scheduledClasses: ScheduledClass[];
}

// 2. Interfaces for Context Value
export interface ISchedulerContextProps extends ISchedulerState {
  // Scheduled Classes
  addScheduledClass: (item: ScheduledClass) => void;
  updateScheduledClass: (item: ScheduledClass) => void;
  deleteScheduledClass: (id: string) => void;
  // Teachers
  addTeacher: (teacher: Teacher) => void;
  updateTeacher: (teacher: Teacher) => void;
  deleteTeacher: (id: string) => void;
  // Groups
  addGroup: (group: Group) => void;
  updateGroup: (group: Group) => void;
  deleteGroup: (id: string) => void;
  // Students
  addStudent: (student: Student) => void;
  updateStudent: (student: Student) => void;
  deleteStudent: (id: string) => void;
}

// 3. React Context with default values
const defaultState: ISchedulerContextProps = {
  teachers: [],
  groups: [],
  students: [],
  scheduledClasses: [],
  addScheduledClass: () => {},
  updateScheduledClass: () => {},
  deleteScheduledClass: () => {},
  addTeacher: () => {},
  updateTeacher: () => {},
  deleteTeacher: () => {},
  addGroup: () => {},
  updateGroup: () => {},
  deleteGroup: () => {},
  addStudent: () => {},
  updateStudent: () => {},
  deleteStudent: () => {},
};

export const SchedulerContext = createContext<ISchedulerContextProps>(defaultState);

// 4. Custom hook to consume the context
export const useScheduler = () => {
  const context = useContext(SchedulerContext);
  if (context === undefined) {
    throw new Error('useScheduler must be used within a SchedulerProvider');
  }
  return context;
};
