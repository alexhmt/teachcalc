import React from 'react';
import { ScheduledClass, Teacher, Group, Student } from '../types';
import { Box, Typography, Paper, Divider } from '@mui/material';
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
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
        Расписание занятий
      </Typography>

      {classesByDay.map(({ dayName, classes }) => {
        if (classes.length === 0) return null;

        return (
          <Paper key={dayName} sx={{ p: 3, mb: 3 }} elevation={2}>
            <Typography variant="h5" gutterBottom sx={{ color: 'primary.main', mb: 2 }}>
              {dayName}
            </Typography>

            {classes.map((cls, index) => {
              const teacher = teacherMap.get(cls.teacherId);
              const group = cls.groupId ? groupMap.get(cls.groupId) : undefined;
              const student = cls.studentId ? studentMap.get(cls.studentId) : undefined;

              const startTime = format(new Date(cls.startTime), 'HH:mm');
              const endTime = format(new Date(cls.endTime), 'HH:mm');

              return (
                <Box key={cls.id}>
                  {index > 0 && <Divider sx={{ my: 2 }} />}

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', minWidth: '120px' }}>
                        {startTime} - {endTime}
                      </Typography>
                      <Typography variant="h6" sx={{ color: 'text.primary' }}>
                        {student ? (
                          <>
                            {student.name} <Typography component="span" variant="body2" sx={{ color: 'text.secondary' }}>(Индивидуальное занятие)</Typography>
                          </>
                        ) : group ? (
                          group.name
                        ) : (
                          'Неизвестно'
                        )}
                      </Typography>
                    </Box>

                    <Box sx={{ pl: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                        <strong>Преподаватель:</strong> {teacher?.name || 'Неизвестно'}
                      </Typography>

                      {group && group.studentIds && group.studentIds.length > 0 && (
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          <strong>Студенты в группе:</strong>{' '}
                          {group.studentIds
                            .map(sid => studentMap.get(sid)?.name || 'Неизвестно')
                            .join(', ')}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Paper>
        );
      })}

      {scheduledClasses.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Нет запланированных занятий
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default TextReportView;
