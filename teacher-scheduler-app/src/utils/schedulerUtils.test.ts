import { checkForConflicts, getTeacherColor } from './schedulerUtils';
import { ScheduledClass } from '../types';
import { addHours, setHours } from 'date-fns';

describe('schedulerUtils', () => {
  describe('checkForConflicts', () => {
    // Consistent base time for all tests in this block
    // Using setHours to ensure the date part is consistent and only time varies initially.
    const baseDate = new Date(2023, 10, 20); // Mon Nov 20 2023
    const time0900 = setHours(baseDate, 9);
    const time1000 = setHours(baseDate, 10);
    const time1100 = setHours(baseDate, 11);

    const createClass = (id: string, teacherId: string, groupId: string, startTime: Date): ScheduledClass => ({
      id,
      teacherId,
      groupId,
      startTime,
      endTime: addHours(startTime, 1),
    });

    // Define a set of existing classes for tests
    const existingClassT1G1_0900 = createClass('c1', 't1', 'g1', time0900); // Teacher1, Group1 @ 9AM
    const existingClassT2G2_0900 = createClass('c2', 't2', 'g2', time0900); // Teacher2, Group2 @ 9AM
    const existingClassT1G3_0900 = createClass('c3', 't1', 'g3', time0900); // Teacher1, Group3 @ 9AM (conflict with new T1 class at 9)
    const existingClassT3G1_0900 = createClass('c4', 't3', 'g1', time0900); // Teacher3, Group1 @ 9AM (conflict with new G1 class at 9)
    const existingClassT1G1_1000 = createClass('c5', 't1', 'g1', time1000); // Teacher1, Group1 @ 10AM

    const existingClasses: ScheduledClass[] = [
      existingClassT1G1_0900,
      existingClassT2G2_0900,
      existingClassT1G3_0900,
      existingClassT3G1_0900,
      existingClassT1G1_1000,
    ];

    it('should return false when there are no conflicts with any existing class', () => {
      const newClassNoConflict = createClass('new0', 't99', 'g99', time0900); // Different T/G, same time as some
      expect(checkForConflicts(newClassNoConflict, existingClasses)).toBe(false);
      const newClassNoConflictDifferentTime = createClass('new1', 't1', 'g1', time1100); // Same T/G as c1, but different time
      expect(checkForConflicts(newClassNoConflictDifferentTime, existingClasses)).toBe(false);
    });

    it('should return true for conflict by teacher (same teacher, same time, different group)', () => {
      // This new class conflicts with existingClassT1G3_0900 (c3) because teacher 't1' is booked at 9AM.
      // And also conflicts with existingClassT1G1_0900 (c1) for the same reason.
      const newClassConflictTeacher = createClass('new2', 't1', 'g99', time0900);
      expect(checkForConflicts(newClassConflictTeacher, existingClasses)).toBe(true);
    });

    it('should return true for conflict by group (same group, same time, different teacher)', () => {
      // This new class conflicts with existingClassT3G1_0900 (c4) because group 'g1' is booked at 9AM.
      // And also conflicts with existingClassT1G1_0900 (c1) for the same reason.
      const newClassConflictGroup = createClass('new3', 't99', 'g1', time0900);
      expect(checkForConflicts(newClassConflictGroup, existingClasses)).toBe(true);
    });

    it('should return false if checking a class against itself (same id)', () => {
      // Create a slightly modified version of an existing class, but with the same ID.
      const updatedClassC1 = { ...existingClassT1G1_0900, teacherId: 't-new-for-c1' };
      // When checking updatedClassC1, it should ignore the original existingClassT1G1_0900 in the list.
      // For this test to be meaningful, ensure no *other* class conflicts with updatedClassC1.
      // Let's make it conflict with C3 by teacher ID 't1' if the self-check wasn't there.
      const updatedClassC3_selfCheck = createClass('c3', 't1', 'g-new-for-c3', time0900);
      // existingClasses contains c1 (t1,g1,9am) and c3 (t1,g3,9am)
      // If we update c3, its new form (updatedClassC3_selfCheck) should not conflict with the c3 already in existingClasses.
      // However, it *would* conflict with c1 if not for the self-ID check, as both are t1 at 9am.
      // The current logic: if ID is same, skip. Then it would check against c1 and find a conflict.
      // This test means: if I update c1, it shouldn't conflict with the original c1 in the list.
      // Let's test updating c1 so it clashes with c3 (t1, g3, 9am)
      const c1UpdatedToClashWithC3IfNoSelfCheck = createClass('c1', 't1', 'g1', time0900); // This is identical to existing c1
      // This test should be "if I update c1, and its new details *only* clash with its old details, it's false"
      // More accurately: "if I update c1, and its new details clash with c3, it's true, *unless* c1 is c3 (which it's not)"
      // The self-check is simple: if (existingClass.id === classToCheck.id) continue.

      // Scenario: c1 is being updated. Its new form is 'updatedC1'.
      // 'existingClasses' contains the original c1.
      // checkForConflicts(updatedC1, existingClasses)
      // Inside loop: when existingClass is original c1, it will be skipped.
      // Then updatedC1 will be checked against c2, c3, c4, c5.

      // No conflict if only its own original entry would have been a problem.
      const updatedC1NoOtherConflicts = createClass('c1', 't1-updated', 'g1-updated', time0900);
      expect(checkForConflicts(updatedC1NoOtherConflicts, existingClasses)).toBe(false);

      // Conflict with another class (c3) due to teacher 't1'
      const updatedC1NowConflictsWithC3 = createClass('c1', 't1', 'g1-updated-still-t1', time0900);
      expect(checkForConflicts(updatedC1NowConflictsWithC3, existingClasses)).toBe(true);

    });

    it('should return false for same teacher/group but different time slot', () => {
        const newClassDifferentTime = createClass('new4', 't1', 'g1', time1100);
        expect(checkForConflicts(newClassDifferentTime, existingClasses)).toBe(false);
    });

     it('should handle string dates in ScheduledClass objects correctly', () => {
      const stringDateClass: ScheduledClass = {
        id: 's1', teacherId: 't1', groupId: 'g10',
        startTime: time0900.toISOString() as any, // Cast to any to simulate string date from an API
        endTime: addHours(time0900, 1).toISOString() as any,
      };
      // This class should conflict with existingClassT1G1_0900 and existingClassT1G3_0900 by teacher
      expect(checkForConflicts(stringDateClass, existingClasses)).toBe(true);

      const nonConflictingStringDateClass = createClass('s2', 't99', 'g99', time0900);
      // Make one of the existing classes have string dates too
      const existingWithStringDates = [
        createClass('c1_str', 't1', 'g1', time0900.toISOString() as any),
        existingClassT2G2_0900
      ];
      expect(checkForConflicts(nonConflictingStringDateClass, existingWithStringDates)).toBe(false);
    });
  });

  describe('getTeacherColor', () => {
    it('should return a string', () => {
      expect(typeof getTeacherColor('teacher1')).toBe('string');
    });

    it('should return a string starting with # for valid teacherId', () => {
      expect(getTeacherColor('teacher1').startsWith('#')).toBe(true);
    });

    it('should return consistent colors for the same teacherId', () => {
      const color1 = getTeacherColor('teacher-consistent');
      const color2 = getTeacherColor('teacher-consistent');
      expect(color1).toBe(color2);
    });

    it('should return the default color for empty or undefined teacherId', () => {
        const defaultColor = '#E0E0E0'; // As defined in schedulerUtils
        expect(getTeacherColor('')).toBe(defaultColor);
        expect(getTeacherColor(undefined as any)).toBe(defaultColor); // Cast to any for undefined
         expect(getTeacherColor(null as any)).toBe(defaultColor); // Test null as well
    });

    it('should cycle through colors and not go out of bounds', () => {
        // Create more teacherIds than colors to ensure modulo arithmetic works
        const teacherIds = Array.from({length: 20}, (_, i) => `t${i}`);
        teacherIds.forEach(id => {
            const color = getTeacherColor(id);
            expect(color.startsWith('#')).toBe(true);
            // Check if it's one of the predefined colors (optional, depends on exact color list)
        });
    });
  });
});
