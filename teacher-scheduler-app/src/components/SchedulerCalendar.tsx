import React, { useState, useCallback } from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { useScheduler } from '../context/SchedulerContext';
import ClassBlock from './ClassBlock';
import ScheduleForm from './ScheduleForm';
import TextReportView from './TextReportView';
import './SchedulerCalendar.css';
import { ScheduledClass, Group as GroupType } from '../types';
import { setHours, setMinutes, setSeconds, setMilliseconds, setDay, addHours, getHours, parseISO } from 'date-fns';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  Paper,
  SelectChangeEvent,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { Add as AddIcon, Print as PrintIcon, ViewWeek as TableIcon, Description as TextIcon } from '@mui/icons-material';

const DAY_NAME_TO_INDEX: { [key: string]: number } = {
  'Воскресенье': 0, 'Понедельник': 1, 'Вторник': 2, 'Среда': 3, 'Четверг': 4, 'Пятница': 5, 'Суббота': 6,
};

const DAYS_OF_WEEK = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
const TIME_SLOTS = Array.from({ length: 13 }, (_, i) => `${String(i + 8).padStart(2, '0')}:00`);

const SchedulerCalendar: React.FC = () => {
  const { scheduledClasses, updateScheduledClass, deleteScheduledClass, teachers, groups, students } = useScheduler();
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingClass, setEditingClass] = useState<ScheduledClass | null>(null);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'text'>('table');

  const handleTeacherFilterChange = useCallback((event: SelectChangeEvent) => {
    setSelectedTeacherId(event.target.value);
  }, []);

  const handleGroupFilterChange = useCallback((event: SelectChangeEvent) => {
    setSelectedGroupId(event.target.value);
  }, []);

  const handleStudentFilterChange = useCallback((event: SelectChangeEvent) => {
    setSelectedStudentId(event.target.value);
    // When student is selected, clear group filter
    if (event.target.value) {
      setSelectedGroupId('');
    }
  }, []);

  const handleSearchQueryChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  }, []);

  const handleEditClass = useCallback((cls: ScheduledClass) => {
    setEditingClass(cls);
    setFormDialogOpen(true);
  }, []);

  const handleDeleteClass = useCallback((cls: ScheduledClass) => {
    deleteScheduledClass(cls.id);
  }, [deleteScheduledClass]);

  const handleOpenForm = useCallback(() => {
    setEditingClass(null);
    setFormDialogOpen(true);
  }, []);

  const handleFormClose = useCallback(() => {
    setFormDialogOpen(false);
    setEditingClass(null);
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleViewModeChange = useCallback((_event: React.MouseEvent<HTMLElement>, newMode: 'table' | 'text' | null) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  }, []);

  const onDragEnd = useCallback((result: DropResult) => {
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
      const updatedClassFromDrag: ScheduledClass = { ...draggedClass, startTime: newStartTime, endTime: newEndTime };
      updateScheduledClass(updatedClassFromDrag);
    }
  }, [scheduledClasses, updateScheduledClass]);

  let currentFilteredClasses = scheduledClasses;
  if (selectedTeacherId) {
    currentFilteredClasses = currentFilteredClasses.filter(cls => cls.teacherId === selectedTeacherId);
  }

  // If student is selected, show only groups where this student is enrolled
  if (selectedStudentId) {
    const studentGroupIds = groups
      .filter(g => g.studentIds.includes(selectedStudentId))
      .map(g => g.id);
    currentFilteredClasses = currentFilteredClasses.filter(cls =>
      (cls.groupId && studentGroupIds.includes(cls.groupId)) || cls.studentId === selectedStudentId
    );
  } else if (selectedGroupId) {
    // Only apply group filter if student filter is not active
    currentFilteredClasses = currentFilteredClasses.filter(cls => cls.groupId === selectedGroupId);
  }

  const groupMap = new Map<string, GroupType>(groups.map(group => [group.id, group]));
  const studentMap = new Map(students.map(student => [student.id, student]));

  return (
    <Box sx={{ p: 2 }}>
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }} className="no-print">
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Преподаватель</InputLabel>
            <Select value={selectedTeacherId} label="Преподаватель" onChange={handleTeacherFilterChange}>
              <MenuItem value="">Все</MenuItem>
              {teachers.map(teacher => (
                <MenuItem key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Группа</InputLabel>
            <Select
              value={selectedGroupId}
              label="Группа"
              onChange={handleGroupFilterChange}
              disabled={!!selectedStudentId}
            >
              <MenuItem value="">Все</MenuItem>
              {groups.map(group => (
                <MenuItem key={group.id} value={group.id}>
                  {group.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Студент</InputLabel>
            <Select value={selectedStudentId} label="Студент" onChange={handleStudentFilterChange}>
              <MenuItem value="">Все</MenuItem>
              {students.map(student => (
                <MenuItem key={student.id} value={student.id}>
                  {student.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Поиск"
            placeholder="Введите имя..."
            value={searchQuery}
            onChange={handleSearchQueryChange}
            sx={{ minWidth: 200 }}
          />

          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            aria-label="режим отображения"
            sx={{ ml: 'auto' }}
          >
            <ToggleButton value="table" aria-label="таблица">
              <TableIcon sx={{ mr: 1 }} />
              Таблица
            </ToggleButton>
            <ToggleButton value="text" aria-label="текстовый отчёт">
              <TextIcon sx={{ mr: 1 }} />
              Текст
            </ToggleButton>
          </ToggleButtonGroup>

          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
          >
            Печать
          </Button>
        </Box>
      </Paper>

      {/* Calendar Grid or Text Report */}
      {viewMode === 'table' ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="scheduler-calendar">
            <div className="header-row">
              <div className="time-col-header">Время</div>
              {DAYS_OF_WEEK.map((day) => (
                <div key={day} className="day-header-cell">
                  {day}
                </div>
              ))}
            </div>
            {TIME_SLOTS.map((timeSlot) => (
              <div key={timeSlot} className="time-row">
                <div className="time-header-cell">{timeSlot}</div>
                {DAYS_OF_WEEK.map((day) => {
                  const droppableId = `cell-${day}-${timeSlot}`;
                  const classesInSlot = currentFilteredClasses.filter((scheduledClass) => {
                    const startTime =
                      typeof scheduledClass.startTime === 'string'
                        ? parseISO(scheduledClass.startTime)
                        : scheduledClass.startTime;
                    const classHour = getHours(startTime);
                    const slotHour = parseInt(timeSlot.split(':')[0], 10);
                    const dayOfWeek = startTime.getDay();
                    const dayIndex = DAY_NAME_TO_INDEX[day];
                    return classHour === slotHour && dayOfWeek === dayIndex;
                  });

                  return (
                    <Droppable droppableId={droppableId} key={droppableId}>
                      {(provided, snapshot) => (
                        <div
                          className={`calendar-cell ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                        >
                          {classesInSlot.map((scheduledClass, index) => {
                            const group = scheduledClass.groupId ? groupMap.get(scheduledClass.groupId) : undefined;
                            const student = scheduledClass.studentId ? studentMap.get(scheduledClass.studentId) : undefined;

                            let shouldHighlight: boolean | undefined = undefined;
                            if (searchQuery.trim() !== '') {
                              const query = searchQuery.toLowerCase();
                              if (group && group.name.toLowerCase().includes(query)) {
                                shouldHighlight = true;
                              } else if (student && student.name.toLowerCase().includes(query)) {
                                shouldHighlight = true;
                              } else {
                                shouldHighlight = false;
                              }
                            }

                            return (
                              <ClassBlock
                                key={scheduledClass.id}
                                scheduledClass={scheduledClass}
                                index={index}
                                isHighlighted={shouldHighlight}
                                onEdit={handleEditClass}
                                onDelete={handleDeleteClass}
                              />
                            );
                          })}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  );
                })}
              </div>
            ))}
          </div>
        </DragDropContext>
      ) : (
        <TextReportView
          scheduledClasses={currentFilteredClasses}
          teachers={teachers}
          groups={groups}
          students={students}
        />
      )}

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
        className="no-print"
        onClick={handleOpenForm}
      >
        <AddIcon />
      </Fab>

      {/* Form Dialog */}
      <Dialog
        open={formDialogOpen}
        onClose={handleFormClose}
        maxWidth="sm"
        fullWidth
        className="no-print"
      >
        <DialogTitle>{editingClass ? 'Редактировать занятие' : 'Добавить занятие'}</DialogTitle>
        <DialogContent>
          <ScheduleForm editingClass={editingClass} onFormClose={handleFormClose} />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default SchedulerCalendar;
