import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { ScheduledClass } from '../types';
import { getTeacherColor } from '../utils/schedulerUtils';
import { parseISO } from 'date-fns';

interface ClassBlockProps {
  scheduledClass: ScheduledClass;
  index: number;
  isHighlighted?: boolean;
  onEdit?: (scheduledClass: ScheduledClass) => void; // New prop for edit callback
}

const ClassBlock: React.FC<ClassBlockProps> = ({ scheduledClass, index, isHighlighted, onEdit }) => {
  const teacherColor = getTeacherColor(scheduledClass.teacherId);

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
            <div><strong>Group:</strong> {scheduledClass.groupId} (T: {scheduledClass.teacherId})</div>
            <div>{startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        );
      }}
    </Draggable>
  );
};

export default ClassBlock;
