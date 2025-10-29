import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Teacher Scheduler heading', () => {
  render(<App />);
  const headingElement = screen.getByText(/Планировщик занятий/i);
  expect(headingElement).toBeInTheDocument();
});
