import React from 'react';
import { ScheduledClass, Teacher, Group, Student } from '../types';
import { format } from 'date-fns';

interface TextReportViewProps {
  scheduledClasses: ScheduledClass[];
  teachers: Teacher[];
  groups: Group[];
  students: Student[];
}

const DAYS_OF_WEEK = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

const TextReportView: React.FC<TextReportViewProps> = ({ scheduledClasses, teachers, groups, students }) => {
  // Create maps for quick lookup
  const teacherMap = new Map(teachers.map(t => [t.id, t]));
  const groupMap = new Map(groups.map(g => [g.id, g]));
  const studentMap = new Map(students.map(s => [s.id, s]));

  // Group classes by day
  const classesByDay = DAYS_OF_WEEK.map(dayName => {
    const dayIndex = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'].indexOf(dayName);
    const dayClasses = scheduledClasses.filter(cls => {
      const classDay = new Date(cls.startTime).getDay();
      return classDay === dayIndex;
    });

    // Sort by time
    dayClasses.sort((a, b) => {
      const timeA = new Date(a.startTime).getTime();
      const timeB = new Date(b.startTime).getTime();
      return timeA - timeB;
    });

    return { dayName, classes: dayClasses };
  });

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px', fontSize: '24px', fontWeight: 'bold' }}>
        Расписание занятий
      </h1>

      {classesByDay.map(({ dayName, classes }) => {
        if (classes.length === 0) return null;

        return (
          <div key={dayName} style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1976d2', marginBottom: '15px', borderBottom: '2px solid #1976d2', paddingBottom: '5px' }}>
              {dayName}
            </h2>

            {classes.map((cls, index) => {
              const teacher = teacherMap.get(cls.teacherId);
              const group = cls.groupId ? groupMap.get(cls.groupId) : undefined;
              const student = cls.studentId ? studentMap.get(cls.studentId) : undefined;

              const startTime = format(new Date(cls.startTime), 'HH:mm');
              const endTime = format(new Date(cls.endTime), 'HH:mm');

              return (
                <div key={cls.id} style={{ marginBottom: '15px', paddingBottom: '10px', borderBottom: index < classes.length - 1 ? '1px solid #e0e0e0' : 'none' }}>
                  <div style={{ marginBottom: '5px' }}>
                    <strong style={{ fontSize: '16px' }}>{startTime} - {endTime}</strong>
                    <span style={{ marginLeft: '15px', fontSize: '16px' }}>
                      {student ? (
                        <>
                          <strong>{student.name}</strong> <span style={{ color: '#666', fontSize: '14px' }}>(Индивидуальное)</span>
                        </>
                      ) : group ? (
                        <strong>{group.name}</strong>
                      ) : (
                        <strong>Неизвестно</strong>
                      )}
                    </span>
                  </div>

                  <div style={{ marginLeft: '20px', fontSize: '14px', color: '#555' }}>
                    <div style={{ marginBottom: '3px' }}>
                      Преподаватель: {teacher?.name || 'Неизвестно'}
                    </div>

                    {group && group.studentIds && group.studentIds.length > 0 && (
                      <div style={{ color: '#666', fontSize: '13px' }}>
                        Студенты: {group.studentIds
                          .map(sid => studentMap.get(sid)?.name || 'Неизвестно')
                          .join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {scheduledClasses.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999', fontSize: '16px' }}>
          Нет запланированных занятий
        </div>
      )}
    </div>
  );
};

export default TextReportView;
