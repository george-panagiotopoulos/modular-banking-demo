const path = require('path');
const fs = require('fs');

console.log('Testing .env file path resolution:');
console.log('==================================');

// Test from different locations
const locations = [
  { name: 'demoflow-backend', path: '.' },
  { name: 'src', path: 'src' },
  { name: 'src/services', path: 'src/services' }
];

locations.forEach(location => {
  const testPath = path.resolve(location.path, '../../.env');
  const exists = fs.existsSync(testPath);
  console.log(`${location.name}: ${testPath} - ${exists ? '✅ EXISTS' : '❌ NOT FOUND'}`);
});

// Test the correct paths for server and service
const serverPath = path.resolve('src', '../../.env');
const servicePath = path.resolve('src/services', '../../../.env');
const serverExists = fs.existsSync(serverPath);
const serviceExists = fs.existsSync(servicePath);

console.log(`\nServer path (src/../../.env): ${serverPath} - ${serverExists ? '✅ EXISTS' : '❌ NOT FOUND'}`);
console.log(`Service path (src/services/../../../.env): ${servicePath} - ${serviceExists ? '✅ EXISTS' : '❌ NOT FOUND'}`);

if (serverExists && serviceExists) {
  console.log('\n✅ Both paths are correct');
} else {
  console.log('\n❌ One or both paths are incorrect');
} 