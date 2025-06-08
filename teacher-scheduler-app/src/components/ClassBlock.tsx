import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { ScheduledClass } from '../types';
import { getTeacherColor } from '../utils/schedulerUtils';
import { parseISO } from 'date-fns';

interface ClassBlockProps {
  scheduledClass: ScheduledClass;
  index: number;
  isHighlighted?: boolean; // New prop for highlighting
}

const ClassBlock: React.FC<ClassBlockProps> = ({ scheduledClass, index, isHighlighted }) => {
  const teacherColor = getTeacherColor(scheduledClass.teacherId);

  const startTime = typeof scheduledClass.startTime === 'string'
    ? parseISO(scheduledClass.startTime)
    : scheduledClass.startTime;
  const endTime = typeof scheduledClass.endTime === 'string'
    ? parseISO(scheduledClass.endTime)
    : scheduledClass.endTime;

  // Base style
  const style: React.CSSProperties = {
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
    transition: 'opacity 0.3s ease-in-out, box-shadow 0.3s ease-in-out', // Smooth transition for opacity/shadow
  };

  // Style when dragging
  if (Draggable.name && React.useContext(Draggable.draggableId)?.isDragging) { // A bit of a hack to check if dragging, snapshot is better
    // The snapshot is provided by the Draggable render prop, this is a more direct way.
  }

  // Apply highlighting: if isHighlighted is false (meaning it's dimmed), reduce opacity.
  // If isHighlighted is true or undefined (search not active), opacity is 1.
  if (isHighlighted === false) { // Explicitly false means it should be dimmed
    style.opacity = 0.4;
  } else if (isHighlighted === true) { // Explicitly true means it's a search match
    style.boxShadow = `0 0 8px ${teacherColor}`; // Use teacher color for highlight shadow
  }

  // Note: The snapshot from Draggable should ideally be used for dragging styles.
  // The above Draggable.name check is not standard. Let's rely on snapshot.

  return (
    <Draggable draggableId={scheduledClass.id} index={index}>
      {(provided, snapshot) => {
        const draggingStyle: React.CSSProperties = snapshot.isDragging
        ? {
            backgroundColor: '#555',
            color: 'white',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          }
        : {};

        return (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={{
              ...style, // Base style (includes highlight/dimming)
              ...draggingStyle, // Override with dragging style if applicable
              ...provided.draggableProps.style, // Style from dnd library
            }}
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
