const db = require('./db');
console.log('db exports:', Object.keys(db));
console.log('pool is:', db.pool);
