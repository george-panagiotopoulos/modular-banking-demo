# Tools and Technologies Documentation

## Overview

The Modular Banking Demo utilizes a comprehensive technology stack spanning frontend frameworks, backend services, banking APIs, event streaming platforms, and development tools. This document provides detailed information about each technology, its role in the application, configuration details, and usage patterns.

## Technology Stack Overview

### Architecture Categories
- **Frontend Technologies**: React ecosystem and UI libraries
- **Backend Technologies**: Node.js runtime and Express framework
- **Banking Integration**: Temenos APIs and financial services
- **Event Streaming**: Azure Event Hub and Kafka protocols
- **Development Tools**: Build tools, testing frameworks, and utilities
- **DevOps & Deployment**: Docker, process management, and monitoring
- **Data Transformation**: JOLT JSON transformation engine

## Frontend Technologies

### 1. React 19.1.0
**Purpose**: Core frontend framework for building interactive user interfaces

**Key Features Used:**
- **Function Components**: Modern component architecture
- **Hooks**: State management and side effects
- **Concurrent Features**: Improved rendering performance
- **JSX**: Declarative UI syntax

**Configuration:**
```json
// package.json dependencies
{
  "react": "^19.1.0",
  "react-dom": "^19.1.0",
  "react-scripts": "5.0.1"
}
```

**Usage in Application:**
- Component-based architecture for banking modules
- State management for real-time event displays
- Context providers for session management
- Custom hooks for API integration

### 2. React Router DOM 7.6.2
**Purpose**: Client-side routing for single-page application navigation

**Features:**
- **Hash Router**: Browser history management
- **Route Configuration**: Declarative route definitions
- **Navigation Guards**: Route protection and validation
- **Query Parameters**: URL state management

**Implementation:**
```javascript
// App.js routing configuration
import { HashRouter as Router, Routes, Route } from 'react-router-dom';

const AppRoutes = () => (
  <Router>
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/demo-flow" element={<DemoFlow />} />
      <Route path="/event-stream" element={<EventStream />} />
      <Route path="/api-viewer" element={<APIViewer />} />
      <Route path="/mobile-app" element={<MobileApp />} />
      <Route path="/support-services" element={<SupportingServices />} />
    </Routes>
  </Router>
);
```

### 3. CSS3 and Modern Styling
**Purpose**: Professional banking UI with responsive design

**Technologies:**
- **CSS Grid**: Layout management for dashboard components
- **Flexbox**: Component alignment and distribution
- **CSS Variables**: Theme consistency and customization
- **Media Queries**: Responsive design across devices
- **CSS Animations**: Smooth transitions and interactions

**Theming System:**
```css
/* App.css - Temenos Banking Theme */
:root {
  --primary-blue: #1e3a8a;
  --secondary-blue: #3b82f6;
  --accent-blue: #60a5fa;
  --success-green: #10b981;
  --warning-orange: #f59e0b;
  --error-red: #ef4444;
  
  --gradient-primary: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
  --shadow-card: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --border-radius: 8px;
  --transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 4. JOLT Core 2.8.9
**Purpose**: JSON transformation engine for data mapping

**Features:**
- **Shift Operations**: Data restructuring and mapping
- **Default Values**: Fallback data assignment
- **Conditional Logic**: Rule-based transformations
- **Array Processing**: List and collection transformations

**Integration:**
```javascript
// JOLT transformation example
const joltSpec = {
  "shift": {
    "customerName": "party.name",
    "accountNumber": "account.id",
    "balance": "account.balance.amount"
  }
};

// Usage in frontend
import { transform } from '@jolt/core';
const transformedData = transform(joltSpec, rawBankingData);
```

## Backend Technologies

### 1. Node.js 16+
**Purpose**: JavaScript runtime environment for server-side development

**Features Used:**
- **ES6+ Support**: Modern JavaScript features
- **Event Loop**: Non-blocking I/O operations
- **Module System**: CommonJS and ES modules
- **Process Management**: Environment variables and signals

**Configuration:**
```json
// package.json engine specification
{
  "engines": {
    "node": ">=16.0.0",
    "npm": ">=8.0.0"
  }
}
```

### 2. Express.js 4.18.2
**Purpose**: Web application framework for REST API development

**Key Features:**
- **Middleware Stack**: Request/response processing pipeline
- **Routing**: URL pattern matching and handlers
- **Static Files**: Asset serving capabilities
- **Error Handling**: Centralized error processing

**Server Configuration:**
```javascript
// server.js
const express = require('express');
const app = express();

