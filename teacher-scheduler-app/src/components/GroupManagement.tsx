import React, { useState, useCallback } from 'react';
import { useScheduler } from '../context/SchedulerContext';
import { Group } from '../types';
import {
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  SelectChangeEvent,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { CrudTableLayout, ConfirmDialog } from './shared';

const GroupManagement: React.FC = () => {
  const { groups, teachers, students, addGroup, updateGroup, deleteGroup } = useScheduler();
  const [open, setOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [groupName, setGroupName] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);

  const handleOpen = useCallback(() => {
    setOpen(true);
    setEditingGroup(null);
    setGroupName('');
    setSelectedTeacherId('');
    setSelectedStudentIds([]);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setEditingGroup(null);
    setGroupName('');
    setSelectedTeacherId('');
    setSelectedStudentIds([]);
  }, []);

  const handleEdit = useCallback((group: Group) => {
    setEditingGroup(group);
    setGroupName(group.name);
    setSelectedTeacherId(group.teacherId);
    setSelectedStudentIds(group.studentIds);
    setOpen(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!groupName.trim() || !selectedTeacherId) return;

    if (editingGroup) {
      updateGroup({
        ...editingGroup,
        name: groupName,
        teacherId: selectedTeacherId,
        studentIds: selectedStudentIds,
      });
    } else {
      const newGroup: Group = {
        id: `g${Date.now()}`,
        name: groupName,
        teacherId: selectedTeacherId,
        studentIds: selectedStudentIds,
      };
      addGroup(newGroup);
    }
    handleClose();
  }, [groupName, selectedTeacherId, selectedStudentIds, editingGroup, addGroup, updateGroup, handleClose]);

  const handleStudentChange = useCallback((event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSelectedStudentIds(typeof value === 'string' ? value.split(',') : value);
  }, []);

  const handleDeleteClick = useCallback((id: string) => {
    setGroupToDelete(id);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (groupToDelete) {
      deleteGroup(groupToDelete);
    }
    setDeleteDialogOpen(false);
    setGroupToDelete(null);
  }, [groupToDelete, deleteGroup]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setGroupToDelete(null);
  }, []);

  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher ? teacher.name : 'Неизвестно';
  };

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.name : 'Неизвестно';
  };

  return (
    <CrudTableLayout
      title="Управление группами"
      addButtonText="Добавить группу"
      onAdd={handleOpen}
    >
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Название группы</TableCell>
            <TableCell>Преподаватель</TableCell>
            <TableCell>Студенты</TableCell>
            <TableCell align="right">Действия</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {groups.map((group) => (
            <TableRow key={group.id}>
              <TableCell>{group.id}</TableCell>
              <TableCell>{group.name}</TableCell>
              <TableCell>{getTeacherName(group.teacherId)}</TableCell>
              <TableCell>
                {group.studentIds.length > 0 ? (
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {group.studentIds.map(studentId => (
                      <Chip key={studentId} label={getStudentName(studentId)} size="small" />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">Нет студентов</Typography>
                )}
              </TableCell>
              <TableCell align="right">
                <IconButton onClick={() => handleEdit(group)} color="primary">
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => handleDeleteClick(group.id)} color="error">
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
          {groups.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} align="center">
                Групп нет. Нажмите "Добавить группу" для создания.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingGroup ? 'Редактировать группу' : 'Добавить группу'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              autoFocus
              label="Название группы"
              type="text"
              fullWidth
              variant="outlined"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
            <FormControl fullWidth>
              <InputLabel>Преподаватель</InputLabel>
              <Select
                value={selectedTeacherId}
                label="Преподаватель"
                onChange={(e) => setSelectedTeacherId(e.target.value)}
              >
                <MenuItem value="">
                  <em>Выберите преподавателя</em>
                </MenuItem>
                {teachers.map((teacher) => (
                  <MenuItem key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Студенты</InputLabel>
              <Select
                multiple
                value={selectedStudentIds}
                onChange={handleStudentChange}
                input={<OutlinedInput label="Студенты" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={getStudentName(value)} size="small" />
                    ))}
                  </Box>
                )}
              >
                {students.map((student) => (
                  <MenuItem key={student.id} value={student.id}>
                    {student.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Отменить</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!groupName.trim() || !selectedTeacherId}
          >
            {editingGroup ? 'Обновить' : 'Добавить'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Удалить группу"
        message="Вы уверены, что хотите удалить эту группу? Это также удалит все запланированные занятия для этой группы."
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </CrudTableLayout>
  );
};

export default GroupManagement;
