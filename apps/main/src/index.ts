import { createId, formatDate, sleep } from '@aibos/utils';
import { createUser, validateUser } from '@aibos/auth';

console.log('🚀 AI-BOS Main Application');
console.log('Generated ID:', createId());
console.log('Current Date:', formatDate(new Date()));

const user = createUser({
    email: 'admin@aibos.com',
    name: 'Admin User'
});

console.log('Created User:', user);

// Test async functionality
await sleep(100);
console.log('✅ Application ready!');