// Middleware stack
app.use(helmet()); // Security headers
app.use(cors(corsOptions)); // Cross-origin requests
app.use(morgan('combined')); // Request logging
app.use(express.json({ limit: '10mb' })); // JSON parsing
app.use(express.urlencoded({ extended: true })); // URL encoding

// Route handlers
app.use('/api/banking', bankingRoutes);
app.use('/api/event-stream', eventStreamRoutes);
app.use('/api/headless', headlessRoutes);
app.use('/health', healthRoutes);
```

### 3. Azure Event Hubs 5.10.0
**Purpose**: Enterprise-grade event streaming platform

**Features:**
- **Kafka Protocol**: Compatible with Apache Kafka clients
- **Partitioning**: Horizontal scaling and load distribution
- **Consumer Groups**: Multiple application instances
- **Event Retention**: Configurable message persistence

**Service Integration:**
```javascript
// eventHubService.js
const { EventHubConsumerClient } = require('@azure/event-hubs');

class EventHubService {
  constructor() {
    this.connectionString = process.env.CONNECTION_STRING;
    this.consumerClients = new Map();
  }

  async connectToComponent(sessionId, componentKey, clientInfo) {
    const consumerClient = new EventHubConsumerClient(
      'modular-banking',
      this.connectionString
    );

    const subscription = consumerClient.subscribe(
      partitionId => ({
        processEvents: this.processEvents.bind(this, sessionId, componentKey),
        processError: this.processError.bind(this, sessionId, componentKey)
      })
    );

    this.consumerClients.set(`${sessionId}-${componentKey}`, {
      client: consumerClient,
      subscription
    });
  }
}
```

### 4. Security and Middleware Stack

#### Helmet 8.1.0
**Purpose**: Security middleware for HTTP headers

**Security Features:**
- **Content Security Policy**: XSS protection
- **HSTS**: HTTPS enforcement
- **X-Frame-Options**: Clickjacking prevention
- **X-Content-Type-Options**: MIME sniffing protection

#### CORS 2.8.5
**Purpose**: Cross-Origin Resource Sharing configuration

**Configuration:**
```javascript
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 'Authorization', 'x-session-id',
    'x-client-type', 'x-endpoint', 'x-solution'
  ]
};
```

#### Morgan 1.10.0
**Purpose**: HTTP request logging middleware

**Log Format:**
```javascript
app.use(morgan(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms'));
```

## Banking Integration Technologies

### 1. Temenos Banking APIs
**Purpose**: Core banking functionality integration

**API Endpoints:**
- **Party API**: Customer and relationship management
- **Deposits API**: Account and transaction services
- **Lending API**: Loan and credit services
- **Holdings API**: Investment and portfolio management

**Service Configuration:**
```javascript
// temenosConfig.js
const TEMENOS_CONFIG = {
  baseUrl: 'http://modulardemo.northeurope.cloudapp.azure.com',
  services: {
    party: {
      baseUrl: '/ms-party-api/api',
      endpoints: {
        getParty: '/parties/{partyId}',
        searchParties: '/parties/search',
        createParty: '/parties'
      }
    },
    deposits: {
      baseUrl: 'http://deposits-sandbox.northeurope.cloudapp.azure.com/irf-TBC-accounts-container/api',
      endpoints: {
        getAccount: '/accounts/{accountId}',
        getTransactions: '/accounts/{accountId}/transactions',
        createTransaction: '/accounts/{accountId}/transactions'
      }
    },
    lending: {
      baseUrl: 'http://lendings-sandbox.northeurope.cloudapp.azure.com/irf-TBC-lending-container/api',
      endpoints: {
        getLoan: '/loans/{loanId}',
        getLoanSchedule: '/loans/{loanId}/schedule',
        createLoan: '/loans'
      }
    }
  }
};
```

### 2. Axios 1.6.2
**Purpose**: HTTP client for API communication

**Features Used:**
- **Request Interceptors**: Authentication and logging
- **Response Interceptors**: Error handling and transformation
- **Timeout Configuration**: Request timeout management
- **Retry Logic**: Exponential backoff for failed requests

**Configuration:**
```javascript
// apiService.js
const axios = require('axios');

const apiClient = axios.create({
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'Modular-Banking-Demo/1.0'
  }
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method.toUpperCase()} ${config.url}`);
    config.headers['x-request-id'] = generateRequestId();
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status >= 500) {
      console.error('Server error:', error.response.data);
    }
    return Promise.reject(error);
  }
);
```

## Development and Testing Tools

### 1. Jest 29.7.0
**Purpose**: JavaScript testing framework

**Features:**
- **Unit Testing**: Component and function testing
- **Integration Testing**: API and service testing
- **Mock System**: External dependency mocking
- **Coverage Reports**: Code coverage analysis

**Configuration:**
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx}',
    '<rootDir>/src/**/*.{spec,test}.{js,jsx}'
  ],
  moduleNameMapping: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/index.js',
    '!src/setupTests.js'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
