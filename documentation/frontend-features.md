# Frontend Application Documentation

## Overview

The Modular Banking Demo frontend is a comprehensive React-based banking application that demonstrates the transition from monolithic to microservices architecture. Built with React 19 and modern web technologies, it provides both customer-facing and technical interfaces for banking operations.

## Technology Stack

### Core Technologies
- **React 19.1.0** - Modern React with latest features
- **React Router DOM 7.6.2** - Client-side routing
- **React Scripts 5.0.1** - Build tooling and development server
- **JOLT Core 2.8.9** - Data transformation capabilities

### Development & Testing
- **@testing-library/react 16.3.0** - Component testing
- **@testing-library/jest-dom 6.6.3** - DOM testing utilities
- **@testing-library/user-event 14.6.1** - User interaction testing

### Build Configuration
- **Port**: 3011 (configurable via FRONTEND_PORT environment variable)
- **Build Tool**: Create React App with custom configurations
- **Browser Support**: Modern browsers (Chrome, Firefox, Safari latest versions)

## Application Architecture

### Folder Structure
```
modular-banking-frontend/
├── public/                         # Static assets
├── src/                           # Source code
│   ├── __tests__/                 # ALL TEST FILES (Create React App pattern)
│   │   ├── App.test.js           # App component tests
│   │   ├── Dashboard.test.js     # Dashboard component tests
│   │   ├── HeadlessV3.test.js    # HeadlessV3 component tests
│   │   ├── ModularArchitecture.test.js # ModularArchitecture tests
│   │   └── SupportingServices.test.js # SupportingServices tests
│   ├── components/                # Reusable components
│   │   ├── EventStream.js        # Real-time event streaming
│   │   ├── APIViewer.js          # REST API testing interface
│   │   ├── MobileApp/            # Mobile banking simulation
│   │   ├── JoltMapper/           # Data transformation tools
│   │   └── AdditionalDemos.js    # Additional demo features
│   ├── services/                 # API service layer
│   │   └── apiService.js         # Backend communication
│   ├── config/                   # Configuration files
│   │   └── apiConfig.js          # API endpoints configuration
│   ├── utils/                    # Utility functions
│   ├── styles/                   # Global styles
│   ├── App.js                    # Main application component
│   ├── Dashboard.js              # Main dashboard
│   ├── DemoFlow.js               # Demo flow orchestration
│   ├── ModularArchitecture.js    # Architecture documentation
│   ├── SupportingServices.js     # Supporting services info
│   └── index.js                  # Application entry point
├── package.json                  # Dependencies and scripts
└── README.md                     # Project documentation
```

## Core Components

### 1. Dashboard Component (`Dashboard.js`)
The main landing page showcasing banking product modules.

**Features:**
- **Banking Product Modules**: Four main rectangles representing:
  - 🏦 **Deposits R25**: Comprehensive deposit management system
  - 💰 **Lending R24**: Advanced lending platform
  - 📊 **Pricing**: Dynamic pricing engine
  - 💳 **Payments**: Modern payments processing platform

- **Circular Information Panes**:
  - **Modular Architecture**: Blueprint for progressive renovation
  - **Supporting Services**: Microservices design principles

