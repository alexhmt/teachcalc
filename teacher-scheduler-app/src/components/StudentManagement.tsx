import React, { useState, useCallback } from 'react';
import { useScheduler } from '../context/SchedulerContext';
import { Student } from '../types';
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
  Chip,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

const StudentManagement: React.FC = () => {
  const { students, groups, scheduledClasses, addStudent, updateStudent, deleteStudent } = useScheduler();
  const [open, setOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentName, setStudentName] = useState('');
  const [crmLink, setCrmLink] = useState('');

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

  const handleDelete = useCallback((id: string) => {
    const hasIndividualClasses = scheduledClasses.some(sc => sc.studentId === id);
    const studentGroups = groups.filter(g => g.studentIds.includes(id));

    let confirmMessage = 'Вы уверены, что хотите удалить этого студента?';
    if (hasIndividualClasses || studentGroups.length > 0) {
      confirmMessage += '\n\nЭто также:';
      if (studentGroups.length > 0) {
        confirmMessage += `\n- Удалит студента из ${studentGroups.length} групп(ы)`;
      }
      if (hasIndividualClasses) {
        confirmMessage += '\n- Удалит все индивидуальные занятия для этого студента';
      }
    }

    if (window.confirm(confirmMessage)) {
      deleteStudent(id);
    }
  }, [deleteStudent, scheduledClasses, groups]);

  const getStudentGroups = (studentId: string) => {
    return groups.filter(g => g.studentIds.includes(studentId));
  };

  const getIndividualClassesCount = (studentId: string) => {
    return scheduledClasses.filter(sc => sc.studentId === studentId).length;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Управление студентами</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpen}
        >
          Добавить студента
        </Button>
      </Box>

      <TableContainer component={Paper}>
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
                    <IconButton onClick={() => handleDelete(student.id)} size="small" color="error">
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
      </TableContainer>

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
    </Box>
  );
};

export default StudentManagement;
