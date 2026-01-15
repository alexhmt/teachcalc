import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook that persists state in sessionStorage.
 * Works like useState but automatically saves to and loads from sessionStorage.
 *
 * @param key - The sessionStorage key
 * @param initialValue - The initial value (used if no value in sessionStorage)
 */
export function useSessionState<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Initialize state from sessionStorage or use initialValue
  const [value, setValue] = useState<T>(() => {
    try {
      const item = sessionStorage.getItem(key);
      return item !== null ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading sessionStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Save to sessionStorage whenever value changes
  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Error writing to sessionStorage key "${key}":`, error);
    }
  }, [key, value]);

  return [value, setValue];
}

/**
 * Hook for managing multiple filter values in sessionStorage.
 * Useful for calendar/list filters that should persist during the session.
 */
export interface FilterState {
  teacherId: string;
  groupId: string;
  studentId: string;
  searchQuery: string;
  viewMode: 'table' | 'text';
}

const DEFAULT_FILTER_STATE: FilterState = {
  teacherId: '',
  groupId: '',
  studentId: '',
  searchQuery: '',
  viewMode: 'table',
};

export function useFilterState(storageKey: string = 'scheduler_filters') {
  const [filters, setFilters] = useSessionState<FilterState>(storageKey, DEFAULT_FILTER_STATE);

  const setTeacherId = useCallback((teacherId: string) => {
    setFilters(prev => ({ ...prev, teacherId }));
  }, [setFilters]);

  const setGroupId = useCallback((groupId: string) => {
    setFilters(prev => ({ ...prev, groupId }));
  }, [setFilters]);

  const setStudentId = useCallback((studentId: string) => {
    // When student is selected, clear group filter
    setFilters(prev => ({
      ...prev,
      studentId,
      groupId: studentId ? '' : prev.groupId,
    }));
  }, [setFilters]);

  const setSearchQuery = useCallback((searchQuery: string) => {
    setFilters(prev => ({ ...prev, searchQuery }));
  }, [setFilters]);

  const setViewMode = useCallback((viewMode: 'table' | 'text') => {
    setFilters(prev => ({ ...prev, viewMode }));
  }, [setFilters]);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTER_STATE);
  }, [setFilters]);

  return {
    ...filters,
    setTeacherId,
    setGroupId,
    setStudentId,
    setSearchQuery,
    setViewMode,
    resetFilters,
  };
}