```

### 2. React Testing Library 14.1.2
**Purpose**: Component testing utilities

**Features:**
- **User Event Simulation**: Realistic user interactions
- **Accessibility Testing**: Screen reader compatibility
- **Query Methods**: Element selection strategies
- **Async Testing**: Promise and timeout handling

**Testing Example:**
```javascript
// Dashboard.test.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from '../Dashboard';

test('should display banking product modules', async () => {
  render(<Dashboard />);
  
  // Test visibility of banking modules
  expect(screen.getByTestId('deposits-r25-pane')).toBeInTheDocument();
  expect(screen.getByTestId('lending-r24-pane')).toBeInTheDocument();
  expect(screen.getByTestId('pricing-pane')).toBeInTheDocument();
  expect(screen.getByTestId('payments-pane')).toBeInTheDocument();
  
  // Test interactive elements
  const depositsPane = screen.getByTestId('deposits-r25-pane');
  await userEvent.click(depositsPane);
  
  await waitFor(() => {
    expect(screen.getByText('Deposits R25 Details')).toBeInTheDocument();
  });
});
```

### 3. ESLint 8.56.0
**Purpose**: Code quality and style enforcement

**Configuration:**
```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  rules: {
    'no-console': 'warn',
    'no-unused-vars': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error'
  },
  overrides: [
    {
      files: ['**/*.test.js', '**/*.spec.js'],
      rules: {
        'no-console': 'off'
      }
    }
  ]
};
```

### 4. Nodemon 3.0.2
**Purpose**: Development server with automatic restart

**Configuration:**
```json
// nodemon.json
{
  "watch": ["src"],
  "ext": "js,json",
  "ignore": ["**/*.test.js", "node_modules"],
  "env": {
    "NODE_ENV": "development"
  },
  "delay": 1000
}
```

## Event Streaming and Real-Time Technologies

### 1. Server-Sent Events (SSE)
**Purpose**: Real-time event streaming from server to client

**Implementation:**
```javascript
// Frontend EventSource
class EventStreamManager {
  connect(componentKey) {
    const eventSource = new EventSource(
      `/api/event-stream/events/${componentKey}`
    );
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleEvent(data);
    };
    
    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      this.handleReconnection(componentKey);
    };
    
    return eventSource;
  }
}

// Backend SSE endpoint
app.get('/api/event-stream/events/:componentKey', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  
  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };
  
  // Setup event forwarding from Event Hub
  eventHubService.subscribe(req.params.componentKey, sendEvent);
});
```

### 2. KafkaJS 2.2.4
**Purpose**: Apache Kafka client for Node.js

**Usage:**
```javascript
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'modular-banking-demo',
  brokers: [process.env.BOOTSTRAP_SERVERS],
  sasl: {
    mechanism: 'plain',
    username: '$ConnectionString',
    password: process.env.CONNECTION_STRING
  },
  ssl: true
});

const consumer = kafka.consumer({ groupId: 'banking-events' });

