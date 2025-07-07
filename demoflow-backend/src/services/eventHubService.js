/**
 * EventHub Service
 * Handles real Azure Event Hub connections using Kafka protocol
 */

const { Kafka, logLevel } = require('kafkajs');

// Topic mapping
const KAFKA_TOPICS = {
  'party': 'ms-party-outbox',
  'deposits': 'deposits-event-topic',
  'lending': 'lending-event-topic',
  'eventstore': 'ms-eventstore-inbox-topic',
  'adapter': 'ms-adapterservice-event-topic',
  'holdings': 'ms-holdings-event-topic',
  'api-call': 'ms-apicall-topic' // New topic for API tracking
};

class EventHubService {
  constructor() {
    this.kafka = null;
    this.consumers = new Map(); // sessionId -> Map(component -> consumer)
    this.eventCallbacks = new Map(); // sessionId -> Map(component -> callback)
    this.ready = false;
    this.isInitialized = false; // Track initialization state
    this.initializing = false;
    this.connectionQueue = []; // Queue for connection requests
    this.isProcessingQueue = false;
    this.maxConcurrentConnections = 2; // Limit concurrent connections
    this.activeConnections = 0;
    this.stats = {
      totalConnections: 0,
      activeConnections: 0,
      totalMessages: 0,
      errors: 0
    };
    this.initialize();
  }

  initialize() {
    console.log('🔧 [EventHubService] Initializing EventHub service...');
    
    const servers = process.env.BOOTSTRAP_SERVERS;
    const connectionString = process.env.CONNECTION_STRING;
    
    console.log('🔍 [EventHubService] Environment check:', {
      BOOTSTRAP_SERVERS: servers ? `${servers.substring(0, 50)}...` : 'NOT SET',
      CONNECTION_STRING: connectionString ? `SET (length: ${connectionString.length})` : 'NOT SET'
    });

    // Simplified validation - just check basic existence
    if (!servers || !connectionString || 
        typeof servers !== 'string' || typeof connectionString !== 'string' ||
        servers.trim().length === 0 || connectionString.trim().length === 0) {
      
      console.warn('⚠️  [EventHubService] Environment variables not properly loaded. Service will retry initialization when needed.');
      console.warn('    - BOOTSTRAP_SERVERS valid:', !!servers && typeof servers === 'string' && servers.trim().length > 0);
      console.warn('    - CONNECTION_STRING valid:', !!connectionString && typeof connectionString === 'string' && connectionString.trim().length > 0);
      
      this.isInitialized = false;
      this.ready = false;
      return;
    }

    try {
      // SSL configuration
      const sslRejectUnauthorized = process.env.SSL_REJECT_UNAUTHORIZED;
      const sslConfig = {
        rejectUnauthorized: sslRejectUnauthorized !== 'false',
        servername: servers.split(':')[0],
      };
      
      console.log('🔐 [EventHubService] SSL Configuration:', sslConfig);

      // Initialize Kafka client with Azure Event Hub configuration
      this.kafka = new Kafka({
        clientId: 'demoflow-backend',
        brokers: [servers],
        ssl: sslConfig,
        sasl: {
          mechanism: 'plain',
          username: '$ConnectionString',
          password: connectionString,
        },
        connectionTimeout: 60000,
        requestTimeout: 60000,
        retry: {
          initialRetryTime: 300,
          retries: 10,
          factor: 2,
          maxRetryTime: 30000
        },
        socketTimeout: 60000,
        heartbeatInterval: 30000,
        sessionTimeout: 60000,
        logLevel: logLevel.INFO,
        logCreator: (level) => ({ namespace, label, log }) => {
          const { message, ...extra } = log;
          console.log(`[KafkaJS ${label}] ${message}`, extra);
        }
      });

      this.isInitialized = true;
      this.ready = true;
      console.log('✅ [EventHubService] EventHub service initialized successfully');
    } catch (error) {
      console.error('❌ [EventHubService] Failed to initialize EventHub service:', error);
      this.isInitialized = false;
      this.ready = false;
    }
  }

