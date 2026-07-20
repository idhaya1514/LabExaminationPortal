import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';
import React from 'react';

// Mock all API calls so tests run offline instantly
vi.mock('./services/api', () => ({
  getStudent: vi.fn().mockResolvedValue({
    name: 'Test Student',
    registerNumber: 'TEST001',
    department: 'Computer Science',
  }),
  getStudents: vi.fn().mockResolvedValue([]),
  getExamResults: vi.fn().mockResolvedValue([]),
  checkServerHealth: vi.fn().mockResolvedValue(true),
  syncLocalExamResultsToSupabase: vi.fn().mockResolvedValue(true),
}));

describe('App — Router / Page Navigation', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('starts on the LoginPage page by default', () => {
    render(<App />);
    expect(screen.getByText('Portal Access')).toBeInTheDocument();
  });

  it('navigates to Admin Panel when admin logs in successfully', async () => {
    render(<App />);
    
    // Switch to Admin tab
    fireEvent.click(screen.getByText('Admin', { selector: 'button' }));
    
    // Fill admin form
    fireEvent.change(screen.getByPlaceholderText('Enter administrator username'), {
      target: { value: 'sscet' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter security password'), {
      target: { value: 'adminsscet@2026' },
    });
    
    // Submit
    fireEvent.submit(document.querySelector('form')!);
    
    // Should navigate to Admin Dashboard
    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    });
  });

  it('shows only the login page when no session is stored', () => {
    render(<App />);
    expect(screen.getByText('Portal Access')).toBeInTheDocument();
    expect(screen.queryByText('Admin Dashboard')).not.toBeInTheDocument();
  });
});
