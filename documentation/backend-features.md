# Backend Application Documentation

## Overview

The Modular Banking Demo backend is a Node.js/Express-based server that provides comprehensive banking API integration, real-time event streaming, and microservices orchestration. It serves as the central hub for connecting the frontend to Temenos banking APIs and Azure Event Hub services.

## Technology Stack

### Core Technologies
- **Node.js 16+** - JavaScript runtime environment
- **Express.js 4.18.2** - Web application framework
- **Azure Event Hubs 5.10.0** - Enterprise event streaming platform
- **Axios 1.6.2** - HTTP client for API requests

### Security & Middleware
- **Helmet 8.1.0** - Security middleware collection
- **CORS 2.8.5** - Cross-Origin Resource Sharing
- **Morgan 1.10.0** - HTTP request logging middleware
- **dotenv 16.3.1** - Environment variable management

### Development & Testing
- **Jest 29.7.0** - Testing framework
- **Supertest 6.3.3** - HTTP assertion testing
- **Nodemon 3.0.2** - Development server with auto-restart
- **ESLint 8.56.0** - Code quality and style checking

### Additional Services
- **KafkaJS 2.2.4** - Apache Kafka client
- **UUID 11.1.0** - Unique identifier generation
- **Azure Storage Blob 12.17.0** - Cloud storage integration

## Server Configuration

### Basic Setup
- **Port**: 5011 (configurable via PORT environment variable)
- **Environment**: Development/Production configurable
- **Base URL**: http://localhost:5011 (configurable via BACKEND_BASE_URL)
- **Health Check**: `/health` endpoint for service monitoring

### Security Configuration
```javascript
// Helmet security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for SSE
  crossOriginEmbedderPolicy: false
}));

// CORS configuration for frontend access
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 'Authorization', 'x-session-id', 
    'x-client-type', 'x-endpoint', 'x-solution', 'Accept'
  ]
}));
```

## Application Architecture

### Folder Structure
```
demoflow-backend/
├── src/                          # Source code
│   ├── services/                 # Service layer
│   │   ├── eventHubService.js   # Azure Event Hub integration
│   │   ├── sessionManager.js    # Session management
│   │   ├── temenosApiService.js # Temenos API client
│   │   ├── accountsService.js   # Account operations
│   │   ├── partiesService.js    # Customer/Party operations
│   │   └── loansService.js      # Loan operations
│   ├── routes/                  # API routes
│   │   ├── eventStreamRoutes.js # Event streaming endpoints
│   │   ├── banking.js           # Banking API routes
│   │   ├── headless.js          # API viewer routes
│   │   └── joltRoutes.js        # JOLT transformation routes
│   ├── models/                  # Data models
│   │   ├── Account.js           # Account data model
│   │   ├── Loan.js              # Loan data model
│   │   └── Party.js             # Party/Customer data model
│   ├── config/                  # Configuration files
│   │   ├── temenosConfig.js     # Temenos API configuration
│   │   └── bankingConfig.js     # Banking service configuration
│   └── server.js                # Express server entry point
├── tests/                       # Test files
│   ├── eventHubService.test.js  # Event Hub service tests
│   ├── sessionManager.test.js   # Session management tests
│   ├── headlessV3.test.js       # HeadlessV3 API tests
│   ├── integration.test.js      # Integration tests
│   └── apiViewer.test.js        # End-to-end API tests
├── jest.config.js               # Jest configuration
├── jest.setup.js                # Jest setup
├── package.json                 # Dependencies and scripts
└── .env                         # Environment variables
```

## Core Services

### 1. Event Hub Service (`eventHubService.js`)
Real-time event streaming service using Azure Event Hub.

**Features:**
- **Multi-Component Support**: Party, Deposits, Lending, EventStore
- **Session Management**: User session-based event streaming
- **Connection Pooling**: Efficient resource management
- **Event Filtering**: Component-specific event routing
- **Statistics Tracking**: Real-time metrics and monitoring

**Key Methods:**
```javascript
// Connect to a specific banking component
async connectToComponent(sessionId, componentKey, clientInfo)

// Disconnect from component
async disconnectFromComponent(sessionId, componentKey)

// Get service statistics
getStats()

// Cleanup session connections
async cleanupSession(sessionId)
```

**Technical Details:**
- Azure Event Hub integration with connection string authentication
- Kafka-compatible protocol support
- Consumer group management for scalability
- Event source connection management for SSE
- Automatic reconnection and error handling

### 2. Session Manager Service (`sessionManager.js`)
User session lifecycle management.

**Features:**
- **Session Registration**: Unique session creation and tracking
- **Activity Monitoring**: Last activity timestamp tracking
- **Automatic Cleanup**: Inactive session removal
- **User Agent Tracking**: Client identification
- **IP Address Logging**: Security and analytics

**Session Object Structure:**
```javascript
{
  sessionId: 'string',
  createdAt: 'timestamp',
  lastActivity: 'timestamp',
  userAgent: 'string',
  ipAddress: 'string',
  isActive: 'boolean',
  connections: 'array'
}
```

### 3. Temenos API Service (`temenosApiService.js`)
Central service for Temenos banking API integration.

