import React, { createContext, useContext } from 'react';
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
  addScheduledClass: (item: ScheduledClass) => void;
  updateScheduledClass: (item: ScheduledClass) => void;
  deleteScheduledClass: (id: string) => void;
}

// 3. React Context with default values
const defaultState: ISchedulerContextProps = {
  teachers: [],
  groups: [],
  students: [],
  scheduledClasses: [],
  addScheduledClass: () => console.warn('addScheduledClass function not implemented'),
  updateScheduledClass: () => console.warn('updateScheduledClass function not implemented'),
  deleteScheduledClass: () => console.warn('deleteScheduledClass function not implemented'),
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
