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

const TeacherManagement: React.FC = () => {
  const { teachers, addTeacher, updateTeacher, deleteTeacher } = useScheduler();
  const [open, setOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [teacherName, setTeacherName] = useState('');

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
    if (!teacherName.trim()) return;

    if (editingTeacher) {
      updateTeacher({ ...editingTeacher, name: teacherName });
    } else {
      const newTeacher: Teacher = {
        id: `t${Date.now()}`,
        name: teacherName,
      };
      addTeacher(newTeacher);
    }
    handleClose();
  }, [teacherName, editingTeacher, addTeacher, updateTeacher, handleClose]);

  const handleDelete = useCallback((id: string) => {
    if (window.confirm('Are you sure you want to delete this teacher? This will also remove all their groups and classes.')) {
      deleteTeacher(id);
    }
  }, [deleteTeacher]);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Teachers Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpen}
        >
          Add Teacher
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {teachers.map((teacher) => (
              <TableRow key={teacher.id}>
                <TableCell>{teacher.id}</TableCell>
                <TableCell>{teacher.name}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleEdit(teacher)} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(teacher.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {teachers.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  No teachers found. Click "Add Teacher" to create one.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Teacher Name"
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
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={!teacherName.trim()}>
            {editingTeacher ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeacherManagement;
