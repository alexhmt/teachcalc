import React, { useState, useEffect } from 'react';
import { useScheduler } from '../context/SchedulerContext';
import { ScheduledClass } from '../types';
import { set, addHours, setDay as dfnsSetDay, getDay as dfnsGetDay, format as dfnsFormat, parseISO } from 'date-fns';
import './ScheduleForm.css';

const DAYS_OF_WEEK_OPTIONS = [
  { value: 1, label: 'Понедельник' }, { value: 2, label: 'Вторник' }, { value: 3, label: 'Среда' },
  { value: 4, label: 'Четверг' }, { value: 5, label: 'Пятница' }, { value: 6, label: 'Суббота' },
  { value: 0, label: 'Воскресенье' },
];

const TIME_SLOTS_OPTIONS = Array.from({ length: 13 }, (_, i) => {
  const hour = i + 8;
  return `${String(hour).padStart(2, '0')}:00`;
});

interface ScheduleFormProps {
  editingClass: ScheduledClass | null;
  onFormClose: () => void;
  prefilledDay?: number;
  prefilledTime?: string;
}

const ScheduleForm: React.FC<ScheduleFormProps> = ({ editingClass, onFormClose, prefilledDay, prefilledTime }) => {
  const { teachers, groups, students, addScheduledClass, updateScheduledClass } = useScheduler();

  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [classType, setClassType] = useState<'group' | 'individual'>('group');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [selectedTime, setSelectedTime] = useState<string>(TIME_SLOTS_OPTIONS[0]);

  const isEditMode = !!editingClass;

  useEffect(() => {
    if (editingClass) {
      const startTime = typeof editingClass.startTime === 'string' ? parseISO(editingClass.startTime) : editingClass.startTime;

      setSelectedTeacherId(editingClass.teacherId);

      if (editingClass.groupId) {
        setClassType('group');
        setSelectedGroupId(editingClass.groupId);
        setSelectedStudentId('');
      } else if (editingClass.studentId) {
        setClassType('individual');
        setSelectedStudentId(editingClass.studentId);
        setSelectedGroupId('');
      }

      setSelectedDay(dfnsGetDay(startTime));
      setSelectedTime(dfnsFormat(startTime, 'HH:mm'));
    } else {
      setSelectedTeacherId('');
      setClassType('group');
      setSelectedGroupId('');
      setSelectedStudentId('');
      setSelectedDay(prefilledDay !== undefined ? prefilledDay : 1);
      setSelectedTime(prefilledTime !== undefined ? prefilledTime : TIME_SLOTS_OPTIONS[0]);
    }
  }, [editingClass, prefilledDay, prefilledTime]);

  const filteredGroups = selectedTeacherId
    ? groups.filter(group => group.teacherId === selectedTeacherId)
    : groups;

  useEffect(() => {
    if (selectedTeacherId && selectedGroupId) {
      const selectedGroup = groups.find(g => g.id === selectedGroupId);
      if (selectedGroup && selectedGroup.teacherId !== selectedTeacherId) {
        setSelectedGroupId('');
      }
    }
  }, [selectedTeacherId, selectedGroupId, groups]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedTeacherId) {
      alert('Пожалуйста, выберите преподавателя.');
      return;
    }
    if (classType === 'group' && !selectedGroupId) {
      alert('Пожалуйста, выберите группу.');
      return;
    }
    if (classType === 'individual' && !selectedStudentId) {
      alert('Пожалуйста, выберите студента.');
      return;
    }

    let baseDate = new Date();
    if (isEditMode && editingClass) {
      baseDate = typeof editingClass.startTime === 'string' ? parseISO(editingClass.startTime) : editingClass.startTime;
    }

    let newStartTime = dfnsSetDay(baseDate, selectedDay, { weekStartsOn: 1 });
    const [hour, minute] = selectedTime.split(':').map(Number);
    newStartTime = set(newStartTime, { hours: hour, minutes: minute, seconds: 0, milliseconds: 0 });
    const newEndTime = addHours(newStartTime, 1);

    if (isEditMode && editingClass) {
      const updatedClassData: ScheduledClass = {
        ...editingClass,
        teacherId: selectedTeacherId,
        groupId: classType === 'group' ? selectedGroupId : undefined,
        studentId: classType === 'individual' ? selectedStudentId : undefined,
        startTime: newStartTime,
        endTime: newEndTime,
      };
      updateScheduledClass(updatedClassData);
    } else {
      const newClassData: Omit<ScheduledClass, 'id'> = {
        teacherId: selectedTeacherId,
        groupId: classType === 'group' ? selectedGroupId : undefined,
        studentId: classType === 'individual' ? selectedStudentId : undefined,
        startTime: newStartTime,
        endTime: newEndTime,
      };
      addScheduledClass(newClassData as ScheduledClass);
    }
    onFormClose();
  };

  return (
    <form onSubmit={handleSubmit} className="schedule-form">
      <h3>{isEditMode ? 'Редактировать занятие' : 'Создать занятие'}</h3>

      <div className="schedule-form__field">
        <label htmlFor="teacher-select" className="schedule-form__label">Преподаватель:</label>
        <select
          id="teacher-select"
          value={selectedTeacherId}
          onChange={e => setSelectedTeacherId(e.target.value)}
          required
          className="schedule-form__select"
        >
          <option value="" disabled={isEditMode}>Выберите преподавателя</option>
          {teachers.map(teacher => (
            <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
          ))}
        </select>
      </div>

      <div className="schedule-form__field">
        <label className="schedule-form__label">Тип занятия:</label>
        <div className="schedule-form__radio-group">
          <label className="schedule-form__radio-label">
            <input
              type="radio"
              value="group"
              checked={classType === 'group'}
              onChange={e => setClassType(e.target.value as 'group' | 'individual')}
            />
            Групповое занятие
          </label>
          <label className="schedule-form__radio-label">
            <input
              type="radio"
              value="individual"
              checked={classType === 'individual'}
              onChange={e => setClassType(e.target.value as 'group' | 'individual')}
            />
            Индивидуальное занятие
          </label>
        </div>
      </div>

      {classType === 'group' ? (
        <div className="schedule-form__field">
          <label htmlFor="group-select" className="schedule-form__label">Группа:</label>
          <select
            id="group-select"
            value={selectedGroupId}
            onChange={e => setSelectedGroupId(e.target.value)}
            required
            className="schedule-form__select"
          >
            <option value="" disabled={isEditMode}>
              {selectedTeacherId ? 'Выберите группу' : 'Сначала выберите преподавателя'}
            </option>
            {filteredGroups.map(group => (
              <option key={group.id} value={group.id}>{group.name}</option>
            ))}
          </select>
        </div>
      ) : (
        <div className="schedule-form__field">
          <label htmlFor="student-select" className="schedule-form__label">Студент:</label>
          <select
            id="student-select"
            value={selectedStudentId}
            onChange={e => setSelectedStudentId(e.target.value)}
            required
            className="schedule-form__select"
          >
            <option value="" disabled={isEditMode}>Выберите студента</option>
            {students.map(student => (
              <option key={student.id} value={student.id}>{student.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="schedule-form__field">
        <label htmlFor="day-select" className="schedule-form__label">День недели:</label>
        <select
          id="day-select"
          value={selectedDay}
          onChange={e => setSelectedDay(parseInt(e.target.value, 10))}
          required
          className="schedule-form__select"
        >
          {DAYS_OF_WEEK_OPTIONS.map(day => (
            <option key={day.value} value={day.value}>{day.label}</option>
          ))}
        </select>
      </div>

      <div className="schedule-form__field">
        <label htmlFor="time-select" className="schedule-form__label">Время:</label>
        <select
          id="time-select"
          value={selectedTime}
          onChange={e => setSelectedTime(e.target.value)}
          required
          className="schedule-form__select"
        >
          {TIME_SLOTS_OPTIONS.map(time => (
            <option key={time} value={time}>{time}</option>
          ))}
        </select>
      </div>

      <button type="submit" className="schedule-form__button">
        {isEditMode ? 'Обновить' : 'Создать'}
      </button>

      {isEditMode && (
        <button type="button" onClick={onFormClose} className="schedule-form__button schedule-form__button--cancel">
          Отменить
        </button>
      )}
    </form>
  );
};

export default ScheduleForm;
