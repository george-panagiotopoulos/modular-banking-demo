/**
 * Banking API Routes
 * Handles all banking-related endpoints for the MobileApp
 */

const express = require('express');
const router = express.Router();

const { getPartiesService } = require('../services/partiesService');
const { getLoansService } = require('../services/loansService');
const { getAccountsService } = require('../services/accountsService');
const { getTemenosApiService } = require('../services/temenosApiService');

// Initialize services
const partiesService = getPartiesService();
const loansService = getLoansService();
const accountsService = getAccountsService();
const temenosApiService = getTemenosApiService();

/**
 * GET /api/banking/parties/search
 * Search parties by various criteria
 */
router.get('/parties/search', async (req, res) => {
  console.log(`[Banking API] GET /parties/search`);
  console.log(`[Banking API] Request query:`, req.query);
  
  const { lastName, partyId, dateOfBirth } = req.query;
  
  // Validate that at least one search criteria is provided (and not just whitespace)
  const hasLastName = lastName && lastName.trim().length > 0;
  const hasPartyId = partyId && partyId.trim().length > 0;
  const hasDateOfBirth = dateOfBirth && dateOfBirth.trim().length > 0;
  
  if (!hasLastName && !hasPartyId && !hasDateOfBirth) {
    console.log(`[Banking API] Error: No search criteria provided`);
    return res.status(400).json({ 
      error: 'At least one search criteria is required (lastName, partyId, or dateOfBirth)' 
    });
  }
  
  try {
    console.log(`[Banking API] Searching parties with criteria:`, { lastName, partyId, dateOfBirth });
    
    // If partyId is provided, do a direct lookup from the real API
    if (hasPartyId) {
      try {
        console.log(`[Banking API] Direct lookup for partyId: ${partyId}`);
        const partyDetails = await partiesService.getPartyDetails(partyId.trim());
        console.log(`[Banking API] Found party by ID:`, partyDetails);
        return res.json([partyDetails]); // Return as array for consistency
      } catch (error) {
        console.log(`[Banking API] Party not found by ID ${partyId}:`, error.message);
        return res.status(404).json({ error: 'Customer not found' });
      }
    }
    
    // For searches by last name or date of birth, use predefined test customers
    // In a real implementation, this would query the actual Temenos API with search parameters
    const testCustomers = [
      {
        customerId: '2516466195',
        partyId: '2516466195',
        firstName: 'John',
        lastName: 'Smith',
        displayName: 'John Smith',
        dateOfBirth: '1985-03-15',
        cityOfBirth: 'New York',
        middleName: 'Michael',
        nationality: 'US',
        primaryEmail: 'john.smith@email.com',
        email: 'john.smith@email.com',
        mobilePhone: '+1-555-0123',
        phone: '+1-555-0123',
        homePhone: '+1-555-0124',
        address: '123 Main Street, New York, NY 10001',
        status: 'Active',
        customerSince: '2020-01-15'
      },
      {
        customerId: '2516466196',
        partyId: '2516466196',
        firstName: 'Jane',
        lastName: 'Johnson',
        displayName: 'Jane Johnson',
        dateOfBirth: '1990-07-22',
        cityOfBirth: 'Chicago',
        middleName: 'Elizabeth',
        nationality: 'US',
        primaryEmail: 'jane.johnson@email.com',
        email: 'jane.johnson@email.com',
        mobilePhone: '+1-555-0456',
        phone: '+1-555-0456',
        homePhone: '+1-555-0457',
        address: '456 Oak Avenue, Chicago, IL 60601',
        status: 'Active',
        customerSince: '2019-08-10'
      },
      {
        customerId: '2516466197',
        partyId: '2516466197',
        firstName: 'Michael',
        lastName: 'Brown',
        displayName: 'Michael Brown',
        dateOfBirth: '1978-12-05',
        cityOfBirth: 'Los Angeles',
        middleName: 'David',
        nationality: 'US',
        primaryEmail: 'michael.brown@email.com',
        email: 'michael.brown@email.com',
        mobilePhone: '+1-555-0789',
        phone: '+1-555-0789',
        homePhone: '+1-555-0790',
        address: '789 Elm Street, Los Angeles, CA 90210',
        status: 'Active',
        customerSince: '2021-03-22'
      },
      {
        customerId: '2516466198',
        partyId: '2516466198',
        firstName: 'Sarah',
        lastName: 'Davis',
        displayName: 'Sarah Davis',
        dateOfBirth: '1992-11-18',
        cityOfBirth: 'Miami',
        middleName: 'Anne',
        nationality: 'US',
        primaryEmail: 'sarah.davis@email.com',
        email: 'sarah.davis@email.com',
        mobilePhone: '+1-555-0321',
        phone: '+1-555-0321',
        homePhone: '+1-555-0322',
        address: '321 Pine Road, Miami, FL 33101',
        status: 'Active',
        customerSince: '2022-06-30'
      },
      {
        customerId: '2516466199',
        partyId: '2516466199',
        firstName: 'Robert',
        lastName: 'Wilson',
        displayName: 'Robert Wilson',
        dateOfBirth: '1975-04-12',
        cityOfBirth: 'Seattle',
        middleName: 'James',
        nationality: 'US',
        primaryEmail: 'robert.wilson@email.com',
        email: 'robert.wilson@email.com',
        mobilePhone: '+1-555-0654',
        phone: '+1-555-0654',
        homePhone: '+1-555-0655',
        address: '654 Cedar Lane, Seattle, WA 98101',
        status: 'Active',
        customerSince: '2018-12-01'
      }
    ];
    
    // Filter customers based on search criteria
    let filteredCustomers = testCustomers;
    
    if (hasLastName) {
      const searchLastName = lastName.toLowerCase().trim();
      filteredCustomers = filteredCustomers.filter(customer => 
        customer.lastName.toLowerCase().includes(searchLastName)
      );
      console.log(`[Banking API] Filtered by lastName '${lastName}': ${filteredCustomers.length} results`);
    }
    
    if (hasDateOfBirth) {
      filteredCustomers = filteredCustomers.filter(customer => 
        customer.dateOfBirth === dateOfBirth.trim()
      );
      console.log(`[Banking API] Filtered by dateOfBirth '${dateOfBirth}': ${filteredCustomers.length} results`);
    }
    
    console.log(`[Banking API] Search completed, returning ${filteredCustomers.length} customers`);
    res.json(filteredCustomers);
    
  } catch (error) {
    console.error(`[Banking API] Error in GET /parties/search:`, error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/banking/parties/:partyId
 * Get party details
 */
router.get('/parties/:partyId', async (req, res) => {
  console.log(`[Banking API] GET /parties/${req.params.partyId}`);
  console.log(`[Banking API] Request params:`, req.params);
  console.log(`[Banking API] Request query:`, req.query);
  
  const { partyId } = req.params;
  
  if (!partyId) {
    console.log(`[Banking API] Error: Missing partyId parameter`);
    return res.status(400).json({ error: 'partyId is required' });
  }
  
  try {
    console.log(`[Banking API] Calling partiesService.getPartyDetails(${partyId})`);
    const partyDetails = await partiesService.getPartyDetails(partyId);
    console.log(`[Banking API] partiesService.getPartyDetails returned:`, partyDetails);
    
    res.json(partyDetails);
  } catch (error) {
    console.error(`[Banking API] Error in GET /parties/${partyId}:`, error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/banking/parties/:partyId/accounts
 * Get all accounts for a party
 */
router.get('/parties/:partyId/accounts', async (req, res) => {
  console.log(`[Backend API] GET /parties/${req.params.partyId}/accounts called`);
  console.log(`[Backend API] Request params:`, req.params);
  console.log(`[Backend API] Request query:`, req.query);
  
  try {
    const { partyId } = req.params;
    
    if (!partyId) {
      console.log(`[Backend API] Missing partyId parameter`);
      return res.status(400).json({ error: 'Party ID is required' });
    }

    console.log(`[Backend API] Calling partiesService.getPartyAccounts(${partyId})`);
    const accounts = await partiesService.getPartyAccounts(partyId);
    console.log(`[Backend API] partiesService.getPartyAccounts returned ${accounts.length} accounts:`, accounts);
    
    res.json(accounts);
  } catch (error) {
    console.error(`[Backend API] Error in GET /parties/${req.params.partyId}/accounts:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch accounts',
      details: error.message 
    });
  }
});

/**
 * GET /api/banking/parties/:partyId/loans
 * Get all loans for a party
 */
router.get('/parties/:partyId/loans', async (req, res) => {
  console.log(`[Backend API] GET /parties/${req.params.partyId}/loans called`);
  console.log(`[Backend API] Request params:`, req.params);
  console.log(`[Backend API] Request query:`, req.query);
  
  try {
    const { partyId } = req.params;
    
    if (!partyId) {
      console.log(`[Backend API] Missing partyId parameter`);
      return res.status(400).json({ error: 'Party ID is required' });
    }

    console.log(`[Backend API] Calling partiesService.getPartyLoans(${partyId})`);
    const loans = await partiesService.getPartyLoans(partyId);
    console.log(`[Backend API] partiesService.getPartyLoans returned ${loans.length} loans:`, loans);
    
    res.json(loans);
  } catch (error) {
    console.error(`[Backend API] Error in GET /parties/${req.params.partyId}/loans:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch loans',
      details: error.message 
    });
  }
});

/**
 * GET /api/banking/accounts/:accountId
 * Get account details
 */
router.get('/accounts/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    
    console.log(`[Banking API] GET /accounts/${accountId}`);
    
    if (!accountsService.validateAccountId(accountId)) {
      return res.status(400).json({
        error: 'Invalid account ID format',
        message: 'Account ID must be 8-16 digits'
      });
    }
    
    const accountDetails = await accountsService.getAccountDetails(accountId);
    
    res.json({
      success: true,
      data: accountDetails
    });
    
  } catch (error) {
    console.error(`[Banking API] Error getting account details:`, error.message);
    res.status(404).json({
      error: 'Account not found',
      message: error.message
    });
  }
});

/**
 * GET /api/banking/accounts/:accountId/transactions
 * Get account transactions
 */
router.get('/accounts/:accountId/transactions', async (req, res) => {
  console.log(`[Backend API] GET /accounts/${req.params.accountId}/transactions called`);
  console.log(`[Backend API] Request params:`, req.params);
  console.log(`[Backend API] Request query:`, req.query);
  
  try {
    const { accountId } = req.params;
    const { partyId } = req.query;

    if (!accountId) {
      console.log(`[Backend API] Missing accountId parameter`);
      return res.status(400).json({ error: 'Account ID is required' });
    }

    console.log(`[Backend API] Calling temenosApiService.getAccountTransactions(${accountId})`);
    const transactions = await temenosApiService.getAccountTransactions(accountId);
    console.log(`[Backend API] temenosApiService.getAccountTransactions returned:`, transactions);
    
    res.json({ transactions: transactions || [] });
  } catch (error) {
    console.error(`[Backend API] Error in GET /accounts/${req.params.accountId}/transactions:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch transactions',
      details: error.message 
    });
  }
});

/**
 * GET /api/banking/accounts/:accountId/balance
 * Get account balance
 */
router.get('/accounts/:accountId/balance', async (req, res) => {
  try {
    const { accountId } = req.params;
    
    console.log(`[Banking API] GET /accounts/${accountId}/balance`);
    
    if (!accountsService.validateAccountId(accountId)) {
      return res.status(400).json({
        error: 'Invalid account ID format',
        message: 'Account ID must be 8-16 digits'
      });
    }
    
    const balanceData = await accountsService.getAccountBalance(accountId);
    
    res.json({
      success: true,
      data: balanceData
    });
    
  } catch (error) {
    console.error(`[Banking API] Error getting account balance:`, error.message);
    res.status(404).json({
      error: 'Account not found',
      message: error.message
    });
  }
});

/**
 * GET /api/banking/loans/:loanId
 * Get loan details
 */
router.get('/loans/:loanId', async (req, res) => {
  console.log(`[Backend API] GET /loans/${req.params.loanId} called`);
  console.log(`[Backend API] Request params:`, req.params);
  console.log(`[Backend API] Request query:`, req.query);
  
  try {
    const { loanId } = req.params;

    if (!loanId) {
      console.log(`[Backend API] Missing loanId parameter`);
      return res.status(400).json({ error: 'Loan ID is required' });
    }

    console.log(`[Backend API] Calling loansService.getLoanDetails(${loanId})`);
    const loanDetails = await loansService.getLoanDetails(loanId);
    console.log(`[Backend API] loansService.getLoanDetails returned:`, loanDetails);
    
    res.json(loanDetails);
  } catch (error) {
    console.error(`[Backend API] Error in GET /loans/${req.params.loanId}:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch loan details',
      details: error.message 
    });
  }
});

/**
 * GET /api/banking/loans/:loanId/schedule
 * Get loan payment schedule
 */
router.get('/loans/:loanId/schedule', async (req, res) => {
  console.log(`[Backend API] GET /loans/${req.params.loanId}/schedule called`);
  console.log(`[Backend API] Request params:`, req.params);
  console.log(`[Backend API] Request query:`, req.query);
  console.log(`[Backend API] Request headers:`, req.headers);
  
  try {
    const { loanId } = req.params;

    if (!loanId) {
      console.log(`[Backend API] Missing loanId parameter`);
      return res.status(400).json({ error: 'Loan ID is required' });
    }

    console.log(`[Backend API] Calling loansService.getLoanSchedule(${loanId})`);
    const loanSchedule = await loansService.getLoanSchedule(loanId);
    console.log(`[Backend API] loansService.getLoanSchedule returned:`, loanSchedule);
    
    res.json(loanSchedule);
  } catch (error) {
    console.error(`[Backend API] Error in GET /loans/${req.params.loanId}/schedule:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch loan schedule',
      details: error.message 
    });
  }
});

/**
 * GET /api/banking/parties/:partyId/summary
 * Get complete banking summary for a party
 */
router.get('/parties/:partyId/summary', async (req, res) => {
  try {
    const { partyId } = req.params;
    
    console.log(`[Banking API] GET /parties/${partyId}/summary`);
    
    if (!partiesService.validatePartyId(partyId)) {
      return res.status(400).json({
        error: 'Invalid party ID format',
        message: 'Party ID must be 8-12 digits'
      });
    }
    
    // Get all data in parallel
    const [partyDetails, accounts, loans, loanSummary] = await Promise.all([
      partiesService.getPartyDetails(partyId),
      partiesService.getPartyAccounts(partyId),
      partiesService.getPartyLoans(partyId),
      loansService.getLoanSummary(partyId)
    ]);
    
    const summary = {
      party: partyDetails,
      accounts: {
        items: accounts,
        count: accounts.length,
        totalBalance: accounts.reduce((sum, acc) => sum + acc.currentBalance, 0)
      },
      loans: {
        items: loans,
        count: loans.length,
        summary: loanSummary
      }
    };
    
    res.json({
      success: true,
      data: summary
    });
    
  } catch (error) {
    console.error(`[Banking API] Error getting party summary:`, error.message);
    res.status(500).json({
      error: 'Failed to fetch party summary',
      message: error.message
    });
  }
});

/**
 * GET /api/banking/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Banking API is healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router; 