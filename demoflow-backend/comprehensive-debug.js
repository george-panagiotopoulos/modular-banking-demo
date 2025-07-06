#!/usr/bin/env node

/**
 * Comprehensive Event Hub Connection Diagnostic
 * This script will check every aspect of the connection
 */

const { Kafka } = require('kafkajs');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function runDiagnostic() {
  console.log('🔍 COMPREHENSIVE EVENT HUB DIAGNOSTIC');
  console.log('=====================================');

  // Step 1: Check file existence and paths
  console.log('\n1. FILE SYSTEM CHECK:');
  const envPath = path.resolve(__dirname, '../.env');
  const envExists = fs.existsSync(envPath);
  console.log(`   .env file path: ${envPath}`);
  console.log(`   .env file exists: ${envExists ? '✅' : '❌'}`);

  if (envExists) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    const bootstrapLine = lines.find(line => line.startsWith('BOOTSTRAP_SERVERS='));
    const connectionLine = lines.find(line => line.startsWith('CONNECTION_STRING='));
    
    console.log(`   BOOTSTRAP_SERVERS line found: ${bootstrapLine ? '✅' : '❌'}`);
    console.log(`   CONNECTION_STRING line found: ${connectionLine ? '✅' : '❌'}`);
    
    if (bootstrapLine) {
      console.log(`   BOOTSTRAP_SERVERS raw: ${bootstrapLine.substring(0, 50)}...`);
    }
    if (connectionLine) {
      console.log(`   CONNECTION_STRING raw: ${connectionLine.substring(0, 50)}...`);
    }
  }

  // Step 2: Check environment variables
  console.log('\n2. ENVIRONMENT VARIABLES CHECK:');
  const BOOTSTRAP_SERVERS = process.env.BOOTSTRAP_SERVERS;
  const CONNECTION_STRING = process.env.CONNECTION_STRING;

  console.log(`   BOOTSTRAP_SERVERS: ${BOOTSTRAP_SERVERS ? '✅ SET' : '❌ NOT SET'}`);
  console.log(`   CONNECTION_STRING: ${CONNECTION_STRING ? '✅ SET' : '❌ NOT SET'}`);

  if (BOOTSTRAP_SERVERS) {
    console.log(`   BOOTSTRAP_SERVERS value: ${BOOTSTRAP_SERVERS}`);
  }

  if (CONNECTION_STRING) {
    console.log(`   CONNECTION_STRING length: ${CONNECTION_STRING.length}`);
    console.log(`   CONNECTION_STRING start: ${CONNECTION_STRING.substring(0, 30)}...`);
    console.log(`   CONNECTION_STRING end: ...${CONNECTION_STRING.substring(CONNECTION_STRING.length - 30)}`);
    
    // Check for invisible characters
    const hasInvisibleChars = /[\x00-\x1F\x7F-\x9F]/.test(CONNECTION_STRING);
    console.log(`   Has invisible characters: ${hasInvisibleChars ? '⚠️  YES' : '✅ NO'}`);
    
    // Check connection string format
    const parts = CONNECTION_STRING.split(';');
    console.log(`   Connection string parts: ${parts.length}`);
    
    const endpoint = parts.find(p => p.startsWith('Endpoint='));
    const keyName = parts.find(p => p.startsWith('SharedAccessKeyName='));
    const key = parts.find(p => p.startsWith('SharedAccessKey='));
    
    console.log(`   Endpoint: ${endpoint ? '✅' : '❌'}`);
    console.log(`   SharedAccessKeyName: ${keyName ? '✅' : '❌'}`);
    console.log(`   SharedAccessKey: ${key ? '✅' : '❌'}`);
  }

  if (!BOOTSTRAP_SERVERS || !CONNECTION_STRING) {
    console.log('\n❌ MISSING ENVIRONMENT VARIABLES - CANNOT PROCEED');
    process.exit(1);
  }

  // Step 3: Test SASL configuration
  console.log('\n3. SASL CONFIGURATION TEST:');
  const saslConfig = {
    mechanism: 'plain',
    username: '$ConnectionString',
    password: CONNECTION_STRING,
  };

  console.log(`   Mechanism: ${saslConfig.mechanism}`);
  console.log(`   Username: ${saslConfig.username}`);
  console.log(`   Password length: ${saslConfig.password.length}`);
  console.log(`   Password is string: ${typeof saslConfig.password === 'string' ? '✅' : '❌'}`);
  console.log(`   Password is not null: ${saslConfig.password !== null ? '✅' : '❌'}`);
  console.log(`   Password is not undefined: ${saslConfig.password !== undefined ? '✅' : '❌'}`);

  // Step 4: Test Kafka client creation
  console.log('\n4. KAFKA CLIENT CREATION TEST:');
  try {
    const kafka = new Kafka({
      clientId: 'comprehensive-debug-test',
      brokers: [BOOTSTRAP_SERVERS],
      ssl: {
        rejectUnauthorized: false,
        servername: BOOTSTRAP_SERVERS.split(':')[0],
      },
      sasl: saslConfig,
      connectionTimeout: 30000,
      requestTimeout: 30000,
      logLevel: 1, // ERROR level only
    });
    
    console.log('   ✅ Kafka client created successfully');
    
    // Step 5: Test consumer creation
    console.log('\n5. CONSUMER CREATION TEST:');
    const consumer = kafka.consumer({ 
      groupId: 'comprehensive-debug-group',
      sessionTimeout: 30000,
    });
    
    console.log('   ✅ Consumer created successfully');
    
    // Step 6: Test actual connection
    console.log('\n6. CONNECTION TEST:');
    console.log('   Attempting to connect...');
    
    const connectTimeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout after 30 seconds')), 30000);
    });
    
    const connectPromise = consumer.connect();
    
    await Promise.race([connectPromise, connectTimeout]);
    
    console.log('   ✅ SASL authentication successful!');
    
    await consumer.disconnect();
    console.log('   ✅ Connection closed successfully');
    
    console.log('\n🎉 ALL TESTS PASSED! Event Hub connection is working.');
    
  } catch (error) {
    console.error('\n❌ CONNECTION FAILED:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code}`);
    console.error(`   Type: ${error.constructor.name}`);
    
    // Detailed error analysis
    console.log('\n🔍 ERROR ANALYSIS:');
    
    if (error.message.includes('SASL')) {
      console.log('   🚨 SASL Authentication Error Detected');
      console.log('   Possible causes:');
      console.log('   - Connection string is invalid or expired');
      console.log('   - SharedAccessKey is incorrect');
      console.log('   - Event Hub namespace is not accessible');
      console.log('   - Network connectivity issues');
    }
    
    if (error.message.includes('null')) {
      console.log('   🚨 Null Value Error Detected');
      console.log('   Possible causes:');
      console.log('   - Connection string contains null characters');
      console.log('   - Environment variable not loaded properly');
      console.log('   - String encoding issues');
    }
    
    if (error.message.includes('timeout')) {
      console.log('   🚨 Connection Timeout Error Detected');
      console.log('   Possible causes:');
      console.log('   - Network firewall blocking port 9093');
      console.log('   - Corporate proxy not configured for Kafka');
      console.log('   - DNS resolution issues');
    }
    
    if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
      console.log('   🚨 Network Connection Error Detected');
      console.log('   Possible causes:');
      console.log('   - DNS resolution failed');
      console.log('   - Network connectivity issues');
      console.log('   - Firewall blocking connection');
    }
    
    console.log('\n📋 TROUBLESHOOTING STEPS:');
    console.log('1. Verify connection string in Azure Portal');
    console.log('2. Check network connectivity to Azure');
    console.log('3. Test from different network (mobile hotspot)');
    console.log('4. Regenerate Event Hub access key');
    console.log('5. Check corporate firewall settings');
    
    process.exit(1);
  }
}

// Run the diagnostic
runDiagnostic().catch(console.error); 