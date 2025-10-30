import React, { useState, useCallback } from 'react';
import { useScheduler } from '../context/SchedulerContext';
import { Teacher } from '../types';
import {
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import ConfirmDialog from './ConfirmDialog';
import { useSnackbar } from 'notistack';

const TeacherManagement: React.FC = () => {
  const { teachers, groups, scheduledClasses, addTeacher, updateTeacher, deleteTeacher } = useScheduler();
  const { enqueueSnackbar } = useSnackbar();
  const [open, setOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [teacherName, setTeacherName] = useState('');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<string | null>(null);

  const handleOpen = useCallback(() => {
    setOpen(true);
    setEditingTeacher(null);
    setTeacherName('');
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setEditingTeacher(null);
    setTeacherName('');
  }, []);

  const handleEdit = useCallback((teacher: Teacher) => {
    setEditingTeacher(teacher);
    setTeacherName(teacher.name);
    setOpen(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!teacherName.trim()) {
      enqueueSnackbar('Имя преподавателя не может быть пустым', { variant: 'error' });
      return;
    }

    // Check for duplicates
    const isDuplicate = teachers.some(
      t => t.name.trim().toLowerCase() === teacherName.trim().toLowerCase() && t.id !== editingTeacher?.id
    );
    if (isDuplicate) {
      enqueueSnackbar('Преподаватель с таким именем уже существует', { variant: 'error' });
      return;
    }

    if (editingTeacher) {
      updateTeacher({ ...editingTeacher, name: teacherName.trim() });
    } else {
      const newTeacher: Teacher = {
        id: `t${Date.now()}`,
        name: teacherName.trim(),
      };
      addTeacher(newTeacher);
    }
    handleClose();
  }, [teacherName, editingTeacher, teachers, addTeacher, updateTeacher, handleClose, enqueueSnackbar]);

  const handleDeleteClick = useCallback((id: string) => {
    setTeacherToDelete(id);
    setConfirmDeleteOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (teacherToDelete) {
      deleteTeacher(teacherToDelete);
      setConfirmDeleteOpen(false);
      setTeacherToDelete(null);
    }
  }, [teacherToDelete, deleteTeacher]);

  const handleDeleteCancel = useCallback(() => {
    setConfirmDeleteOpen(false);
    setTeacherToDelete(null);
  }, []);

  const getDeleteDetails = useCallback((teacherId: string) => {
    const teacherGroups = groups.filter(g => g.teacherId === teacherId);
    const teacherClasses = scheduledClasses.filter(c => c.teacherId === teacherId);
    const details: string[] = [];
    if (teacherGroups.length > 0) {
      details.push(`${teacherGroups.length} групп(ы)`);
    }
    if (teacherClasses.length > 0) {
      details.push(`${teacherClasses.length} занятий`);
    }
    return details;
  }, [groups, scheduledClasses]);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Управление преподавателями</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpen}
        >
          Добавить преподавателя
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Имя</TableCell>
              <TableCell>Групп</TableCell>
              <TableCell>Занятий</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {teachers.map((teacher) => {
              const teacherGroups = groups.filter(g => g.teacherId === teacher.id).length;
              const teacherClasses = scheduledClasses.filter(c => c.teacherId === teacher.id).length;
              return (
                <TableRow key={teacher.id}>
                  <TableCell>{teacher.id}</TableCell>
                  <TableCell>{teacher.name}</TableCell>
                  <TableCell>{teacherGroups}</TableCell>
                  <TableCell>{teacherClasses}</TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => handleEdit(teacher)} color="primary">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteClick(teacher.id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
            {teachers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Преподавателей нет. Нажмите "Добавить преподавателя" для создания.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTeacher ? 'Редактировать преподавателя' : 'Добавить преподавателя'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Имя преподавателя"
            type="text"
            fullWidth
            variant="outlined"
            value={teacherName}
            onChange={(e) => setTeacherName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSave();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Отменить</Button>
          <Button onClick={handleSave} variant="contained" disabled={!teacherName.trim()}>
            {editingTeacher ? 'Обновить' : 'Добавить'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Удалить преподавателя?"
        message={`Вы уверены, что хотите удалить преподавателя "${teachers.find(t => t.id === teacherToDelete)?.name}"?`}
        details={teacherToDelete ? getDeleteDetails(teacherToDelete) : []}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </Box>
  );
};

export default TeacherManagement;