**Features:**
- **Multi-Component Support**: Party, Deposits, Lending, Holdings
- **Request Interceptors**: Logging and authentication
- **Response Processing**: Error handling and data transformation
- **Retry Mechanism**: Exponential backoff for failed requests
- **Health Monitoring**: API availability checking

**Supported Operations:**
- **Party Management**: Customer creation, retrieval, search
- **Account Operations**: Balance checking, transaction processing
- **Loan Services**: Loan creation, status checking, schedules
- **Holdings Management**: Portfolio and arrangement data

**Error Handling:**
```javascript
// Standardized error responses
{
  404: 'Resource not found',
  400: 'Bad request: Invalid parameters',
  401: 'Authentication required',
  403: 'Access forbidden',
  500: 'Banking service temporarily unavailable'
}
```

### 4. Banking Services Layer

#### Accounts Service (`accountsService.js`)
Handles account-specific operations using Temenos APIs.

**Features:**
- Account balance retrieval
- Transaction history
- Account creation and management
- Multi-currency support
- Real-time balance updates

#### Parties Service (`partiesService.js`)
Manages customer/party data operations.

**Features:**
- Customer profile management
- Party creation and updates
- Search functionality (by name, DOB, phone, email)
- Relationship management
- KYC data handling

#### Loans Service (`loansService.js`)
Handles loan-specific operations.

**Features:**
- Loan application processing
- Payment schedule management
- Loan status tracking
- Interest calculation
- Repayment processing

## API Endpoints

### Event Stream API (`/api/event-stream/`)

#### Component Management
```
GET    /api/event-stream/components
POST   /api/event-stream/connect/:componentKey
DELETE /api/event-stream/disconnect/:componentKey
GET    /api/event-stream/events/:componentKey
```

#### Session Management
```
GET    /api/event-stream/session/:sessionId/status
DELETE /api/event-stream/session/:sessionId/cleanup
```

#### Statistics and Monitoring
```
GET    /api/event-stream/stats
```

**Component Configuration:**
```javascript
const COMPONENTS = [
  {
    key: 'party',
    name: 'Party/Customer Management',
    description: 'Customer and party management services',
    domain: 'Party',
    version: 'R24',
    config: {
      kafkaTopic: 'ms-party-outbox',
      defaultPort: 8081
    }
  },
  // Additional components...
];
```

### Banking API (`/api/banking/`)

#### Customer Operations
```
GET    /api/banking/parties/:partyId
GET    /api/banking/parties/:partyId/accounts
GET    /api/banking/parties/:partyId/loans
```

#### Account Operations
```
GET    /api/banking/accounts/:accountId/transactions
POST   /api/banking/accounts/:accountId/transfer
```

#### Loan Operations
```
GET    /api/banking/loans/:loanId/details
GET    /api/banking/loans/:loanId/schedule
```

### Headless API (`/api/headless/`)

#### API Testing and Tracking
```
POST   /api/headless/track
GET    /api/headless/endpoints
GET    /api/headless/status
```

**Track Endpoint Payload:**
```javascript
{
  uri: 'string',           // Target API endpoint
  method: 'string',        // HTTP method
  payload: 'object',       // Request payload (optional)
  domain: 'string',        // Service domain
  endpoint: 'string'       // Endpoint identifier
}
```

### Health and Monitoring

#### System Health
```
GET    /health
```

**Health Response:**
```javascript
{
  status: 'healthy',
  timestamp: 'ISO string',
  services: {
    eventHub: 'active|inactive',
    sessionManager: 'active|inactive',
    banking: 'active'
  }
}
```

## Environment Configuration

### Required Environment Variables
```bash
# Azure Event Hub Configuration
BOOTSTRAP_SERVERS=microservices-eventhub-modularbanking.servicebus.windows.net:9093
CONNECTION_STRING=Endpoint=sb://...;SharedAccessKeyName=...;SharedAccessKey=...

# Server Configuration
PORT=5011
NODE_ENV=development
BACKEND_BASE_URL=http://localhost:5011

# Frontend Integration
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:3011
REACT_APP_BACKEND_URL=http://localhost:5011

# SSL Configuration (for corporate networks)
NODE_TLS_REJECT_UNAUTHORIZED=0
SSL_REJECT_UNAUTHORIZED=false

# Temenos Banking API Configuration
TEMENOS_BASE_URL=http://modulardemo.northeurope.cloudapp.azure.com
TEMENOS_PARTY_BASE_URL=http://modulardemo.northeurope.cloudapp.azure.com/ms-party-api/api
TEMENOS_DEPOSITS_BASE_URL=http://deposits-sandbox.northeurope.cloudapp.azure.com/irf-TBC-accounts-container/api
TEMENOS_LENDING_BASE_URL=http://lendings-sandbox.northeurope.cloudapp.azure.com/irf-TBC-lending-container/api
TEMENOS_HOLDINGS_BASE_URL=http://modulardemo.northeurope.cloudapp.azure.com/ms-holdings-api/api
```

