import React from 'react';
import { render, act } from '@testing-library/react'; // Using act for potential state updates
import '@testing-library/jest-dom';
import SchedulerCalendar from './SchedulerCalendar'; // Assuming default export
import { useScheduler } from '../context/SchedulerContext';
import { ScheduledClass } from '../types';
import { DropResult } from 'react-beautiful-dnd';
// Removed getFullYear, getMonth, getDay, getHours from here as we'll use native methods for assertions
import { addHours } from 'date-fns';


// Mock react-beautiful-dnd to capture the onDragEnd handler
let capturedOnDragEnd: (result: DropResult) => void = () => {};
jest.mock('react-beautiful-dnd', () => ({
  ...jest.requireActual('react-beautiful-dnd'), // Import and retain default behavior
  DragDropContext: ({ children, onDragEnd }: { children: React.ReactNode, onDragEnd: (result: DropResult) => void }) => {
    capturedOnDragEnd = onDragEnd; // Capture the onDragEnd handler passed by SchedulerCalendar
    return <>{children}</>; // Render children normally
  },
  // Basic mock for Droppable and Draggable if they render children as function
  Droppable: ({ children }: { children: (provided: any, snapshot: any) => React.ReactNode }) =>
    children({ innerRef: jest.fn(), droppableProps: {}, placeholder: null }, { isDraggingOver: false }),
  Draggable: ({ children }: { children: (provided: any, snapshot: any) => React.ReactNode }) =>
    children({ innerRef: jest.fn(), draggableProps: {}, dragHandleProps: {} }, { isDragging: false }),
}));

// Mock the useScheduler hook
jest.mock('../context/SchedulerContext', () => ({
  useScheduler: jest.fn(),
}));


describe('SchedulerCalendar - onDragEnd Logic', () => {
  const mockUpdateScheduledClass = jest.fn();

  const initialStartTime = new Date(2023, 10, 20, 9, 0, 0); // Mon Nov 20 2023 09:00:00

  const mockScheduledClasses: ScheduledClass[] = [
    {
      id: 'class1',
      teacherId: 't1',
      groupId: 'g1',
      startTime: initialStartTime,
      endTime: addHours(initialStartTime, 1)
    },
  ];

  beforeEach(() => {
    (useScheduler as jest.Mock).mockReturnValue({
      teachers: [{id: 't1', name: 'Teacher 1'}],
      groups: [{id: 'g1', name: 'Group 1', teacherId: 't1', studentIds: []}],
      scheduledClasses: [...mockScheduledClasses],
      updateScheduledClass: mockUpdateScheduledClass,
    });
    jest.clearAllMocks();
    render(<SchedulerCalendar />);
  });

  it('should update class time correctly on a valid drop into a new cell', () => {
    const result: DropResult = {
      draggableId: 'class1',
      source: { droppableId: 'cell-Monday-09:00', index: 0 },
      destination: { droppableId: 'cell-Tuesday-10:00', index: 0 },
      reason: 'DROP', type: 'DEFAULT', mode: 'FLUID',
    };

    act(() => {
      capturedOnDragEnd(result);
    });

    expect(mockUpdateScheduledClass).toHaveBeenCalledTimes(1);
    const updatedClass = mockUpdateScheduledClass.mock.calls[0][0];
    expect(updatedClass.id).toBe('class1');

    const expectedStartTime = new Date(2023, 10, 21, 10, 0, 0); // Tue Nov 21 2023 10:00 AM

    // Using native Date prototype methods for assertions
    expect(updatedClass.startTime.getFullYear()).toBe(expectedStartTime.getFullYear());
    expect(updatedClass.startTime.getMonth()).toBe(expectedStartTime.getMonth());
    // Native getDay(): Sunday is 0, Monday is 1, Tuesday is 2
    expect(updatedClass.startTime.getDay()).toBe(expectedStartTime.getDay());
    expect(updatedClass.startTime.getHours()).toBe(expectedStartTime.getHours());
    expect(updatedClass.startTime.getMinutes()).toBe(0); // Explicitly check minutes
  });

  it('should not call updateScheduledClass if destination is null', () => {
    const result: DropResult = {
      draggableId: 'class1',
      source: { droppableId: 'cell-Monday-09:00', index: 0 },
      destination: null,
      reason: 'DROP', type: 'DEFAULT', mode: 'FLUID',
    };
    act(() => {
      capturedOnDragEnd(result);
    });
    expect(mockUpdateScheduledClass).not.toHaveBeenCalled();
  });

  it('should not call updateScheduledClass if dropped in the same place (same cell, same index)', () => {
    const result: DropResult = {
      draggableId: 'class1',
      source: { droppableId: 'cell-Monday-09:00', index: 0 },
      destination: { droppableId: 'cell-Monday-09:00', index: 0 },
      reason: 'DROP', type: 'DEFAULT', mode: 'FLUID',
    };
     act(() => {
      capturedOnDragEnd(result);
    });
    expect(mockUpdateScheduledClass).not.toHaveBeenCalled();
  });

  it('should not call updateScheduledClass if draggableId is not found in scheduledClasses', () => {
    const result: DropResult = {
      draggableId: 'nonExistentClass',
      source: { droppableId: 'cell-Monday-09:00', index: 0 },
      destination: { droppableId: 'cell-Tuesday-10:00', index: 0 },
      reason: 'DROP', type: 'DEFAULT', mode: 'FLUID',
    };
    act(() => {
      capturedOnDragEnd(result);
    });
    expect(mockUpdateScheduledClass).not.toHaveBeenCalled();
  });

  it('should not call updateScheduledClass if destination droppableId is not a cell format', () => {
    const result: DropResult = {
      draggableId: 'class1',
      source: { droppableId: 'cell-Monday-09:00', index: 0 },
      destination: { droppableId: 'some-other-area', index: 0 },
      reason: 'DROP', type: 'DEFAULT', mode: 'FLUID',
    };
    act(() => {
      capturedOnDragEnd(result);
    });
    expect(mockUpdateScheduledClass).not.toHaveBeenCalled();
  });
});
