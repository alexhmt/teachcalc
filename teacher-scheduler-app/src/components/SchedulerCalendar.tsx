import React, { useState } from 'react';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import { useScheduler } from '../context/SchedulerContext';
import ClassBlock from './ClassBlock';
import './SchedulerCalendar.css';
import { ScheduledClass, Group as GroupType } from '../types'; // Import GroupType
import { setHours, setMinutes, setSeconds, setMilliseconds, setDay, addHours, getHours, isSameDay, parseISO } from 'date-fns';

const DAY_NAME_TO_INDEX: { [key: string]: number } = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6,
};

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = Array.from({ length: 13 }, (_, i) => `${String(i + 8).padStart(2, '0')}:00`);

const SchedulerCalendar: React.FC = () => {
  const { scheduledClasses, updateScheduledClass, teachers, groups } = useScheduler();
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>(""); // State for search query

  const handleTeacherFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTeacherId(event.target.value === "" ? null : event.target.value);
  };

  const handleGroupFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedGroupId(event.target.value === "" ? null : event.target.value);
  };

  const handleSearchQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => { // Handler for search query
    setSearchQuery(event.target.value);
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) return;

    const draggedClass = scheduledClasses.find(sc => sc.id === draggableId);
    if (!draggedClass) return;

    if (destination.droppableId.startsWith('cell-')) {
      const [, dayName, timeStr] = destination.droppableId.split('-');
      const hour = parseInt(timeStr.split(':')[0], 10);
      const dayIndex = DAY_NAME_TO_INDEX[dayName];
      if (dayIndex === undefined || isNaN(hour)) return;

      let newStartTime = new Date(draggedClass.startTime);
      newStartTime = setDay(newStartTime, dayIndex, { weekStartsOn: 1 });
      newStartTime = setHours(newStartTime, hour);
      newStartTime = setMinutes(newStartTime, 0);
      newStartTime = setSeconds(newStartTime, 0);
      newStartTime = setMilliseconds(newStartTime, 0);
      const newEndTime = addHours(newStartTime, 1);
      const updatedClass: ScheduledClass = { ...draggedClass, startTime: newStartTime, endTime: newEndTime };
      updateScheduledClass(updatedClass);
    }
  };

  let currentFilteredClasses = scheduledClasses;
  if (selectedTeacherId) {
    currentFilteredClasses = currentFilteredClasses.filter(cls => cls.teacherId === selectedTeacherId);
  }
  if (selectedGroupId) {
    currentFilteredClasses = currentFilteredClasses.filter(cls => cls.groupId === selectedGroupId);
  }

  // Create a map for quick group lookup
  const groupMap = new Map<string, GroupType>(groups.map(group => [group.id, group]));

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '20px', padding: '10px', border: '1px solid #eee', borderRadius: '4px', alignItems: 'center' }}>
        <div>
          <label htmlFor="teacher-filter" style={{ marginRight: '10px', fontWeight: 'bold' }}>Teacher:</label>
          <select id="teacher-filter" value={selectedTeacherId || ""} onChange={handleTeacherFilterChange} style={{padding: '8px', borderRadius: '4px', border: '1px solid #ccc'}}>
            <option value="">All</option>
            {teachers.map(teacher => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="group-filter" style={{ marginRight: '10px', fontWeight: 'bold' }}>Group:</label>
          <select id="group-filter" value={selectedGroupId || ""} onChange={handleGroupFilterChange} style={{padding: '8px', borderRadius: '4px', border: '1px solid #ccc'}}>
            <option value="">All</option>
            {groups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
          </select>
        </div>
        <div> {/* Search Input */}
          <label htmlFor="search-query" style={{ marginRight: '10px', fontWeight: 'bold' }}>Search Group:</label>
          <input
            type="text"
            id="search-query"
            placeholder="Enter group name..."
            value={searchQuery}
            onChange={handleSearchQueryChange}
            style={{padding: '8px', borderRadius: '4px', border: '1px solid #ccc'}}
          />
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="scheduler-calendar">
          <div className="header-row">
            <div className="time-col-header"></div>
            {DAYS_OF_WEEK.map(day => <div key={day} className="day-header-cell">{day}</div>)}
          </div>

          {TIME_SLOTS.map(time => (
            <div key={time} className="time-row">
              <div className="time-header-cell">{time}</div>
              {DAYS_OF_WEEK.map(day => {
                const cellId = `cell-${day}-${time}`;
                const hourForCell = parseInt(time.split(':')[0], 10);

                const classesInCell = currentFilteredClasses.filter(sc => {
                  const classStartTime = typeof sc.startTime === 'string' ? parseISO(sc.startTime) : sc.startTime;
                  const classDayIndex = classStartTime.getDay();
                  const targetDayIndex = DAY_NAME_TO_INDEX[day];
                  return classDayIndex === targetDayIndex && getHours(classStartTime) === hourForCell;
                });

                return (
                  <Droppable key={cellId} droppableId={cellId}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="calendar-cell"
                        data-day={day} data-time={time}
                        style={{ background: snapshot.isDraggingOver ? 'lightblue' : undefined, minHeight: '60px' }}
                      >
                        {classesInCell.map((sc, index) => {
                          const group = groupMap.get(sc.groupId);
                          let isHighlighted: boolean | undefined = undefined;
                          if (searchQuery.trim() !== "") {
                            isHighlighted = group?.name.toLowerCase().includes(searchQuery.toLowerCase()) ?? false;
                          }
                          return <ClassBlock key={sc.id} scheduledClass={sc} index={index} isHighlighted={isHighlighted} />;
                        })}
                        {provided.placeholder}
                        {classesInCell.length === 0 && snapshot.isDraggingOver && <div style={{ height: '100%', width: '100%', backgroundColor: 'rgba(0,0,255,0.1)' }}></div>}
                        {classesInCell.length === 0 && !snapshot.isDraggingOver && <div style={{fontSize: '0.8em', color: '#aaa', paddingTop: '20px'}}>+</div>}
                      </div>
                    )}
                  </Droppable>
                );
              })}
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default SchedulerCalendar;
