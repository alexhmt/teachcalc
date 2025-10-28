import React, { useState } from 'react';
import './App.css';
import './print.css'; // Import print-specific CSS
import SchedulerCalendar from './components/SchedulerCalendar';
import TeacherManagement from './components/TeacherManagement';
import GroupManagement from './components/GroupManagement';
import StudentManagement from './components/StudentManagement';
import SettingsManagement from './components/SettingsManagement';
import { SchedulerProvider } from './context/SchedulerProvider';
import { Box, Tabs, Tab, AppBar, Toolbar, Typography } from '@mui/material';
import { CalendarMonth, Person, Group as GroupIcon, School as StudentIcon, Settings as SettingsIcon } from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const App: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <SchedulerProvider>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static" className="no-print">
          <Toolbar sx={{ minHeight: '56px !important' }}>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Планировщик занятий
            </Typography>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              textColor="inherit"
              indicatorColor="secondary"
              sx={{ ml: 'auto' }}
            >
              <Tab icon={<CalendarMonth />} label="Расписание" />
              <Tab icon={<Person />} label="Преподаватели" />
              <Tab icon={<GroupIcon />} label="Группы" />
              <Tab icon={<StudentIcon />} label="Студенты" />
              <Tab icon={<SettingsIcon />} label="Настройки" />
            </Tabs>
          </Toolbar>
        </AppBar>

        <TabPanel value={tabValue} index={0}>
          <SchedulerCalendar />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <TeacherManagement />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <GroupManagement />
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          <StudentManagement />
        </TabPanel>
        <TabPanel value={tabValue} index={4}>
          <SettingsManagement />
        </TabPanel>
      </Box>
    </SchedulerProvider>
  );
}

export default App;
