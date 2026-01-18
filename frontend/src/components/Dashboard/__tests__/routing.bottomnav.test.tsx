import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BottomNavigation } from '../../Navigation/BottomNavigation';

// Minimal smoke test to ensure labels are present and links rendered

describe('BottomNavigation', () => {
  test('renders two main entries with labels', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <BottomNavigation basePath="" />
      </MemoryRouter>
    );

    expect(screen.getByRole('navigation', { name: /navigazione principale/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /mappa/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /le mie prenotazioni/i })).toBeInTheDocument();
  });
});
