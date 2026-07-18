import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LoginPage from './LoginPage';
import React from 'react';

// Mock API calls to avoid real network/DB calls
vi.mock('../services/api', () => ({
  getStudent: vi.fn().mockResolvedValue({
    name: 'Jane Doe',
    registerNumber: 'E24CS002',
    department: 'Computer Science',
  }),
  checkServerHealth: vi.fn().mockResolvedValue(true),
}));

// ─── Helper: fill the login form ────────────────────────────────────────────
function fillForm(name: string, regNo: string, dept: string) {
  if (name)
    fireEvent.change(screen.getByPlaceholderText('Enter your full name'), {
      target: { value: name },
    });
  if (regNo)
    fireEvent.change(screen.getByPlaceholderText('e.g., E23CS001'), {
      target: { value: regNo },
    });
  if (dept)
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: dept },
    });
}

function clickSubmit() {
  // The button contains SVG + text, so use role="button" to find it reliably
  fireEvent.submit(screen.getByRole('form') ?? document.querySelector('form')!);
}

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('LoginPage — Form Validation', () => {
  it('renders the Student Login heading', () => {
    render(<LoginPage onLogin={vi.fn()} onAdminClick={vi.fn()} />);
    expect(screen.getByText('Student Login')).toBeInTheDocument();
  });

  it('shows error when name is empty on submit', () => {
    render(<LoginPage onLogin={vi.fn()} onAdminClick={vi.fn()} />);
    fireEvent.submit(document.querySelector('form')!);
    expect(
      screen.getByText('Please enter your full name'),
    ).toBeInTheDocument();
  });

  it('shows error when register number is empty', () => {
    render(<LoginPage onLogin={vi.fn()} onAdminClick={vi.fn()} />);
    fillForm('Jane Doe', '', '');
    fireEvent.submit(document.querySelector('form')!);
    expect(
      screen.getByText('Please enter your register number'),
    ).toBeInTheDocument();
  });

  it('shows error when department is not selected', () => {
    render(<LoginPage onLogin={vi.fn()} onAdminClick={vi.fn()} />);
    fillForm('Jane Doe', 'E24CS002', '');
    fireEvent.submit(document.querySelector('form')!);
    expect(
      screen.getByText('Please select your department'),
    ).toBeInTheDocument();
  });

  it('calls onAdminClick when Admin Panel link is clicked', () => {
    const adminClickMock = vi.fn();
    render(<LoginPage onLogin={vi.fn()} onAdminClick={adminClickMock} />);
    fireEvent.click(screen.getByText('Admin Panel'));
    expect(adminClickMock).toHaveBeenCalledTimes(1);
  });
});

describe('LoginPage — Authentication', () => {
  it('calls onLogin with correct student data after successful DB lookup', async () => {
    const onLoginMock = vi.fn();
    render(<LoginPage onLogin={onLoginMock} onAdminClick={vi.fn()} />);

    fillForm('Jane Doe', 'e24cs002', 'Computer Science');
    fireEvent.submit(document.querySelector('form')!);

    await waitFor(() => {
      // onLogin should be called with the data returned from the mocked DB
      expect(onLoginMock).toHaveBeenCalledWith({
        name: 'Jane Doe',
        registerNumber: 'E24CS002',
        department: 'Computer Science',
      });
    });
  });
});
