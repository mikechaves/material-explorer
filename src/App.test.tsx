import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock components that rely on WebGL to avoid JSDOM errors
jest.mock('./components/MaterialPreview', () => () => <div />);
jest.mock('./components/MaterialEditor', () => () => <div />);

import App from './App';

test('renders sidebar header actions', () => {
  render(<App />);
  expect(screen.getByRole('button', { name: /collapse sidebar/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /export json/i })).toBeInTheDocument();
});
