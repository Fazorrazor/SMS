const { pool } = require('./db');
const fs = require('fs');
const LOG_FILE = 'repro_log.txt';

function log(msg) {
    fs.appendFileSync(LOG_FILE, msg + '\n');
    console.log(msg);
}

async function repro() {
    const client = await pool.connect();
    try {
        log('--- REPRO START ---');
        await client.query('BEGIN');

        const testData = {
            'test_key': 'test_value',
            'storeName': 'Test Store Update'
        };

        for (const [key, value] of Object.entries(testData)) {
            log(`Inserting/Updating ${key}...`);
            await client.query('INSERT INTO settings (key, value) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value', [key, String(value)]);
        }

        await client.query('COMMIT');
        log('--- REPRO SUCCESS ---');
    } catch (err) {
        await client.query('ROLLBACK');
        log('--- REPRO ERROR ---');
        log(err.message);
        if (err.detail) log('Detail: ' + err.detail);
        if (err.hint) log('Hint: ' + err.hint);
    } finally {
        client.release();
        process.exit(0);
    }
}

fs.writeFileSync(LOG_FILE, '');
repro();
