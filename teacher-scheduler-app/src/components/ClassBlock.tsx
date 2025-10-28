import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { ScheduledClass } from '../types';
import { getTeacherColor } from '../utils/schedulerUtils';
import { parseISO } from 'date-fns';
import { useScheduler } from '../context/SchedulerContext';

interface ClassBlockProps {
  scheduledClass: ScheduledClass;
  index: number;
  isHighlighted?: boolean;
  onEdit?: (scheduledClass: ScheduledClass) => void; // New prop for edit callback
}

const ClassBlock: React.FC<ClassBlockProps> = React.memo(({ scheduledClass, index, isHighlighted, onEdit }) => {
  const { teachers, groups, students } = useScheduler();
  const teacherColor = getTeacherColor(scheduledClass.teacherId);

  const teacher = teachers.find(t => t.id === scheduledClass.teacherId);
  const group = scheduledClass.groupId ? groups.find(g => g.id === scheduledClass.groupId) : undefined;
  const student = scheduledClass.studentId ? students.find(s => s.id === scheduledClass.studentId) : undefined;

  const startTime = typeof scheduledClass.startTime === 'string'
    ? parseISO(scheduledClass.startTime)
    : scheduledClass.startTime;
  const endTime = typeof scheduledClass.endTime === 'string'
    ? parseISO(scheduledClass.endTime)
    : scheduledClass.endTime;

  const baseStyle: React.CSSProperties = {
    userSelect: 'none',
    padding: '8px',
    margin: '0 0 4px 0',
    minHeight: '40px',
    fontSize: '0.9em',
    borderLeft: `5px solid ${teacherColor}`,
    backgroundColor: '#f9f9f9',
    color: '#333',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    borderRadius: '4px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    transition: 'opacity 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
    cursor: onEdit ? 'pointer' : 'grab', // Change cursor if editable
  };

  let dynamicStyle: React.CSSProperties = {};
  if (isHighlighted === false) {
    dynamicStyle.opacity = 0.4;
  } else if (isHighlighted === true) {
    dynamicStyle.boxShadow = `0 0 8px ${teacherColor}`;
  }

  const handleOnClick = () => {
    if (onEdit) {
      onEdit(scheduledClass);
    }
  };

  return (
    <Draggable draggableId={scheduledClass.id} index={index}>
      {(provided, snapshot) => {
        const draggingStyle: React.CSSProperties = snapshot.isDragging
        ? {
            backgroundColor: '#555',
            color: 'white',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            cursor: 'grabbing',
          }
        : {};

        return (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={{
              ...baseStyle,
              ...dynamicStyle,
              ...draggingStyle,
              ...provided.draggableProps.style,
            }}
            onClick={handleOnClick} // Add onClick handler
          >
            {/* Display individual student or group */}
            {student ? (
              <div><strong>{student.name}</strong> <span style={{ fontSize: '0.85em', color: '#666', fontWeight: 'normal' }}>(Индивидуальное)</span></div>
            ) : group ? (
              <div><strong>{group.name}</strong></div>
            ) : (
              <div><strong>Неизвестно</strong></div>
            )}
            <div style={{ fontSize: '0.85em', color: '#666' }}>Преподаватель: {teacher?.name || 'Неизвестно'}</div>
            <div style={{ fontSize: '0.85em', marginTop: '2px' }}>
              {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        );
      }}
    </Draggable>
  );
});

ClassBlock.displayName = 'ClassBlock';

export default ClassBlock;
