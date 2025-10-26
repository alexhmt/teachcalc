import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Teacher Scheduler heading', () => {
  render(<App />);
  const headingElement = screen.getByText(/teacher scheduler/i);
  expect(headingElement).toBeInTheDocument();
});
