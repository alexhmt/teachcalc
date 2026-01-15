import React, { useState, useCallback } from 'react';
import { useScheduler } from '../context/SchedulerContext';
import { Student } from '../types';
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
  Chip,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { CrudTableLayout, ConfirmDialog } from './shared';

const StudentManagement: React.FC = () => {
  const { students, groups, scheduledClasses, addStudent, updateStudent, deleteStudent } = useScheduler();
  const [open, setOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentName, setStudentName] = useState('');
  const [crmLink, setCrmLink] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState('');

  const handleOpen = useCallback(() => {
    setOpen(true);
    setEditingStudent(null);
    setStudentName('');
    setCrmLink('');
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setEditingStudent(null);
    setStudentName('');
    setCrmLink('');
  }, []);

  const handleEdit = useCallback((student: Student) => {
    setEditingStudent(student);
    setStudentName(student.name);
    setCrmLink(student.crmProfileLink);
    setOpen(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!studentName.trim()) return;

    if (editingStudent) {
      updateStudent({
        ...editingStudent,
        name: studentName,
        crmProfileLink: crmLink,
      });
    } else {
      const newStudent: Student = {
        id: `s${Date.now()}`,
        name: studentName,
        crmProfileLink: crmLink,
      };
      addStudent(newStudent);
    }
    handleClose();
  }, [studentName, crmLink, editingStudent, addStudent, updateStudent, handleClose]);

  const handleDeleteClick = useCallback((id: string) => {
    const hasIndividualClasses = scheduledClasses.some(sc => sc.studentId === id);
    const studentGroups = groups.filter(g => g.studentIds.includes(id));

    let message = 'Вы уверены, что хотите удалить этого студента?';
    if (hasIndividualClasses || studentGroups.length > 0) {
      message += '\n\nЭто также:';
      if (studentGroups.length > 0) {
        message += `\n- Удалит студента из ${studentGroups.length} групп(ы)`;
      }
      if (hasIndividualClasses) {
        message += '\n- Удалит все индивидуальные занятия для этого студента';
      }
    }

    setDeleteMessage(message);
    setStudentToDelete(id);
    setDeleteDialogOpen(true);
  }, [scheduledClasses, groups]);

  const handleDeleteConfirm = useCallback(() => {
    if (studentToDelete) {
      deleteStudent(studentToDelete);
    }
    setDeleteDialogOpen(false);
    setStudentToDelete(null);
  }, [studentToDelete, deleteStudent]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setStudentToDelete(null);
  }, []);

  const getStudentGroups = (studentId: string) => {
    return groups.filter(g => g.studentIds.includes(studentId));
  };

  const getIndividualClassesCount = (studentId: string) => {
    return scheduledClasses.filter(sc => sc.studentId === studentId).length;
  };

  return (
    <CrudTableLayout
      title="Управление студентами"
      addButtonText="Добавить студента"
      onAdd={handleOpen}
    >
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Имя</TableCell>
            <TableCell>Ссылка на профиль CRM</TableCell>
            <TableCell>Группы</TableCell>
            <TableCell>Индивидуальные занятия</TableCell>
            <TableCell align="right">Действия</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {students.map((student) => {
            const studentGroups = getStudentGroups(student.id);
            const individualCount = getIndividualClassesCount(student.id);

            return (
              <TableRow key={student.id}>
                <TableCell>{student.name}</TableCell>
                <TableCell>
                  {student.crmProfileLink ? (
                    <a href={student.crmProfileLink} target="_blank" rel="noopener noreferrer">
                      Посмотреть профиль
                    </a>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  {studentGroups.length > 0 ? (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {studentGroups.map(group => (
                        <Chip key={group.id} label={group.name} size="small" />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">-</Typography>
                  )}
                </TableCell>
                <TableCell>
                  {individualCount > 0 ? (
                    <Chip label={`${individualCount} занятий`} size="small" color="primary" />
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleEdit(student)} size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDeleteClick(student.id)} size="small" color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            );
          })}
          {students.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} align="center">
                <Typography variant="body2" color="text.secondary">
                  Студентов нет. Нажмите "Добавить студента" для создания.
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingStudent ? 'Редактировать студента' : 'Добавить студента'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Имя студента"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              fullWidth
              required
              autoFocus
            />
            <TextField
              label="Ссылка на профиль CRM (необязательно)"
              value={crmLink}
              onChange={(e) => setCrmLink(e.target.value)}
              fullWidth
              placeholder="https://crm.example.com/student/123"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Отменить</Button>
          <Button onClick={handleSave} variant="contained" disabled={!studentName.trim()}>
            {editingStudent ? 'Сохранить' : 'Добавить'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Удалить студента"
        message={deleteMessage}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </CrudTableLayout>
  );
};

export default StudentManagement;
