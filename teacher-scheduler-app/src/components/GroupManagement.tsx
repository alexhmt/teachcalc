import React, { useState, useCallback } from 'react';
import { useScheduler } from '../context/SchedulerContext';
import { Group } from '../types';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

const GroupManagement: React.FC = () => {
  const { groups, teachers, addGroup, updateGroup, deleteGroup } = useScheduler();
  const [open, setOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [groupName, setGroupName] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');

  const handleOpen = useCallback(() => {
    setOpen(true);
    setEditingGroup(null);
    setGroupName('');
    setSelectedTeacherId('');
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setEditingGroup(null);
    setGroupName('');
    setSelectedTeacherId('');
  }, []);

  const handleEdit = useCallback((group: Group) => {
    setEditingGroup(group);
    setGroupName(group.name);
    setSelectedTeacherId(group.teacherId);
    setOpen(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!groupName.trim() || !selectedTeacherId) return;

    if (editingGroup) {
      updateGroup({
        ...editingGroup,
        name: groupName,
        teacherId: selectedTeacherId,
      });
    } else {
      const newGroup: Group = {
        id: `g${Date.now()}`,
        name: groupName,
        teacherId: selectedTeacherId,
        studentIds: [],
      };
      addGroup(newGroup);
    }
    handleClose();
  }, [groupName, selectedTeacherId, editingGroup, addGroup, updateGroup, handleClose]);

  const handleDelete = useCallback((id: string) => {
    if (window.confirm('Are you sure you want to delete this group? This will also remove all scheduled classes for this group.')) {
      deleteGroup(id);
    }
  }, [deleteGroup]);

  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher ? teacher.name : 'Unknown';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Groups Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpen}
        >
          Add Group
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Group Name</TableCell>
              <TableCell>Teacher</TableCell>
              <TableCell>Students</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {groups.map((group) => (
              <TableRow key={group.id}>
                <TableCell>{group.id}</TableCell>
                <TableCell>{group.name}</TableCell>
                <TableCell>{getTeacherName(group.teacherId)}</TableCell>
                <TableCell>{group.studentIds.length}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleEdit(group)} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(group.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {groups.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No groups found. Click "Add Group" to create one.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingGroup ? 'Edit Group' : 'Add New Group'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              autoFocus
              label="Group Name"
              type="text"
              fullWidth
              variant="outlined"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
            <FormControl fullWidth>
              <InputLabel>Teacher</InputLabel>
              <Select
                value={selectedTeacherId}
                label="Teacher"
                onChange={(e) => setSelectedTeacherId(e.target.value)}
              >
                <MenuItem value="">
                  <em>Select a teacher</em>
                </MenuItem>
                {teachers.map((teacher) => (
                  <MenuItem key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!groupName.trim() || !selectedTeacherId}
          >
            {editingGroup ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GroupManagement;
