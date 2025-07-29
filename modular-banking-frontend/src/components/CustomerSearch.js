/**
 * CustomerSearch Component
 * 
 * Provides a search interface for finding customers by lastName, partyId, or dateOfBirth.
 * Uses the Temenos color palette and ensures WCAG 2.1 AA compliance.
 */

import React, { useState } from 'react';
import { searchCustomers } from '../services/apiService';
import './CustomerSearch.css';

const CustomerSearch = ({ onSearchResults, onSearchError }) => {
  const [searchCriteria, setSearchCriteria] = useState({
    lastName: '',
    partyId: '',
    dateOfBirth: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  /**
   * Handle input field changes
   */
  const handleInputChange = (field, value) => {
    setSearchCriteria(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear validation errors when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
    
    // Clear general error
    if (error) {
      setError('');
    }
  };

  /**
   * Validate search criteria
   */
  const validateSearchCriteria = () => {
    const errors = {};
    const { lastName, partyId, dateOfBirth } = searchCriteria;

    // Check if at least one field is provided
    if (!lastName.trim() && !partyId.trim() && !dateOfBirth.trim()) {
      errors.general = 'Please provide at least one search criteria';
      return { isValid: false, errors };
    }

    // Validate partyId format if provided
    if (partyId.trim() && !/^[0-9]{8,12}$/.test(partyId.trim())) {
      errors.partyId = 'Party ID must be 8-12 digits';
    }

    // Validate date format if provided
    if (dateOfBirth.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth.trim())) {
      errors.dateOfBirth = 'Please enter date in YYYY-MM-DD format';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validation = validateSearchCriteria();
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    setIsLoading(true);
    setError('');
    setValidationErrors({});

    try {
      // Build search parameters
      const searchParams = {};
      
      if (searchCriteria.lastName.trim()) {
        searchParams.lastName = searchCriteria.lastName.trim();
      }
      
      if (searchCriteria.partyId.trim()) {
        searchParams.partyId = searchCriteria.partyId.trim();
      }
      
      if (searchCriteria.dateOfBirth.trim()) {
        searchParams.dateOfBirth = searchCriteria.dateOfBirth.trim();
      }

      console.log('Searching customers with params:', searchParams);
      
      // Call the actual API service
      const results = await searchCustomers(searchParams);
      
      console.log('Search results:', results);
      
      // Call onSearchResults callback with results
      if (onSearchResults) {
        onSearchResults(results);
      }

    } catch (err) {
      let errorMessage = 'Unable to search customers at this time. Please try again later.';
      
      // Provide more specific error messages based on the error
      if (err.message.includes('404')) {
        errorMessage = 'No customers found matching your search criteria.';
      } else if (err.message.includes('400')) {
        errorMessage = 'Invalid search criteria. Please check your input and try again.';
      } else if (err.message.includes('500')) {
        errorMessage = 'Server error. Please try again in a few moments.';
      }
      
      setError(errorMessage);
      
      if (onSearchError) {
        onSearchError(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle form reset
   */
  const handleClear = () => {
    setSearchCriteria({
      lastName: '',
      partyId: '',
      dateOfBirth: ''
    });
    setError('');
    setValidationErrors({});
  };

  /**
   * Handle Enter key press in form fields
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="customer-search-container" role="main">
      <div className="customer-search-header">
        <h2>Customer Search</h2>
        <p>Search for customers using any of the criteria below</p>
      </div>

      <form className="customer-search-form" onSubmit={handleSubmit} noValidate>
        {/* General error message */}
        {error && (
          <div className="error-message" role="alert" aria-live="polite">
            <span className="error-icon" aria-hidden="true">⚠️</span>
            <span>{error}</span>
          </div>
        )}
        
        {validationErrors.general && (
          <div className="error-message" role="alert" aria-live="polite">
            <span className="error-icon" aria-hidden="true">⚠️</span>
            <span>{validationErrors.general}</span>
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="lastName" className="form-label">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              className={`form-input ${validationErrors.lastName ? 'error' : ''}`}
              value={searchCriteria.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter customer's last name"
              aria-describedby={validationErrors.lastName ? "lastName-error" : undefined}
              autoComplete="family-name"
            />
            {validationErrors.lastName && (
              <div id="lastName-error" className="field-error" role="alert">
                {validationErrors.lastName}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="partyId" className="form-label">
              Party ID
            </label>
            <input
              type="text"
              id="partyId"
              className={`form-input ${validationErrors.partyId ? 'error' : ''}`}
              value={searchCriteria.partyId}
              onChange={(e) => handleInputChange('partyId', e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter party ID (8-12 digits)"
              aria-describedby={validationErrors.partyId ? "partyId-error" : undefined}
              autoComplete="off"
            />
            {validationErrors.partyId && (
              <div id="partyId-error" className="field-error" role="alert">
                {validationErrors.partyId}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="dateOfBirth" className="form-label">
              Date of Birth
            </label>
            <input
              type="date"
              id="dateOfBirth"
              className={`form-input ${validationErrors.dateOfBirth ? 'error' : ''}`}
              value={searchCriteria.dateOfBirth}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              onKeyDown={handleKeyDown}
              aria-describedby={validationErrors.dateOfBirth ? "dateOfBirth-error" : undefined}
              autoComplete="bday"
            />
            {validationErrors.dateOfBirth && (
              <div id="dateOfBirth-error" className="field-error" role="alert">
                {validationErrors.dateOfBirth}
              </div>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleClear}
            disabled={isLoading}
            aria-label="Clear form"
          >
            Clear
          </button>
          
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
            aria-label="Search for customers"
          >
            {isLoading ? (
              <>
                <span className="loading-spinner" aria-hidden="true"></span>
                Searching...
              </>
            ) : (
              'Search'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomerSearch; 