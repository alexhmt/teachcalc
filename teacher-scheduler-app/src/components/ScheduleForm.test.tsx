import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom'; // For extended matchers
import ScheduleForm from './ScheduleForm';
import { useScheduler } from '../context/SchedulerContext';
import { Teacher, Group, ScheduledClass } from '../types';
import { format as dfnsFormat, getDay as dfnsGetDay, setHours } from 'date-fns';

// Mock the useScheduler hook
jest.mock('../context/SchedulerContext', () => ({
  useScheduler: jest.fn(),
}));

// Mock date-fns to control date generation for consistent tests
// This is important because ScheduleForm uses `new Date()` as a base for `startTime` in create mode.
const MOCK_CURRENT_DATE = new Date(2023, 10, 20, 9, 0); // Mon Nov 20 2023 09:00:00
const RealDate = Date;
global.Date = class extends RealDate {
  constructor(...args: any[]) {
    if (args.length) {
      // @ts-ignore
      return new RealDate(...args);
    }
    return MOCK_CURRENT_DATE;
  }
  static now() {
    return MOCK_CURRENT_DATE.getTime();
  }
} as any;


describe('ScheduleForm', () => {
  const mockAddScheduledClass = jest.fn();
  const mockUpdateScheduledClass = jest.fn();
  const mockOnFormClose = jest.fn();

  const mockTeachers: Teacher[] = [
    { id: 't1', name: 'Teacher One' },
    { id: 't2', name: 'Teacher Two' },
  ];
  const mockGroups: Group[] = [
    { id: 'g1', name: 'Group Alpha', teacherId: 't1', studentIds: [] },
    { id: 'g2', name: 'Group Beta', teacherId: 't2', studentIds: [] },
  ];

  beforeEach(() => {
    (useScheduler as jest.Mock).mockReturnValue({
      teachers: mockTeachers,
      groups: mockGroups,
      students: [], // Now required by ScheduleForm
      scheduledClasses: [],
      addScheduledClass: mockAddScheduledClass,
      updateScheduledClass: mockUpdateScheduledClass,
    });
    jest.clearAllMocks(); // Clear mocks before each test
  });

  afterAll(() => {
    global.Date = RealDate; // Restore original Date object
  });

  describe('Create Mode', () => {
    beforeEach(() => {
      render(<ScheduleForm editingClass={null} onFormClose={mockOnFormClose} />);
    });

    it('renders form fields correctly', () => {
      expect(screen.getByText('Create New Class')).toBeInTheDocument();
      expect(screen.getByLabelText(/^teacher:$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/group class/i)).toBeInTheDocument(); // Radio button
      expect(screen.getByLabelText(/individual class/i)).toBeInTheDocument(); // Radio button
      expect(screen.getByLabelText(/^group:$/i)).toBeInTheDocument(); // More specific
      expect(screen.getByLabelText(/day of the week/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/time/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create class/i })).toBeInTheDocument();
    });

    it('calls addScheduledClass with correct data on submit', async () => {
      fireEvent.change(screen.getByLabelText(/^teacher:$/i), { target: { value: 't1' } });
      fireEvent.change(screen.getByLabelText(/^group:$/i), { target: { value: 'g1' } });
      // Day is Monday (value 1), Time is 09:00 by default (from MOCK_CURRENT_DATE and form defaults)
      fireEvent.change(screen.getByLabelText(/day of the week/i), { target: { value: '1' } }); // Monday
      fireEvent.change(screen.getByLabelText(/^time:$/i), { target: { value: '09:00' } });

      fireEvent.click(screen.getByRole('button', { name: /create class/i }));

      await waitFor(() => {
        expect(mockAddScheduledClass).toHaveBeenCalledTimes(1);
        const callArg = mockAddScheduledClass.mock.calls[0][0];
        expect(callArg.teacherId).toBe('t1');
        expect(callArg.groupId).toBe('g1');
        expect(callArg.studentId).toBeUndefined();
        // Check startTime: Mon Nov 20 2023 09:00:00 (day 1 of week, 09:00 time)
        // MOCK_CURRENT_DATE is already Monday 9am. The form defaults to Monday, 08:00.
        // If we select Monday, 09:00, then startTime should reflect this.
        expect(dfnsGetDay(callArg.startTime)).toBe(1); // Monday
        expect(dfnsFormat(callArg.startTime, 'HH:mm')).toBe('09:00');
        expect(mockOnFormClose).toHaveBeenCalledTimes(1);
      });
      expect(mockUpdateScheduledClass).not.toHaveBeenCalled();
    });

     it('shows alert if fields are missing', () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      fireEvent.click(screen.getByRole('button', { name: /create class/i }));
      expect(alertSpy).toHaveBeenCalledWith('Please select a teacher.');
      alertSpy.mockRestore();
    });
  });

  describe('Edit Mode', () => {
    const mockEditingClass: ScheduledClass = {
      id: 'edit-c1',
      teacherId: 't2',
      groupId: 'g2',
      startTime: new Date(2023, 10, 21, 14, 0), // Tue Nov 21 2023 14:00:00
      endTime: new Date(2023, 10, 21, 15, 0),
    };

    beforeEach(() => {
      render(<ScheduleForm editingClass={mockEditingClass} onFormClose={mockOnFormClose} />);
    });

    it('renders form with populated data and "Update Class" button', () => {
      expect(screen.getByText('Edit Class')).toBeInTheDocument();
      expect(screen.getByLabelText(/^teacher:$/i)).toHaveValue(mockEditingClass.teacherId);
      expect(screen.getByLabelText(/^group:$/i)).toHaveValue(mockEditingClass.groupId);

      const expectedDay = dfnsGetDay(mockEditingClass.startTime); // Tuesday is 2
      expect(screen.getByLabelText(/day of the week/i)).toHaveValue(expectedDay.toString());
      expect(screen.getByLabelText(/^time:$/i)).toHaveValue(dfnsFormat(mockEditingClass.startTime, 'HH:mm'));
      expect(screen.getByRole('button', { name: /update class/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel edit/i })).toBeInTheDocument();
    });

    it('calls updateScheduledClass with correct data on submit', async () => {
      // Change time to 15:00 on Wednesday (day 3)
      fireEvent.change(screen.getByLabelText(/day of the week/i), { target: { value: '3' } }); // Wednesday
      fireEvent.change(screen.getByLabelText(/^time:$/i), { target: { value: '15:00' } });

      fireEvent.click(screen.getByRole('button', { name: /update class/i }));

      await waitFor(() => {
        expect(mockUpdateScheduledClass).toHaveBeenCalledTimes(1);
        const callArg = mockUpdateScheduledClass.mock.calls[0][0];
        expect(callArg.id).toBe(mockEditingClass.id);
        expect(callArg.teacherId).toBe(mockEditingClass.teacherId); // Teacher wasn't changed
        expect(callArg.groupId).toBe(mockEditingClass.groupId);   // Group wasn't changed
        expect(callArg.studentId).toBeUndefined(); // No individual student
        expect(dfnsGetDay(callArg.startTime)).toBe(3); // Wednesday
        expect(dfnsFormat(callArg.startTime, 'HH:mm')).toBe('15:00');
        expect(mockOnFormClose).toHaveBeenCalledTimes(1);
      });
       expect(mockAddScheduledClass).not.toHaveBeenCalled();
    });

    it('calls onFormClose when cancel button is clicked', () => {
      fireEvent.click(screen.getByRole('button', { name: /cancel edit/i }));
      expect(mockOnFormClose).toHaveBeenCalledTimes(1);
    });
  });
});
