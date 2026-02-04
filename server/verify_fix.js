const { pool } = require('./db');
const fs = require('fs');
const LOG_FILE = 'verify_log.txt';

function log(msg) {
    fs.appendFileSync(LOG_FILE, msg + '\n');
    console.log(msg);
}

async function check() {
    fs.writeFileSync(LOG_FILE, '');
    log('--- CHECK START ---');

    if (!pool) {
        log('FATAL: pool is undefined!');
        process.exit(1);
    }
    log('pool object exists.');

    let client;
    try {
        log('Attempting to connect...');
        client = await pool.connect();
        log('Connected successfully.');

        log('Attempting to upsert setting...');
        await client.query('INSERT INTO settings (key, value) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value', ['verify_key', 'verify_value']);
        log('Upsert successful.');

    } catch (err) {
        log('CHECK FAILED:');
        log(err.toString());
        if (err.detail) log('Detail: ' + err.detail);
        if (err.hint) log('Hint: ' + err.hint);
        if (err.table) log('Table: ' + err.table);
        if (err.constraint) log('Constraint: ' + err.constraint);
    } finally {
        if (client) client.release();
        log('--- CHECK DONE ---');
        process.exit(0);
    }
}

check();
