import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock components that rely on WebGL to avoid JSDOM errors
jest.mock('./components/MaterialPreview', () => () => <div />);
jest.mock('./components/MaterialEditor', () => () => <div />);

import App from './App';

test('renders sidebar title', () => {
  render(<App />);
  const titleElement = screen.getByText(/materials/i);
  expect(titleElement).toBeInTheDocument();
});
