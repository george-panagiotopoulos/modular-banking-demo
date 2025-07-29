/**
 * Customer Search API Tests
 * Tests the /api/banking/parties/search endpoint
 */

const request = require('supertest');
const app = require('../src/server');

describe('Customer Search API Tests', () => {
  let server;

  beforeAll(() => {
    // Start the server for testing
    server = app.listen(0); // Use port 0 to let OS choose an available port
  });

  afterAll(async () => {
    if (server) {
      await new Promise((resolve) => {
        server.close(resolve);
      });
    }
  });

  describe('GET /api/banking/parties/search', () => {
    it('should return 400 when no search criteria is provided', async () => {
      const response = await request(app)
        .get('/api/banking/parties/search')
        .expect(400);

      expect(response.body.error).toBe('At least one search criteria is required (lastName, partyId, or dateOfBirth)');
    });

    it('should search customers by lastName and return matching results', async () => {
      const response = await request(app)
        .get('/api/banking/parties/search?lastName=Smith')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      const johnSmith = response.body.find(customer => customer.firstName === 'John' && customer.lastName === 'Smith');
      expect(johnSmith).toBeDefined();
      expect(johnSmith.partyId).toBe('2516466195');
      expect(johnSmith.displayName).toBe('John Smith');
      expect(johnSmith.email).toBe('john.smith@email.com');
    });

    it('should search customers by lastName with partial match', async () => {
      const response = await request(app)
        .get('/api/banking/parties/search?lastName=Smi')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      // Should find John Smith
      const smithCustomer = response.body.find(customer => customer.lastName === 'Smith');
      expect(smithCustomer).toBeDefined();
    });

    it('should search customers by dateOfBirth and return matching results', async () => {
      const response = await request(app)
        .get('/api/banking/parties/search?dateOfBirth=1985-03-15')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      
      const customer = response.body[0];
      expect(customer.firstName).toBe('John');
      expect(customer.lastName).toBe('Smith');
      expect(customer.dateOfBirth).toBe('1985-03-15');
    });

    it('should search customers by lastName and dateOfBirth combined', async () => {
      const response = await request(app)
        .get('/api/banking/parties/search?lastName=Smith&dateOfBirth=1985-03-15')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      
      const customer = response.body[0];
      expect(customer.firstName).toBe('John');
      expect(customer.lastName).toBe('Smith');
      expect(customer.dateOfBirth).toBe('1985-03-15');
    });

    it('should return empty array when no customers match the criteria', async () => {
      const response = await request(app)
        .get('/api/banking/parties/search?lastName=NonExistentName')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should search by partyId and return specific customer from live API', async () => {
      const response = await request(app)
        .get('/api/banking/parties/search?partyId=2516466195')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      
      const customer = response.body[0];
      expect(customer.partyId).toBe('2516466195');
      // This comes from the live Temenos API, so we expect the actual customer data
      expect(customer.firstName).toBe('Ian');
      expect(customer.lastName).toBe('Wilson');
      expect(customer.displayName).toBe('Ian Wilson');
    });

    it('should return 404 when partyId is not found', async () => {
      const response = await request(app)
        .get('/api/banking/parties/search?partyId=9999999999')
        .expect(404);

      expect(response.body.error).toBe('Customer not found');
    });

    it('should handle empty string parameters gracefully', async () => {
      const response = await request(app)
        .get('/api/banking/parties/search?lastName=&dateOfBirth=')
        .expect(400);

      expect(response.body.error).toBe('At least one search criteria is required (lastName, partyId, or dateOfBirth)');
    });

    it('should handle whitespace-only parameters gracefully', async () => {
      const response = await request(app)
        .get('/api/banking/parties/search?lastName=%20%20&dateOfBirth=%20%20')
        .expect(400);

      expect(response.body.error).toBe('At least one search criteria is required (lastName, partyId, or dateOfBirth)');
    });

    it('should return all test customers when searching with broad criteria', async () => {
      const response = await request(app)
        .get('/api/banking/parties/search?lastName=o') // Should match Johnson, Brown, Wilson
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(3);
      
      const lastNames = response.body.map(customer => customer.lastName);
      expect(lastNames).toContain('Johnson');
      expect(lastNames).toContain('Brown');
      expect(lastNames).toContain('Wilson');
    });

    it('should include all expected customer fields in the response', async () => {
      const response = await request(app)
        .get('/api/banking/parties/search?lastName=Smith')
        .expect(200);

      const customer = response.body[0];
      
      // Verify all expected fields are present
      expect(customer).toHaveProperty('customerId');
      expect(customer).toHaveProperty('partyId');
      expect(customer).toHaveProperty('firstName');
      expect(customer).toHaveProperty('lastName');
      expect(customer).toHaveProperty('displayName');
      expect(customer).toHaveProperty('dateOfBirth');
      expect(customer).toHaveProperty('cityOfBirth');
      expect(customer).toHaveProperty('middleName');
      expect(customer).toHaveProperty('nationality');
      expect(customer).toHaveProperty('primaryEmail');
      expect(customer).toHaveProperty('email');
      expect(customer).toHaveProperty('mobilePhone');
      expect(customer).toHaveProperty('phone');
      expect(customer).toHaveProperty('homePhone');
      expect(customer).toHaveProperty('address');
      expect(customer).toHaveProperty('status');
      expect(customer).toHaveProperty('customerSince');
    });
  });
}); 