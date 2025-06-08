import React from 'react';
import { render, act } from '@testing-library/react'; // Using act for potential state updates
import '@testing-library/jest-dom';
import SchedulerCalendar from './SchedulerCalendar'; // Assuming default export
import { useScheduler } from '../context/SchedulerContext';
import { ScheduledClass } from '../types';
import { DropResult } from 'react-beautiful-dnd';
import { addHours, setDay, setHours, getDay, getHours, getMonth, getFullYear } from 'date-fns';


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

  // Consistent base time for mock classes
  // Initial class: Monday, Nov 20, 2023, 09:00 AM
  const initialStartTime = new Date(2023, 10, 20, 9, 0, 0); // Month is 0-indexed, so 10 is November

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
      teachers: [{id: 't1', name: 'Teacher 1'}], // Add some mock teachers/groups
      groups: [{id: 'g1', name: 'Group 1', teacherId: 't1', studentIds: []}],
      scheduledClasses: [...mockScheduledClasses], // Use a copy to avoid modification across tests
      updateScheduledClass: mockUpdateScheduledClass,
      // Mock other context values if SchedulerCalendar directly uses them beyond these
    });
    jest.clearAllMocks();

    // Render the component. This ensures SchedulerCalendar is rendered and
    // its onDragEnd is passed to our mocked DragDropContext, captured in capturedOnDragEnd.
    render(<SchedulerCalendar />);
  });

  it('should update class time correctly on a valid drop into a new cell', () => {
    const result: DropResult = {
      draggableId: 'class1',
      source: { droppableId: 'cell-Monday-09:00', index: 0 }, // Original position (matches initialStartTime)
      destination: { droppableId: 'cell-Tuesday-10:00', index: 0 }, // New position
      reason: 'DROP',
      type: 'DEFAULT',
      mode: 'FLUID',
    };

    // Directly call the captured onDragEnd handler
    act(() => {
      capturedOnDragEnd(result);
    });


    expect(mockUpdateScheduledClass).toHaveBeenCalledTimes(1);
    const updatedClass = mockUpdateScheduledClass.mock.calls[0][0];

    expect(updatedClass.id).toBe('class1');

    // Expected: Tuesday (day 2 for date-fns if week starts on Sunday, or if setDay is used carefully)
    // The original date is Mon Nov 20, 2023. Tuesday should be Nov 21, 2023.
    const expectedStartTime = new Date(2023, 10, 21, 10, 0, 0); // Tue Nov 21 2023 10:00 AM

    expect(getFullYear(updatedClass.startTime)).toBe(getFullYear(expectedStartTime));
    expect(getMonth(updatedClass.startTime)).toBe(getMonth(expectedStartTime));
    expect(getDay(updatedClass.startTime)).toBe(2); // Tuesday is 2 (0=Sun, 1=Mon, 2=Tue)
    expect(getHours(updatedClass.startTime)).toBe(10);
    expect(updatedClass.startTime.getMinutes()).toBe(0);
  });

  it('should not call updateScheduledClass if destination is null', () => {
    const result: DropResult = {
      draggableId: 'class1',
      source: { droppableId: 'cell-Monday-09:00', index: 0 },
      destination: null, // No destination
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
      destination: { droppableId: 'cell-Monday-09:00', index: 0 }, // Same destination and index
      reason: 'DROP', type: 'DEFAULT', mode: 'FLUID',
    };
     act(() => {
      capturedOnDragEnd(result);
    });
    expect(mockUpdateScheduledClass).not.toHaveBeenCalled();
  });

  it('should not call updateScheduledClass if draggableId is not found in scheduledClasses', () => {
    const result: DropResult = {
      draggableId: 'nonExistentClass', // This class ID doesn't exist
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
      destination: { droppableId: 'some-other-area', index: 0 }, // Not a cell
      reason: 'DROP', type: 'DEFAULT', mode: 'FLUID',
    };
    act(() => {
      capturedOnDragEnd(result);
    });
    expect(mockUpdateScheduledClass).not.toHaveBeenCalled();
  });
});
