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
        Управление данными
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Импорт, экспорт и управление данными вашего расписания
      </Typography>

      {/* Status Cards */}
      <Stack spacing={2} sx={{ mb: 3 }}>
        <Card variant="outlined">
          <CardContent>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <InfoIcon color="primary" />
              <Typography variant="h6">Текущие данные</Typography>
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip label={`${teachers.length} Преподавателей`} color="primary" size="small" />
              <Chip label={`${groups.length} Групп`} color="secondary" size="small" />
              <Chip label={`${students.length} Студентов`} color="info" size="small" />
              <Chip label={`${scheduledClasses.length} Занятий`} color="success" size="small" />
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Использовано хранилища: {storageSize.toFixed(2)} KB
            </Typography>
          </CardContent>
        </Card>
      </Stack>

      {/* Alerts */}
      {importSuccess && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setImportSuccess(false)}>
          Данные успешно импортированы/экспортированы!
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
            Экспорт данных
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Скачайте данные вашего расписания в формате JSON для резервного копирования или переноса
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
          >
            Экспортировать в JSON
          </Button>
        </CardContent>
      </Card>

      {/* Import Section */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Импорт данных
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Загрузите ранее экспортированный JSON файл для восстановления данных
          </Typography>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Внимание: Импорт заменит все текущие данные!
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
            Импортировать из JSON
          </Button>
        </CardContent>
      </Card>

      <Divider sx={{ my: 3 }} />

      {/* Danger Zone */}
      <Card sx={{ border: '1px solid #d32f2f' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="error">
            Опасная зона
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Безвозвратно удалить все данные из приложения
          </Typography>
          <Alert severity="error" sx={{ mb: 2 }}>
            Это действие нельзя отменить! Убедитесь, что вы экспортировали данные, если хотите их сохранить.
          </Alert>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleClearData}
          >
            Очистить все данные
          </Button>
        </CardContent>
      </Card>

      {/* Auto-save Info */}
      <Box sx={{ mt: 3, p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
        <Typography variant="body2" color="info.main">
          <strong>Автосохранение включено:</strong> Все изменения автоматически сохраняются в LocalStorage вашего браузера.
          Данные сохраняются между сессиями на этом устройстве.
        </Typography>
      </Box>
    </Box>
  );
};

export default SettingsManagement;
