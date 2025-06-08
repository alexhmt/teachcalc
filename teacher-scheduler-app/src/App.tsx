import React from 'react';
import './App.css';
import './print.css'; // Import print-specific CSS
import SchedulerCalendar from './components/SchedulerCalendar';
import { SchedulerProvider } from './context/SchedulerProvider';

const App: React.FC = () => {
  return (
    <SchedulerProvider>
      <div className="App">
        <header className="App-header no-print"> {/* Added no-print to header */}
          <h1>Teacher Scheduler</h1>
        </header>
        <SchedulerCalendar />
      </div>
    </SchedulerProvider>
  );
}

export default App;
