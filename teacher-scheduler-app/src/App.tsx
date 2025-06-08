import React from 'react';
import './App.css';
import SchedulerCalendar from './components/SchedulerCalendar';
import { SchedulerProvider } from './context/SchedulerProvider'; // Import the provider

const App: React.FC = () => {
  return (
    <SchedulerProvider> {/* Wrap with SchedulerProvider */}
      <div className="App">
        <header className="App-header">
          <h1>Teacher Scheduler</h1>
        </header>
        <SchedulerCalendar />
      </div>
    </SchedulerProvider>
  );
}

export default App;