**Technical Details:**
- Responsive grid layout
- Accessibility-compliant (WCAG 2.1 AA)
- Temenos banking theme (Blue: #1e3a8a, #3b82f6)
- Keyboard navigation support
- Interactive pane expansion with detailed product information

### 2. DemoFlow Component (`DemoFlow.js`)
Central orchestration component for different demo experiences.

**Features:**
- **Tab Navigation**: Multiple demo interfaces
  - **Overview**: Welcome and feature introduction
  - **API Viewer**: Interactive REST API testing
  - **Event Stream**: Real-time component monitoring
  - **Mobile App**: Customer-facing banking simulation
  - **Branch App**: Employee interface (coming soon)
  - **Architecture**: Dynamic PUML visualization (coming soon)
  - **Assistant**: RAG-powered documentation helper (coming soon)

**Technical Details:**
- Loading states with spinner animations
- Keyboard navigation (Escape to return to dashboard)
- Error handling and user feedback
- Accessibility features with ARIA labels

### 3. API Viewer Component (`APIViewer.js`)
Interactive REST API testing interface for banking solutions.

**Features:**
- **Service Selection**: Choose from Party, Deposits, Lending, Holdings
- **Endpoint Configuration**: Dynamic endpoint selection with parameter substitution
- **HTTP Method Support**: GET, POST, PUT, DELETE operations
- **Payload Management**: JSON payload editor with validation
- **Real-time Execution**: Live API calls with response display
- **Configuration Management**: Editable Party ID, Account Reference, Loan Arrangement ID

**API Integration:**
- Connects to backend via `/api/headless/track` endpoint
- Supports all Temenos banking APIs
- Real-time request/response handling
- Error handling and timeout management

**Technical Details:**
- Syntax highlighting for JSON
- Copy-to-clipboard functionality
- Form validation and error display
- Responsive design with professional styling

### 4. Event Stream Component (`EventStream.js`)
Real-time event monitoring with drag-and-drop component management.

**Features:**
- **Component Selection**: Banking modules (Party, Deposits, Lending, EventStore)
- **Real-time Events**: Server-Sent Events (SSE) streaming
- **Drag-and-Drop**: Native HTML5 drag-and-drop for component reordering
- **Event Visualization**: Color-coded event types with expandable details
- **Statistics Display**: Active connections, event counts, uptime tracking

**Technical Details:**
- 90% viewport width with 3-column grid layout
- WebSocket alternative using SSE for real-time communication
- React 19 compatible drag-and-drop implementation
- Event source connection management
- Session-based cleanup and reconnection logic

### 5. Mobile App Component (`MobileApp/MobileApp.js`)
Customer-facing mobile banking simulation.

**Features:**
- **Home Screen**: Account overview and quick actions
- **Profile Management**: Customer information display
- **Account Management**: Balance checking and transaction history
- **Money Transfer**: Inter-account transfer functionality
- **Loan Services**: Loan details and payment schedules
- **Transaction History**: Detailed transaction viewing

**Technical Details:**
- Mobile-responsive design (smartphone resolution)
- Form validation and error handling
- Real-time balance updates
- Confirmation dialogs for transactions
- Accessibility-optimized for mobile users

### 6. Supporting Services Component (`SupportingServices.js`)
Information display for microservices architecture.

**Features:**
- **Business Services**: Holdings, Party, Generic Configuration
- **Infrastructure Services**: API Gateway, Service Discovery, Config Server
- **Security Services**: OAuth2, Certificate Management, Key Management
- **Monitoring Services**: Observability, Metrics, Health Checks

**Technical Details:**
- Interactive service cards with detailed descriptions
- Feature lists and capability documentation
- Professional styling matching banking standards

### 7. JOLT Mapper Component (`JoltMapper/JoltMapper.js`)
Data transformation and mapping utility.

**Features:**
- **Data Transformation**: JOLT specification-based transformations
- **Schema Mapping**: Between different data formats
- **Real-time Processing**: High-performance transformations
- **AI-Powered Generation**: LLM-assisted JOLT spec creation
- **Configuration Integration**: Linked to Generic Configuration service

**Technical Details:**
- Sidebar navigation with multiple transformation modes
- JSON validation and syntax highlighting
- Streaming AI output for spec generation
- Maven integration for JOLT processing

## Styling and Design System

### Theme Configuration
- **Primary Colors**: Temenos Banking Blue (#1e3a8a, #3b82f6)
- **Supporting Colors**: Teal (#5CB8B2), Purple (#8246AF), Navy (#283275)
- **Typography**: System fonts with fallbacks (-apple-system, BlinkMacSystemFont, 'Segoe UI')
- **Gradients**: Professional gradient backgrounds for modern appearance

### Responsive Design
- **Mobile First**: Optimized for smartphone and tablet viewing
- **Breakpoints**: Standard responsive breakpoints for all screen sizes
- **Grid Systems**: CSS Grid and Flexbox for layout management
- **Accessibility**: WCAG 2.1 AA compliance throughout

### Animation and Transitions
- **Subtle Animations**: Professional, banking-appropriate transitions
- **Loading States**: Spinners and skeleton screens
- **Hover Effects**: Card elevations and color changes
- **Focus Management**: Clear focus indicators for keyboard navigation

## Configuration and Environment

### Environment Variables
The frontend uses React environment variables (prefixed with `REACT_APP_`):

```bash
# Backend Communication
REACT_APP_BACKEND_URL=http://localhost:5011

# Banking API Endpoints
REACT_APP_PARTY_API_URL=http://modulardemo.northeurope.cloudapp.azure.com/ms-party-api/api
REACT_APP_DEPOSITS_API_URL=http://deposits-sandbox.northeurope.cloudapp.azure.com/irf-TBC-accounts-container/api
REACT_APP_LENDING_API_URL=http://lendings-sandbox.northeurope.cloudapp.azure.com/irf-TBC-lending-container/api
REACT_APP_HOLDINGS_API_URL=http://modulardemo.northeurope.cloudapp.azure.com/ms-holdings-api/api

# Individual API Endpoints (configured per component)
REACT_APP_PARTY_CREATE_ENDPOINT=/v5.0.0/party/parties
REACT_APP_PARTY_GET_BY_ID_ENDPOINT=/v5.0.0/party/parties/{partyId}
# ... (additional endpoints as configured in .env)
```

### API Configuration (`apiConfig.js`)
Centralized configuration for all API endpoints with:
- Environment variable validation
- Dynamic URL building with parameter substitution
- Component-based endpoint organization
- Fallback defaults for development

## Testing Strategy

### Test Organization
All tests are located in `/src/__tests__/` following Create React App conventions:
- **Component Tests**: Individual component functionality
- **Integration Tests**: Component interaction testing
- **Accessibility Tests**: WCAG compliance verification
- **API Tests**: Service layer testing

### Testing Tools
- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing utilities
- **@testing-library/jest-dom**: DOM-specific matchers
- **@testing-library/user-event**: User interaction simulation

### Test Coverage Areas
- Component rendering and state management
- User interactions and event handling
- API integration and error scenarios
- Accessibility and keyboard navigation
- Responsive design and mobile compatibility

## Development Workflow

### Available Scripts
```bash
# Development server (runs on port 3011)
npm start

# Build for production
npm build

# Run test suite
npm test

# Run tests without watch mode
npm test -- --watchAll=false

# Run specific test file
npm test -- --testNamePattern="ComponentName"
```

### Development Server
- **Hot Reload**: Automatic refresh on file changes
- **Error Overlay**: In-browser error reporting
- **Source Maps**: Development debugging support
- **HTTPS Support**: Available for testing secure features

### Build Process
- **Code Splitting**: Automatic bundle optimization
- **Asset Optimization**: Image and CSS minification
- **Progressive Web App**: Service worker generation
- **Browser Compatibility**: Polyfills for older browsers

## Integration with Backend

### Communication Patterns
- **REST API**: Primary communication via HTTP/HTTPS
- **Server-Sent Events (SSE)**: Real-time event streaming
- **CORS Configuration**: Proper cross-origin setup
- **Error Handling**: Comprehensive error boundary implementation

### Data Flow
1. **User Interaction**: Component state changes
2. **API Service Layer**: Centralized API communication
3. **Backend Integration**: Real API calls (no mocking)
4. **State Management**: Component state updates
5. **UI Updates**: Reactive interface changes

### Security Considerations
- **Environment Variable Protection**: Sensitive data in backend only
- **API Key Management**: No client-side API keys
- **CORS Enforcement**: Strict origin validation
- **Content Security Policy**: XSS protection

## Performance Optimization

### Bundle Optimization
- **Code Splitting**: Route-based and component-based splitting
- **Tree Shaking**: Unused code elimination
- **Lazy Loading**: On-demand component loading
- **Asset Caching**: Long-term browser caching

### Runtime Performance
- **React Optimization**: Memo, useMemo, useCallback usage
- **Virtual Scrolling**: For large data sets
- **Debounced Inputs**: Reduced API calls
- **Image Optimization**: Responsive images and lazy loading

### Monitoring and Analytics
- **Web Vitals**: Core performance metrics
- **Error Tracking**: Component error boundaries
- **Performance Profiling**: React DevTools integration
- **Bundle Analysis**: Webpack bundle analyzer

## Accessibility Features

### WCAG 2.1 AA Compliance
- **Semantic HTML**: Proper HTML structure and elements
- **ARIA Labels**: Screen reader support
- **Keyboard Navigation**: Full keyboard accessibility
- **Focus Management**: Visible focus indicators
- **Color Contrast**: Sufficient contrast ratios
- **Alternative Text**: Image descriptions

### Assistive Technology Support
- **Screen Readers**: NVDA, JAWS, VoiceOver compatibility
- **Keyboard Only**: Complete functionality without mouse
- **Voice Commands**: Dragon NaturallySpeaking support
- **High Contrast**: Windows high contrast mode support

## Browser Compatibility

### Supported Browsers
- **Chrome**: Last 2 versions
- **Firefox**: Last 2 versions
- **Safari**: Last 2 versions
- **Edge**: Last 2 versions

### Polyfills and Fallbacks
- **ES6+ Features**: Babel transpilation
- **CSS Features**: PostCSS polyfills
- **API Features**: Fetch API polyfill
- **Progressive Enhancement**: Graceful degradation

## Deployment Considerations

### Build Artifacts
- **Static Files**: HTML, CSS, JS bundles
- **Assets**: Images, fonts, icons
- **Service Worker**: Offline functionality
- **Manifest**: PWA configuration

### Environment Configuration
- **Production URLs**: Live API endpoints
- **CDN Integration**: Asset delivery optimization
- **Caching Strategy**: Browser and CDN caching
- **Monitoring**: Error tracking and analytics

### Security Headers
- **Content Security Policy**: XSS protection
- **Strict Transport Security**: HTTPS enforcement
- **X-Frame-Options**: Clickjacking protection
- **X-Content-Type-Options**: MIME sniffing protection 