  /**
   * Process connection queue
   */
  async processConnectionQueue() {
    if (this.isProcessingQueue || this.connectionQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.connectionQueue.length > 0 && this.activeConnections < this.maxConcurrentConnections) {
      const { sessionId, component, eventCallback, resolve, reject } = this.connectionQueue.shift();
      
      try {
        this.activeConnections++;
        console.log(`Processing connection for ${component} (${this.activeConnections}/${this.maxConcurrentConnections} active)`);
        
        const result = await this._connectToComponentInternal(sessionId, component, eventCallback);
        resolve(result);
      } catch (error) {
        reject(error);
      } finally {
        this.activeConnections--;
        console.log(`Connection completed for ${component} (${this.activeConnections}/${this.maxConcurrentConnections} active)`);
      }
    }

    this.isProcessingQueue = false;
    
    // If there are still items in the queue, process them after a delay
    if (this.connectionQueue.length > 0) {
      setTimeout(() => this.processConnectionQueue(), 1000);
    }
  }

  /**
   * Connect to a component's event stream (queued version)
   */
  async connectToComponent(sessionId, component, eventCallback) {
    // Ensure service is properly initialized
    if (!this.isReady() || !this.isInitialized) {
      console.log('🔄 [EventHubService] Service not ready, attempting re-initialization...');
      this.initialize();
      
      // Give it a moment to initialize
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!this.isReady() || !this.isInitialized) {
        throw new Error('EventHub service initialization failed - check environment variables and network connectivity');
      }
    }

    // Always ensure we have environment variables
    const servers = process.env.BOOTSTRAP_SERVERS;
    const connectionString = process.env.CONNECTION_STRING;
    
    if (!servers || !connectionString) {
      throw new Error('EventHub service initialization failed - check environment variables');
    }

    const topic = KAFKA_TOPICS[component];
    if (!topic) {
      throw new Error(`Unknown component: ${component}`);
    }

    // Check if already connected
    const sessionConsumers = this.consumers.get(sessionId);
    if (sessionConsumers?.has(component)) {
      console.log(`Already connected to ${component} for session ${sessionId}`);
      return { success: true, topic, groupId: 'existing-connection' };
    }

