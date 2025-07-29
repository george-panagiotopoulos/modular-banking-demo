/**
 * CustomerSearch Component Tests
 * 
 * Tests for the customer search functionality including search by
 * lastName, partyId, and dateOfBirth.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CustomerSearch from '../components/CustomerSearch';
import * as apiService from '../services/apiService';

// Mock the API service
jest.mock('../services/apiService');

describe('CustomerSearch Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders search form with all input fields', () => {
    render(<CustomerSearch />);
    
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/party id/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  });

  test('displays proper WCAG 2.1 AA compliant colors', () => {
    render(<CustomerSearch />);
    
    const searchButton = screen.getByRole('button', { name: /search/i });
    const computedStyle = window.getComputedStyle(searchButton);
    
    // Check if the button uses the Temenos color palette
    expect(computedStyle.backgroundColor).toMatch(/#5CB8B2|#8246AF|#283275/i);
  });

  test('shows validation errors for empty required fields', async () => {
    render(<CustomerSearch />);
    
    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);
    
    await waitFor(() => {
      expect(screen.getByText(/please provide at least one search criteria/i)).toBeInTheDocument();
    });
  });

  test('calls search function with lastName when provided', async () => {
    const mockSearchCustomers = jest.spyOn(apiService, 'searchCustomers').mockResolvedValue([
      { partyId: '123456789', firstName: 'John', lastName: 'Doe', dateOfBirth: '1990-01-01' }
    ]);

    render(<CustomerSearch onSearchResults={jest.fn()} />);
    
    const lastNameInput = screen.getByLabelText(/last name/i);
    const searchButton = screen.getByRole('button', { name: /search/i });
    
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.click(searchButton);
    
    await waitFor(() => {
      expect(mockSearchCustomers).toHaveBeenCalledWith({ lastName: 'Doe' });
    });
  });

  test('calls search function with partyId when provided', async () => {
    const mockSearchCustomers = jest.spyOn(apiService, 'searchCustomers').mockResolvedValue([
      { partyId: '123456789', firstName: 'John', lastName: 'Doe', dateOfBirth: '1990-01-01' }
    ]);

    render(<CustomerSearch onSearchResults={jest.fn()} />);
    
    const partyIdInput = screen.getByLabelText(/party id/i);
    const searchButton = screen.getByRole('button', { name: /search/i });
    
    fireEvent.change(partyIdInput, { target: { value: '123456789' } });
    fireEvent.click(searchButton);
    
    await waitFor(() => {
      expect(mockSearchCustomers).toHaveBeenCalledWith({ partyId: '123456789' });
    });
  });

  test('calls search function with dateOfBirth when provided', async () => {
    const mockSearchCustomers = jest.spyOn(apiService, 'searchCustomers').mockResolvedValue([
      { partyId: '123456789', firstName: 'John', lastName: 'Doe', dateOfBirth: '1990-01-01' }
    ]);

    render(<CustomerSearch onSearchResults={jest.fn()} />);
    
    const dobInput = screen.getByLabelText(/date of birth/i);
    const searchButton = screen.getByRole('button', { name: /search/i });
    
    fireEvent.change(dobInput, { target: { value: '1990-01-01' } });
    fireEvent.click(searchButton);
    
    await waitFor(() => {
      expect(mockSearchCustomers).toHaveBeenCalledWith({ dateOfBirth: '1990-01-01' });
    });
  });

  test('displays loading state during search', async () => {
    const mockSearchCustomers = jest.spyOn(apiService, 'searchCustomers').mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve([]), 100))
    );

    render(<CustomerSearch onSearchResults={jest.fn()} />);
    
    const lastNameInput = screen.getByLabelText(/last name/i);
    const searchButton = screen.getByRole('button', { name: /search/i });
    
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.click(searchButton);
    
    expect(screen.getByText(/searching/i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText(/searching/i)).not.toBeInTheDocument();
    });
  });

  test('handles search errors gracefully', async () => {
    const mockSearchCustomers = jest.spyOn(apiService, 'searchCustomers').mockRejectedValue(
      new Error('API Error: Service unavailable')
    );

    render(<CustomerSearch onSearchResults={jest.fn()} />);
    
    const lastNameInput = screen.getByLabelText(/last name/i);
    const searchButton = screen.getByRole('button', { name: /search/i });
    
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.click(searchButton);
    
    await waitFor(() => {
      expect(screen.getByText(/unable to search customers at this time/i)).toBeInTheDocument();
    });
  });

  test('calls onSearchResults callback with search results', async () => {
    const mockResults = [
      { partyId: '123456789', firstName: 'John', lastName: 'Doe', dateOfBirth: '1990-01-01' },
      { partyId: '987654321', firstName: 'Jane', lastName: 'Doe', dateOfBirth: '1985-05-15' }
    ];
    
    const mockSearchCustomers = jest.spyOn(apiService, 'searchCustomers').mockResolvedValue(mockResults);
    const mockOnSearchResults = jest.fn();

    render(<CustomerSearch onSearchResults={mockOnSearchResults} />);
    
    const lastNameInput = screen.getByLabelText(/last name/i);
    const searchButton = screen.getByRole('button', { name: /search/i });
    
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.click(searchButton);
    
    await waitFor(() => {
      expect(mockOnSearchResults).toHaveBeenCalledWith(mockResults);
    });
  });

  test('supports keyboard navigation', () => {
    render(<CustomerSearch />);
    
    const lastNameInput = screen.getByLabelText(/last name/i);
    const partyIdInput = screen.getByLabelText(/party id/i);
    const dobInput = screen.getByLabelText(/date of birth/i);
    const searchButton = screen.getByRole('button', { name: /search/i });
    
    // Test tab navigation
    lastNameInput.focus();
    fireEvent.keyDown(lastNameInput, { key: 'Tab' });
    expect(partyIdInput).toHaveFocus();
    
    fireEvent.keyDown(partyIdInput, { key: 'Tab' });
    expect(dobInput).toHaveFocus();
    
    fireEvent.keyDown(dobInput, { key: 'Tab' });
    expect(searchButton).toHaveFocus();
  });

  test('form submission with Enter key', async () => {
    const mockSearchCustomers = jest.spyOn(apiService, 'searchCustomers').mockResolvedValue([]);

    render(<CustomerSearch onSearchResults={jest.fn()} />);
    
    const lastNameInput = screen.getByLabelText(/last name/i);
    
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.keyDown(lastNameInput, { key: 'Enter' });
    
    await waitFor(() => {
      expect(mockSearchCustomers).toHaveBeenCalledWith({ lastName: 'Doe' });
    });
  });

  test('clears form when clear button is clicked', () => {
    render(<CustomerSearch />);
    
    const lastNameInput = screen.getByLabelText(/last name/i);
    const partyIdInput = screen.getByLabelText(/party id/i);
    const dobInput = screen.getByLabelText(/date of birth/i);
    const clearButton = screen.getByRole('button', { name: /clear/i });
    
    // Fill in the form
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(partyIdInput, { target: { value: '123456789' } });
    fireEvent.change(dobInput, { target: { value: '1990-01-01' } });
    
    // Clear the form
    fireEvent.click(clearButton);
    
    expect(lastNameInput.value).toBe('');
    expect(partyIdInput.value).toBe('');
    expect(dobInput.value).toBe('');
  });
}); 