import React, { ReactNode } from 'react';
import {
  Box,
  Button,
  Typography,
  TableContainer,
  Paper,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

interface CrudTableLayoutProps {
  title: string;
  addButtonText: string;
  onAdd: () => void;
  children: ReactNode;
}

/**
 * Reusable layout component for CRUD management pages.
 * Provides consistent header with title and add button, plus table container.
 */
const CrudTableLayout: React.FC<CrudTableLayoutProps> = ({
  title,
  addButtonText,
  onAdd,
  children,
}) => {
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">{title}</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAdd}
        >
          {addButtonText}
        </Button>
      </Box>

      <TableContainer component={Paper}>
        {children}
      </TableContainer>
    </Box>
  );
};

export default CrudTableLayout;