await consumer.subscribe({ topic: 'ms-party-outbox' });
await consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    const event = JSON.parse(message.value.toString());
    await processEvent(event);
  }
});
```

## Data Processing and Transformation

### 1. JOLT Transformation Engine
**Purpose**: JSON-to-JSON transformation

**Transformation Types:**
- **Shift**: Move data between paths
- **Default**: Set default values
- **Remove**: Delete unwanted fields
- **Sort**: Order array elements

**Example Transformations:**
```javascript
// Banking data transformation
const bankingTransformation = {
  "shift": {
    "customer": {
      "id": "party.partyId",
      "name": "party.displayName",
      "type": "party.partyType"
    },
    "accounts": "accounts[*].{id:accountId,balance:currentBalance,currency:currencyCode}",
    "metadata": {
      "timestamp": "=now()",
      "source": "=literal('temenos-api')"
    }
  },
  "default": {
    "customer.status": "ACTIVE",
    "accounts[*].status": "OPEN"
  }
};

// Apply transformation
const transformedData = jolt.transform(bankingTransformation, rawData);
```

### 2. UUID 11.1.0
**Purpose**: Unique identifier generation

**Usage:**
```javascript
const { v4: uuidv4, v1: uuidv1 } = require('uuid');

// Session ID generation
const generateSessionId = () => `session-${uuidv4()}`;

// Request ID generation
const generateRequestId = () => `req-${uuidv1()}`;

// Event correlation ID
const generateCorrelationId = () => `corr-${uuidv4()}`;
```

## Process Management and DevOps

### 1. Environment Management
**Purpose**: Configuration and environment variable handling

**Tools:**
- **dotenv 16.3.1**: Environment variable loading
- **cross-env**: Cross-platform environment variables

**Configuration:**
```bash
# .env file structure
NODE_ENV=development
PORT=5011
BACKEND_BASE_URL=http://localhost:5011

# Azure Event Hub
BOOTSTRAP_SERVERS=microservices-eventhub-modularbanking.servicebus.windows.net:9093
CONNECTION_STRING=Endpoint=sb://...;SharedAccessKeyName=...

# SSL Configuration
NODE_TLS_REJECT_UNAUTHORIZED=0
SSL_REJECT_UNAUTHORIZED=false

# Banking APIs
TEMENOS_BASE_URL=http://modulardemo.northeurope.cloudapp.azure.com
TEMENOS_PARTY_BASE_URL=http://modulardemo.northeurope.cloudapp.azure.com/ms-party-api/api
TEMENOS_DEPOSITS_BASE_URL=http://deposits-sandbox.northeurope.cloudapp.azure.com/irf-TBC-accounts-container/api
```

### 2. Process Scripts
**Purpose**: Application lifecycle management

**Start Script (`start-app.sh`):**
```bash
#!/bin/bash

# Configuration
FRONTEND_PORT=3000
BACKEND_PORT=5011
JOLT_PORT=8085

# Function definitions
log_info() { echo -e "\033[0;32m[INFO]\033[0m $1"; }
log_error() { echo -e "\033[0;31m[ERROR]\033[0m $1"; }
log_warning() { echo -e "\033[0;33m[WARNING]\033[0m $1"; }

# Cleanup existing processes
cleanup_port() {
  local port=$1
  local pids=$(lsof -ti:$port 2>/dev/null)
  if [ ! -z "$pids" ]; then
    log_warning "Killing existing processes on port $port"
    echo $pids | xargs kill -9 2>/dev/null
  fi
}

# Start services
start_backend() {
  log_info "Starting backend server on port $BACKEND_PORT..."
  cd demoflow-backend
  npm start > ../backend.log 2>&1 &
  echo $! > ../backend.pid
  cd ..
}

start_frontend() {
  log_info "Starting frontend server on port $FRONTEND_PORT..."
  cd modular-banking-frontend
  npm start > ../frontend.log 2>&1 &
  echo $! > ../frontend.pid
  cd ..
}

start_jolt() {
  log_info "Starting JOLT service on port $JOLT_PORT..."
  cd tools/jolt-service
  ./start-jolt.sh > ../../jolt.log 2>&1 &
  echo $! > ../../jolt.pid
  cd ../..
}
```

**Stop Script (`stop-app.sh`):**
```bash
#!/bin/bash

