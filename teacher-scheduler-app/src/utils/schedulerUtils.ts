import { ScheduledClass } from '../types';
import { isSameHour } from 'date-fns'; // Using isSameHour for 1-hour slot comparison

/**
 * Checks for conflicts for a given class against a list of existing classes.
 * A conflict exists if another class for the same teacher OR same group
 * is scheduled at the exact same hour.
 *
 * @param classToCheck The class being proposed or moved.
 * @param existingClasses All other scheduled classes.
 * @returns True if a conflict is found, false otherwise.
 */
export const checkForConflicts = (
  classToCheck: ScheduledClass,
  existingClasses: ScheduledClass[]
): boolean => {
  for (const existingClass of existingClasses) {
    // Skip if it's the same class instance (e.g., when updating a class)
    if (existingClass.id === classToCheck.id) {
      continue;
    }

    // Check for time overlap (same start hour)
    // Assumes classes are exactly 1 hour long and aligned to the hour.
    // Ensure startTimes are Date objects before comparison
    const classToCheckStartTime = typeof classToCheck.startTime === 'string' ? new Date(classToCheck.startTime) : classToCheck.startTime;
    const existingClassStartTime = typeof existingClass.startTime === 'string' ? new Date(existingClass.startTime) : existingClass.startTime;


    const sameTimeSlot = isSameHour(classToCheckStartTime, existingClassStartTime);

    if (sameTimeSlot) {
      // Conflict if the same teacher is booked at the same time
      if (classToCheck.teacherId === existingClass.teacherId) {
        console.log(`Conflict: Teacher ${classToCheck.teacherId} is already booked at ${classToCheckStartTime.toISOString()}`);
        return true;
      }
      // Conflict if the same group is booked at the same time (e.g. with a different teacher, which shouldn't happen ideally)
      if (classToCheck.groupId === existingClass.groupId) {
        console.log(`Conflict: Group ${classToCheck.groupId} is already scheduled at ${classToCheckStartTime.toISOString()}`);
        return true;
      }
    }
  }

  return false; // No conflicts found
};


// Color generation for teachers
const TEACHER_COLORS = [
  '#FFADAD', // Light Red
  '#FFD6A5', // Light Orange
  '#FDFFB6', // Light Yellow
  '#CAFFBF', // Light Green
  '#9BF6FF', // Light Cyan
  '#A0C4FF', // Light Blue
  '#BDB2FF', // Light Purple
  '#FFC6FF', // Light Pink
  '#E0BBE4', // Light Lavender
  '#D4F0F0'  // Pale Blue/Green
];

/**
 * Generates a consistent color for a teacher based on their ID.
 * @param teacherId The ID of the teacher.
 * @returns A color string (hex code).
 */
export const getTeacherColor = (teacherId: string): string => {
  if (!teacherId) {
    return '#E0E0E0'; // Default color for undefined or empty teacherId
  }
  // Simple hash function to get an index from teacherId
  let hash = 0;
  for (let i = 0; i < teacherId.length; i++) {
    hash = teacherId.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32bit integer
  }
  const index = Math.abs(hash) % TEACHER_COLORS.length;
  return TEACHER_COLORS[index];
};
