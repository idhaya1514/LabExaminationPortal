import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';
import React from 'react';

// Mock all API calls so tests run offline instantly
vi.mock('./services/api', () => ({
  getStudent: vi.fn().mockResolvedValue({
    name: 'Test Student',
    registerNumber: 'TEST001',
    department: 'Computer Science',
  }),
  checkServerHealth: vi.fn().mockResolvedValue(true),
}));

// ─── Router / Navigation Tests ────────────────────────────────────────────────
describe('App — Router / Page Navigation', () => {
  it('starts on the Student Login page by default', () => {
    render(<App />);
    expect(screen.getByText('Student Login')).toBeInTheDocument();
  });

  it('navigates to Admin Portal page when Admin Panel link is clicked', () => {
    render(<App />);
    // Click the Admin Panel link on the student login page
    fireEvent.click(screen.getByText('Admin Panel'));
    // Should now show the Admin Portal heading
    expect(screen.getByText('Admin Portal')).toBeInTheDocument();
  });

  it('navigates back to Student Login from Admin Portal when Back is clicked', () => {
    render(<App />);
    // Go to Admin Portal
    fireEvent.click(screen.getByText('Admin Panel'));
    expect(screen.getByText('Admin Portal')).toBeInTheDocument();
    // Click back
    fireEvent.click(screen.getByText('Back to Student Login'));
    // Should be back on Student Login
    expect(screen.getByText('Student Login')).toBeInTheDocument();
  });

  it('shows only the login page when no session is stored', () => {
    // Ensure localStorage is clean
    localStorage.clear();
    sessionStorage.clear();
    render(<App />);
    expect(screen.getByText('Student Login')).toBeInTheDocument();
    // Admin panel and dashboard should NOT be visible
    expect(screen.queryByText('Admin Dashboard')).not.toBeInTheDocument();
  });
});
