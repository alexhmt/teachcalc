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
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Upload as UploadIcon } from '@mui/icons-material';
import ConfirmDialog from './ConfirmDialog';
import { useSnackbar } from 'notistack';

const StudentManagement: React.FC = () => {
  const { students, groups, scheduledClasses, addStudent, updateStudent, deleteStudent } = useScheduler();
  const { enqueueSnackbar } = useSnackbar();
  const [open, setOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentName, setStudentName] = useState('');
  const [crmLink, setCrmLink] = useState('');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [bulkImportText, setBulkImportText] = useState('');

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
    if (!studentName.trim()) {
      enqueueSnackbar('Имя студента не может быть пустым', { variant: 'error' });
      return;
    }

    // Check for duplicates
    const isDuplicate = students.some(
      s => s.name.trim().toLowerCase() === studentName.trim().toLowerCase() && s.id !== editingStudent?.id
    );
    if (isDuplicate) {
      enqueueSnackbar('Студент с таким именем уже существует', { variant: 'error' });
      return;
    }

    if (editingStudent) {
      updateStudent({
        ...editingStudent,
        name: studentName.trim(),
        crmProfileLink: crmLink.trim(),
      });
    } else {
      const newStudent: Student = {
        id: `s${Date.now()}`,
        name: studentName.trim(),
        crmProfileLink: crmLink.trim(),
      };
      addStudent(newStudent);
    }
    handleClose();
  }, [studentName, crmLink, editingStudent, students, addStudent, updateStudent, handleClose, enqueueSnackbar]);

  const handleDeleteClick = useCallback((id: string) => {
    setStudentToDelete(id);
    setConfirmDeleteOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (studentToDelete) {
      deleteStudent(studentToDelete);
      setConfirmDeleteOpen(false);
      setStudentToDelete(null);
    }
  }, [studentToDelete, deleteStudent]);

  const handleDeleteCancel = useCallback(() => {
    setConfirmDeleteOpen(false);
    setStudentToDelete(null);
  }, []);

  const getDeleteDetails = useCallback((studentId: string) => {
    const studentGroups = groups.filter(g => g.studentIds.includes(studentId));
    const individualClasses = scheduledClasses.filter(sc => sc.studentId === studentId);
    const details: string[] = [];
    if (studentGroups.length > 0) {
      details.push(`${studentGroups.length} групп(ы)`);
    }
    if (individualClasses.length > 0) {
      details.push(`${individualClasses.length} индивидуальных занятий`);
    }
    return details;
  }, [groups, scheduledClasses]);

  const getStudentGroups = (studentId: string) => {
    return groups.filter(g => g.studentIds.includes(studentId));
  };

  const getIndividualClassesCount = (studentId: string) => {
    return scheduledClasses.filter(sc => sc.studentId === studentId).length;
  };

  const handleBulkImportOpen = useCallback(() => {
    setBulkImportOpen(true);
    setBulkImportText('');
  }, []);

  const handleBulkImportClose = useCallback(() => {
    setBulkImportOpen(false);
    setBulkImportText('');
  }, []);

  const handleBulkImportSave = useCallback(() => {
    if (!bulkImportText.trim()) {
      enqueueSnackbar('Введите список студентов', { variant: 'error' });
      return;
    }

    const lines = bulkImportText.split('\n').filter(line => line.trim());
    let addedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      // Parse line: "ФИО" or "ФИО, URL" or "ФИО|URL"
      let name = '';
      let url = '';

      if (trimmedLine.includes('|')) {
        const parts = trimmedLine.split('|').map(p => p.trim());
        name = parts[0];
        url = parts[1] || '';
      } else if (trimmedLine.includes(',')) {
        const parts = trimmedLine.split(',').map(p => p.trim());
        name = parts[0];
        url = parts[1] || '';
      } else {
        name = trimmedLine;
      }

      if (!name) {
        errors.push(`Строка ${index + 1}: отсутствует ФИО`);
        skippedCount++;
        return;
      }

      // Check for duplicate
      const isDuplicate = students.some(
        s => s.name.trim().toLowerCase() === name.toLowerCase()
      );

      if (isDuplicate) {
        errors.push(`Строка ${index + 1}: студент "${name}" уже существует`);
        skippedCount++;
        return;
      }

      // Add student
      const newStudent: Student = {
        id: `s${Date.now()}_${index}`,
        name,
        crmProfileLink: url,
      };
      addStudent(newStudent);
      addedCount++;
    });

    // Show results
    if (addedCount > 0) {
      enqueueSnackbar(`Добавлено студентов: ${addedCount}`, { variant: 'success' });
    }
    if (skippedCount > 0) {
      enqueueSnackbar(`Пропущено: ${skippedCount}`, { variant: 'warning' });
    }
    if (errors.length > 0 && errors.length <= 3) {
      errors.forEach(error => {
        enqueueSnackbar(error, { variant: 'error' });
      });
    } else if (errors.length > 3) {
      enqueueSnackbar(`Ошибок: ${errors.length}. Проверьте формат данных.`, { variant: 'error' });
    }

    if (addedCount > 0) {
      handleBulkImportClose();
    }
  }, [bulkImportText, students, addStudent, enqueueSnackbar, handleBulkImportClose]);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Управление студентами</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={handleBulkImportOpen}
          >
            Массовое добавление
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpen}
          >
            Добавить студента
          </Button>
        </Box>
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
                    <IconButton onClick={() => handleEdit(student)} color="primary">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteClick(student.id)} color="error">
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

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Удалить студента?"
        message={`Вы уверены, что хотите удалить студента "${students.find(s => s.id === studentToDelete)?.name}"?`}
        details={studentToDelete ? getDeleteDetails(studentToDelete) : []}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      {/* Bulk Import Dialog */}
      <Dialog open={bulkImportOpen} onClose={handleBulkImportClose} maxWidth="md" fullWidth>
        <DialogTitle>Массовое добавление студентов</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Введите список студентов, каждый студент на новой строке.
              <br />
              <strong>Формат:</strong>
              <br />
              • Только ФИО: <code>Иванов Иван Иванович</code>
              <br />
              • ФИО с CRM URL: <code>Иванов Иван Иванович, https://crm.example.com/123</code>
              <br />
              • Или с разделителем |: <code>Иванов Иван Иванович | https://crm.example.com/123</code>
            </Typography>
            <TextField
              label="Список студентов"
              multiline
              rows={12}
              fullWidth
              value={bulkImportText}
              onChange={(e) => setBulkImportText(e.target.value)}
              placeholder={`Иванов Иван Иванович\nПетров Петр Петрович, https://crm.example.com/123\nСидоров Сидор Сидорович | https://crm.example.com/456`}
              variant="outlined"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleBulkImportClose}>Отменить</Button>
          <Button
            onClick={handleBulkImportSave}
            variant="contained"
            startIcon={<UploadIcon />}
            disabled={!bulkImportText.trim()}
          >
            Импортировать
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentManagement;
