import React, { useState, useCallback, useRef } from 'react';
import { useScheduler } from '../context/SchedulerContext';
import { importFromJSON, getStorageSize } from '../utils/storageUtils';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  Stack,
  Divider,
  Chip,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Upload as UploadIcon,
  DeleteForever as DeleteIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

const SettingsManagement: React.FC = () => {
  const { teachers, groups, students, scheduledClasses, exportData, importData, clearAllData } = useScheduler();
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = useCallback(() => {
    exportData();
    // Show success message temporarily
    setImportSuccess(true);
    setImportError(null);
    setTimeout(() => setImportSuccess(false), 3000);
  }, [exportData]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportSuccess(false);

    try {
      const data = await importFromJSON(file);
      importData(data);
      setImportSuccess(true);
      setTimeout(() => setImportSuccess(false), 5000);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Failed to import data');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [importData]);

  const handleClearData = useCallback(() => {
    clearAllData();
  }, [clearAllData]);

  const storageSize = getStorageSize();

  return (
    <Box sx={{ p: 3, maxWidth: 800, margin: '0 auto' }}>
      <Typography variant="h5" gutterBottom>
        Data Management
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Import, export, and manage your schedule data
      </Typography>

      {/* Status Cards */}
      <Stack spacing={2} sx={{ mb: 3 }}>
        <Card variant="outlined">
          <CardContent>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <InfoIcon color="primary" />
              <Typography variant="h6">Current Data</Typography>
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip label={`${teachers.length} Teachers`} color="primary" size="small" />
              <Chip label={`${groups.length} Groups`} color="secondary" size="small" />
              <Chip label={`${students.length} Students`} color="info" size="small" />
              <Chip label={`${scheduledClasses.length} Classes`} color="success" size="small" />
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Storage used: {storageSize.toFixed(2)} KB
            </Typography>
          </CardContent>
        </Card>
      </Stack>

      {/* Alerts */}
      {importSuccess && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setImportSuccess(false)}>
          Data imported/exported successfully!
        </Alert>
      )}
      {importError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setImportError(null)}>
          {importError}
        </Alert>
      )}

      {/* Export Section */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Export Data
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Download your schedule data as a JSON file for backup or transfer
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
          >
            Export to JSON
          </Button>
        </CardContent>
      </Card>

      {/* Import Section */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Import Data
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Upload a previously exported JSON file to restore your data
          </Typography>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Warning: Importing will replace all current data!
          </Alert>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <Button
            variant="outlined"
            color="primary"
            startIcon={<UploadIcon />}
            onClick={handleImportClick}
          >
            Import from JSON
          </Button>
        </CardContent>
      </Card>

      <Divider sx={{ my: 3 }} />

      {/* Danger Zone */}
      <Card sx={{ border: '1px solid #d32f2f' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="error">
            Danger Zone
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Permanently delete all data from the application
          </Typography>
          <Alert severity="error" sx={{ mb: 2 }}>
            This action cannot be undone! Make sure to export your data first if you want to keep it.
          </Alert>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleClearData}
          >
            Clear All Data
          </Button>
        </CardContent>
      </Card>

      {/* Auto-save Info */}
      <Box sx={{ mt: 3, p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
        <Typography variant="body2" color="info.main">
          <strong>Auto-save enabled:</strong> All changes are automatically saved to your browser's LocalStorage.
          Data persists between sessions on this device.
        </Typography>
      </Box>
    </Box>
  );
};

export default SettingsManagement;