stop_service() {
  local service_name=$1
  local pid_file="${service_name}.pid"
  
  if [ -f "$pid_file" ]; then
    local pid=$(cat "$pid_file")
    if ps -p $pid > /dev/null 2>&1; then
      log_info "Stopping $service_name (PID: $pid)"
      kill $pid
      sleep 2
      
      if ps -p $pid > /dev/null 2>&1; then
        log_warning "Force killing $service_name"
        kill -9 $pid
      fi
    fi
    rm -f "$pid_file"
  fi
}

# Stop all services
stop_service "backend"
stop_service "frontend"
stop_service "jolt"

# Cleanup log files
rm -f *.log
```

### 3. Monitoring and Health Checks
**Purpose**: Service monitoring and health verification

**Health Check Implementation:**
```javascript
// health.js
const healthCheck = {
  services: {
    server: () => Promise.resolve('healthy'),
    database: () => checkDatabaseConnection(),
    eventHub: () => eventHubService.healthCheck(),
    externalAPIs: () => checkExternalAPIs()
  },

  async getStatus() {
    const results = {};
    
    for (const [service, check] of Object.entries(this.services)) {
      try {
        results[service] = await check();
      } catch (error) {
        results[service] = { status: 'unhealthy', error: error.message };
      }
    }
    
    return {
      status: Object.values(results).every(r => r === 'healthy' || r.status === 'healthy') 
        ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services: results,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version
    };
  }
};
```

## Build and Deployment Tools

### 1. Create React App
**Purpose**: React application build and development environment

**Features:**
- **Webpack Configuration**: Module bundling and optimization
- **Babel Transpilation**: JavaScript compatibility
- **Hot Module Replacement**: Development server features
- **Production Optimization**: Code splitting and minification

**Build Scripts:**
```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  }
}
```

### 2. Docker Integration
**Purpose**: Containerization for consistent deployment

**Frontend Dockerfile:**
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

**Backend Dockerfile:**
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5011
CMD ["npm", "start"]
```

**Docker Compose:**
```yaml
version: '3.8'
services:
  frontend:
    build: ./modular-banking-frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_BACKEND_URL=http://backend:5011
    depends_on:
      - backend

  backend:
    build: ./demoflow-backend
    ports:
      - "5011:5011"
    environment:
      - NODE_ENV=production
      - PORT=5011
    volumes:
      - ./.env:/app/.env
```

## Security and Compliance Tools

### 1. Security Headers (Helmet)
**Purpose**: HTTP security headers configuration

**Security Policies:**
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "https:"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

### 2. Input Validation
**Purpose**: Request validation and sanitization

**Validation Middleware:**
```javascript
const Joi = require('joi');

const validateRequest = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map(d => d.message)
    });
  }
  next();
};

// Usage
const partySchema = Joi.object({
  name: Joi.string().required().min(2).max(100),
  email: Joi.string().email(),
  phone: Joi.string().pattern(/^\+?[\d\s-()]+$/)
});

app.post('/api/parties', validateRequest(partySchema), createParty);
```

## Performance and Optimization Tools

### 1. Connection Pooling
**Purpose**: Efficient resource management

**HTTP Agent Configuration:**
```javascript
const http = require('http');
const https = require('https');

const httpAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 60000
});

const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 60000
});
```

### 2. Caching Strategies
**Purpose**: Response caching and performance optimization

**Memory Cache Implementation:**
```javascript
const NodeCache = require('node-cache');

class CacheManager {
  constructor() {
    this.cache = new NodeCache({
      stdTTL: 300, // 5 minutes default
      checkperiod: 60, // Check for expired keys every minute
      maxKeys: 1000
    });
  }

  async get(key, fetcher, ttl = 300) {
    let value = this.cache.get(key);
    
    if (value === undefined) {
      value = await fetcher();
      this.cache.set(key, value, ttl);
    }
    
    return value;
  }

  invalidate(pattern) {
    const keys = this.cache.keys().filter(key => key.includes(pattern));
    this.cache.del(keys);
  }
}
```

This comprehensive technology documentation provides detailed information about every tool and technology used in the Modular Banking Demo, including their purpose, configuration, and implementation details within the application architecture. 