### Configuration Validation
The server includes environment variable validation with fallback defaults:
```javascript
const validateEnvVar = (name, value, defaultValue) => {
  if (!value) {
    console.warn(`Environment variable ${name} not set, using default: ${defaultValue}`);
    return defaultValue;
  }
  return value;
};
```

## Real-Time Features

### Server-Sent Events (SSE)
Real-time event streaming to frontend components.

**Implementation:**
```javascript
// SSE connection setup
res.writeHead(200, {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
  'Access-Control-Allow-Origin': '*'
});

// Event streaming
const sendEvent = (data) => {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
};
```

**Event Types:**
- **component.connected**: Component connection established
- **component.disconnected**: Component disconnection
- **event.received**: Banking component event received
- **session.created**: New session created
- **session.terminated**: Session ended
- **error.occurred**: Error events with details

### Event Processing Pipeline
1. **Event Reception**: Azure Event Hub receives banking events
2. **Session Routing**: Events routed to appropriate user sessions
3. **Filtering**: Component-specific event filtering
4. **Transformation**: Event data transformation for frontend
5. **Streaming**: SSE delivery to connected clients

## Integration Patterns

### Temenos Banking API Integration
The backend acts as a proxy and aggregator for Temenos banking APIs.

**Integration Flow:**
1. **Frontend Request**: API call from frontend component
2. **Backend Routing**: Route to appropriate service layer
3. **Temenos API Call**: Authenticated call to Temenos endpoint
4. **Response Processing**: Data transformation and error handling
5. **Frontend Response**: Structured response to frontend

**Authentication Handling:**
- API key management (server-side only)
- Request signing and headers
- Token refresh and rotation
- Error handling and fallback

### Azure Event Hub Integration
Real-time event streaming from banking microservices.

**Consumer Group Strategy:**
- Unique consumer groups per user session
- Load balancing across multiple server instances
- Fault tolerance and automatic reconnection
- Event ordering and deduplication

## Error Handling and Logging

### Error Categories
- **Network Errors**: Connection timeouts, DNS failures
- **Authentication Errors**: Invalid credentials, expired tokens
- **Business Logic Errors**: Invalid operations, constraint violations
- **System Errors**: Database failures, service unavailability

### Logging Strategy
```javascript
// Request logging with Morgan
app.use(morgan('combined', {
  stream: {
    write: (message) => {
      console.log(message.trim());
    }
  }
}));

// Custom error logging
const logError = (error, context) => {
  console.error(`[${context}] ${error.message}`, {
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
};
```

### Error Response Format
```javascript
{
  error: 'string',           // Error message
  code: 'string',            // Error code
  timestamp: 'ISO string',   // Error timestamp
  requestId: 'string',       // Request identifier
  details: 'object'          // Additional error details
}
```

## Testing Strategy

### Test Categories
- **Unit Tests**: Individual service and function testing
- **Integration Tests**: End-to-end API testing
- **Service Tests**: External service integration testing
- **Performance Tests**: Load and stress testing

### Test Configuration
```javascript
// Jest configuration
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js'
  ],
  coverageReporters: ['text', 'lcov', 'html']
};
```

### Mock Strategy
- **External APIs**: Mocked Temenos API responses
- **Azure Services**: Mocked Event Hub connections
- **Database**: In-memory test database
- **Time-dependent**: Mocked timestamps and timers

## Performance Optimization

### Connection Pooling
- HTTP connection reuse with Keep-Alive
- Azure Event Hub connection pooling
- Database connection pooling
- Redis connection pooling (if implemented)

### Caching Strategy
- API response caching with TTL
- Session data caching
- Configuration caching
- Static asset caching

### Resource Management
```javascript
// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  
  // Close server
  server.close(() => {
    console.log('Server closed');
  });
  
  // Cleanup services
  await eventHubService.shutdown();
  await sessionManager.cleanup();
  
  process.exit(0);
});
```

## Security Measures

### Input Validation
- Request payload validation
- Parameter sanitization
- SQL injection prevention
- XSS protection

### Rate Limiting
```javascript
// Implementation example
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', apiLimiter);
```

### CORS Security
- Strict origin validation
- Credential handling
- Method restrictions
- Header validation

### Environment Security
- Sensitive data in environment variables only
- No hardcoded credentials
- Secure defaults
- Production vs development configurations

## Monitoring and Observability

### Health Checks
- Service availability monitoring
- Database connectivity checks
- External API health verification
- Resource utilization monitoring

### Metrics Collection
- Request/response metrics
- Error rate tracking
- Performance metrics
- User session analytics

### Logging and Alerting
- Structured logging with correlation IDs
- Error aggregation and alerting
- Performance threshold monitoring
- Security event logging

## Deployment Considerations

### Production Readiness
- Environment variable validation
- Health check endpoints
- Graceful shutdown handling
- Process management (PM2/systemd)

### Scaling Strategies
- Horizontal scaling with load balancing
- Session affinity handling
- Database connection pooling
- Caching layer implementation

### Security Hardening
- TLS/SSL configuration
- Security headers implementation
- Input validation and sanitization
- Authentication and authorization

### Monitoring Integration
- APM tool integration
- Log aggregation setup
- Alert configuration
- Dashboard creation 