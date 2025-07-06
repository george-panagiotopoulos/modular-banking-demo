#!/usr/bin/env node

/**
 * SASL Authentication Debug Script
 * Helps diagnose SASL plain authentication issues with Azure Event Hub
 */

const { Kafka } = require('kafkajs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function debugSaslAuth() {
  console.log('🔍 SASL Authentication Debug');
  console.log('============================');
  
  const BOOTSTRAP_SERVERS = process.env.BOOTSTRAP_SERVERS;
  const CONNECTION_STRING = process.env.CONNECTION_STRING;
  
  console.log('Environment Variables:');
  console.log('  BOOTSTRAP_SERVERS:', BOOTSTRAP_SERVERS ? '✅ Set' : '❌ Missing');
  console.log('  CONNECTION_STRING:', CONNECTION_STRING ? '✅ Set' : '❌ Missing');
  
  if (!BOOTSTRAP_SERVERS || !CONNECTION_STRING) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
  }
  
  // Parse connection string to extract components
  console.log('\nConnection String Analysis:');
  const connectionParts = CONNECTION_STRING.split(';');
  const connectionMap = {};
  
  connectionParts.forEach(part => {
    const [key, value] = part.split('=');
    if (key && value) {
      connectionMap[key] = value;
    }
  });
  
  console.log('  Endpoint:', connectionMap['Endpoint'] || '❌ Missing');
  console.log('  SharedAccessKeyName:', connectionMap['SharedAccessKeyName'] || '❌ Missing');
  console.log('  SharedAccessKey:', connectionMap['SharedAccessKey'] ? '✅ Present' : '❌ Missing');
  
  // Test SASL configuration
  console.log('\nSASL Configuration Test:');
  
  const saslConfig = {
    mechanism: 'plain',
    username: '$ConnectionString',
    password: CONNECTION_STRING,
  };
  
  console.log('  Mechanism:', saslConfig.mechanism);
  console.log('  Username:', saslConfig.username);
  console.log('  Password length:', saslConfig.password.length);
  console.log('  Password starts with:', saslConfig.password.substring(0, 20) + '...');
  
  // Test Kafka client creation
  console.log('\nKafka Client Creation Test:');
  
  try {
    const kafka = new Kafka({
      clientId: 'sasl-debug-test',
      brokers: [BOOTSTRAP_SERVERS],
      ssl: {
        rejectUnauthorized: false,
        servername: BOOTSTRAP_SERVERS.split(':')[0],
      },
      sasl: saslConfig,
      connectionTimeout: 30000,
      requestTimeout: 30000,
    });
    
    console.log('  ✅ Kafka client created successfully');
    
    // Test consumer creation
    console.log('\nConsumer Creation Test:');
    const consumer = kafka.consumer({ 
      groupId: 'sasl-debug-group',
      sessionTimeout: 30000,
    });
    
    console.log('  ✅ Consumer created successfully');
    
    // Test connection
    console.log('\nConnection Test:');
    await consumer.connect();
    console.log('  ✅ SASL authentication successful');
    
    await consumer.disconnect();
    console.log('  ✅ Connection closed successfully');
    
    console.log('\n🎉 All SASL authentication tests passed!');
    
  } catch (error) {
    console.error('\n❌ SASL authentication failed:');
    console.error('  Error:', error.message);
    console.error('  Code:', error.code);
    console.error('  Type:', error.constructor.name);
    
    if (error.message.includes('SASL')) {
      console.error('\n💡 SASL-specific troubleshooting:');
      console.error('  1. Check if connection string is valid and not expired');
      console.error('  2. Verify SharedAccessKeyName and SharedAccessKey are correct');
      console.error('  3. Ensure the Event Hub namespace is accessible');
      console.error('  4. Check if the connection string has proper permissions');
    }
    
    if (error.message.includes('null')) {
      console.error('\n💡 Null value troubleshooting:');
      console.error('  1. Connection string may be malformed');
      console.error('  2. Environment variable may not be loaded correctly');
      console.error('  3. Check for extra spaces or special characters');
    }
    
    process.exit(1);
  }
}

// Run the debug
debugSaslAuth().catch(console.error); 