    // Queue the connection request
    return new Promise((resolve, reject) => {
      this.connectionQueue.push({ sessionId, component, eventCallback, resolve, reject });
      this.processConnectionQueue();
    });
  }

  /**
   * Internal connection method (actual connection logic)
   */
  async _connectToComponentInternal(sessionId, component, eventCallback) {
    const topic = KAFKA_TOPICS[component];
    
    // Clean up existing connection if any
    await this.disconnectFromComponent(sessionId, component);

    try {
      // Ensure the shared Kafka client from the constructor is initialized and ready.
      if (!this.kafka || !this.isReady()) {
        console.error('❌ [EventHubService] Main Kafka client is not ready. Cannot create consumer.');
        // Attempt a single re-initialization.
        this.initialize();
        if (!this.kafka || !this.isReady()) {
          throw new Error('EventHub service could not be initialized. Check server logs.');
        }
        console.log('✅ [EventHubService] Re-initialization was successful.');
      }

      // Create a unique consumer group for this session and component.
      const groupId = `event-stream-${component}-${sessionId}-${Date.now()}`;
      
      console.log(`🔧 [EventHubService] Creating consumer for groupId: ${groupId} using the shared Kafka client.`);
      
      // Create the consumer from the single, shared this.kafka instance.
      const consumer = this.kafka.consumer({ 
        groupId,
        sessionTimeout: 30000,
        heartbeatInterval: 10000,
      });

      console.log(`Attempting to connect consumer to ${component} (${topic}) for session ${sessionId}...`);
      
      await consumer.connect();
      console.log(`✅ [EventHubService] Consumer connected for ${component}`);
      
      await consumer.subscribe({ topic, fromBeginning: false });
      console.log(`✅ [EventHubService] Subscribed to topic ${topic} for ${component}`);

      // Store consumer and callback
      if (!this.consumers.has(sessionId)) {
        this.consumers.set(sessionId, new Map());
        this.eventCallbacks.set(sessionId, new Map());
      }
      this.consumers.get(sessionId).set(component, consumer);
      this.eventCallbacks.get(sessionId).set(component, eventCallback);

      // Start consuming events - don't await this as it runs indefinitely
      consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const eventData = this.formatEventMessage(message, topic, partition);
            
            // Send to callback if still connected
            const callback = this.eventCallbacks.get(sessionId)?.get(component);
            if (callback) {
              callback(eventData);
            }
          } catch (error) {
            console.error(`Error processing message for ${component}:`, error);
          }
        },
      });

      console.log(`✅ Connected to ${component} (${topic}) for session ${sessionId}`);
      return { success: true, topic, groupId };

    } catch (error) {
      console.error(`❌ Failed to connect to ${component}:`, error.message);
      console.error(`❌ Error details:`, {
        message: error.message,
        code: error.code,
        type: error.constructor.name
      });
      throw error;
    }
  }

  /**
   * Disconnect from a component's event stream
   */
  async disconnectFromComponent(sessionId, component) {
    const sessionConsumers = this.consumers.get(sessionId);
    const sessionCallbacks = this.eventCallbacks.get(sessionId);

    if (sessionConsumers?.has(component)) {
      const consumer = sessionConsumers.get(component);
      try {
        await consumer.disconnect();
        console.log(`Disconnected from ${component} for session ${sessionId}`);
      } catch (error) {
        console.error(`Error disconnecting from ${component}:`, error);
      }
      
      sessionConsumers.delete(component);
      sessionCallbacks?.delete(component);

      // Clean up empty session maps
      if (sessionConsumers.size === 0) {
        this.consumers.delete(sessionId);
        this.eventCallbacks.delete(sessionId);
      }
    }
  }

  /**
   * Clean up all connections for a session
   */
  async cleanupSession(sessionId) {
    const sessionConsumers = this.consumers.get(sessionId);
    if (!sessionConsumers) {
      return { connectionsTerminated: 0 };
    }

    let connectionsTerminated = 0;
    const components = Array.from(sessionConsumers.keys());

    for (const component of components) {
      try {
        await this.disconnectFromComponent(sessionId, component);
        connectionsTerminated++;
      } catch (error) {
        console.error(`Error cleaning up ${component} for session ${sessionId}:`, error);
      }
    }

    console.log(`Session ${sessionId} cleanup complete: ${connectionsTerminated} connections terminated`);
    return { connectionsTerminated };
  }

  /**
   * Format Kafka message for frontend consumption
   */
  formatEventMessage(message, topic, partition) {
    try {
      // Parse message value
      let payload;
      try {
        payload = JSON.parse(message.value.toString());
      } catch {
        payload = message.value.toString();
      }

      // Format timestamp
      const timestamp = message.timestamp 
        ? new Date(parseInt(message.timestamp)).toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
        : new Date().toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });

      return {
        type: 'event',
        data: {
          topic,
          partition,
          offset: message.offset,
          timestamp,
          key: message.key ? message.key.toString() : null,
          payload
        }
      };
    } catch (error) {
      console.error('Error formatting event message:', error);
      return {
        type: 'error',
        message: `Error formatting message: ${error.message}`
      };
    }
  }

  /**
   * Get connection status for a session
   */
  getSessionStatus(sessionId) {
    const sessionConsumers = this.consumers.get(sessionId);
    if (!sessionConsumers) {
      return { connected: [], total: 0 };
    }

    const connected = Array.from(sessionConsumers.keys());
    return { connected, total: connected.length };
  }

  /**
   * Network diagnostic function
   */
  async diagnoseNetworkConnectivity() {
    const BOOTSTRAP_SERVERS = process.env.BOOTSTRAP_SERVERS;
    const hostname = BOOTSTRAP_SERVERS.split(':')[0];
    const port = BOOTSTRAP_SERVERS.split(':')[1];
    
    console.log('🔍 Running network diagnostics...');
    console.log(`Target: ${hostname}:${port}`);
    
    // Import required modules for diagnostics
    const dns = require('dns').promises;
    const net = require('net');
    
    try {
      // Test DNS resolution
      console.log('Testing DNS resolution...');
      const addresses = await dns.resolve4(hostname);
      console.log(`✅ DNS resolution successful: ${addresses.join(', ')}`);
      
      // Test basic TCP connectivity
      console.log('Testing TCP connectivity...');
      const socket = new net.Socket();
      
      const connectPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          socket.destroy();
          reject(new Error('TCP connection timeout'));
        }, 10000);
        
        socket.connect(port, hostname, () => {
          clearTimeout(timeout);
          socket.destroy();
          resolve();
        });
        
        socket.on('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });
      
      await connectPromise;
      console.log('✅ TCP connectivity successful');
      
    } catch (error) {
      console.error('❌ Network diagnostic failed:', error.message);
      
      if (error.message.includes('ENOTFOUND')) {
        console.error('DNS resolution failed - check network connectivity');
      } else if (error.message.includes('ECONNREFUSED')) {
        console.error('Connection refused - port may be blocked by firewall');
      } else if (error.message.includes('timeout')) {
        console.error('Connection timeout - corporate firewall likely blocking the connection');
      }
    }
  }

  /**
   * Check if the service is ready
   */
  isReady() {
    return this.ready && this.kafka !== null;
  }

  /**
   * Get service statistics
   */
  getStats() {
    const totalSessions = this.consumers.size;
    let totalConnections = 0;

    for (const sessionConsumers of this.consumers.values()) {
      totalConnections += sessionConsumers.size;
    }

    return {
      ready: this.isReady(),
      sessions: { active: totalSessions },
      connections: { 
        total: totalConnections,
        active: this.activeConnections,
        maxConcurrent: this.maxConcurrentConnections,
        queued: this.connectionQueue.length
      },
      topics: Object.keys(KAFKA_TOPICS)
    };
  }

  /**
   * Clear connection queue
   */
  clearConnectionQueue() {
    console.log(`Clearing connection queue with ${this.connectionQueue.length} pending connections`);
    this.connectionQueue.forEach(({ reject }) => {
      reject(new Error('Connection queue cleared'));
    });
    this.connectionQueue = [];
    this.isProcessingQueue = false;
    this.activeConnections = 0;
  }

  /**
   * Shutdown the service
   */
  async shutdown() {
    console.log('Shutting down EventHub service...');
    
    // Clear connection queue
    this.clearConnectionQueue();
    
    for (const sessionId of this.consumers.keys()) {
      await this.cleanupSession(sessionId);
    }

    console.log('EventHub service shutdown complete');
  }

  /**
   * Send a single event to a specific topic
   */
  async sendEvent(topicKey, eventData) {
    if (!this.kafka || !this.ready) {
      throw new Error('EventHub service not initialized or not ready');
    }

    const topic = KAFKA_TOPICS[topicKey];
    if (!topic) {
      throw new Error(`Unknown topic key: ${topicKey}`);
    }

    const producer = this.kafka.producer({
        maxInFlightRequests: 1,
        idempotent: true,
        transactionalId: `demoflow-producer-${Date.now()}`
    });

    try {
      await producer.connect();
      await producer.send({
        topic: topic,
        messages: [
          {
            key: eventData.request?.uri || `event-${Date.now()}`,
            value: JSON.stringify(eventData)
          }
        ],
      });
      console.log(`Event sent to topic: ${topic}`);
    } finally {
      await producer.disconnect();
    }
  }
}

// Export singleton instance
let eventHubServiceInstance = null;

function getEventHubService() {
  if (!eventHubServiceInstance) {
    eventHubServiceInstance = new EventHubService();
  }
  return eventHubServiceInstance;
}

module.exports = {
  EventHubService,
  getEventHubService,
  KAFKA_TOPICS
}; 