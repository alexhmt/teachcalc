export interface Teacher {
  id: string;
  name: string;
}

export interface Group {
  id: string;
  name:string;
  teacherId: string;
  studentIds: string[];
}

export interface Student {
  id: string;
  name: string;
  crmProfileLink: string;
}

export interface ScheduledClass {
  id: string;
  groupId?: string; // Optional: for group classes
  studentId?: string; // Optional: for individual classes
  teacherId: string;
  startTime: Date; // Using Date object for time
  endTime: Date;   // Will be derived from startTime + 1 hour
}
