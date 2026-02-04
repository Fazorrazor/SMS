const { query } = require('./db');
const fs = require('fs');

const LOG_FILE = 'db_log.txt';

function log(msg) {
    fs.appendFileSync(LOG_FILE, msg + '\n');
    console.log(msg);
}

async function fix() {
    try {
        log('--- START FIX ---');

        // 1. Remove duplicates logic
        log('Cleaning duplicates...');
        await query(`
            DELETE FROM settings a USING settings b
            WHERE a.key = b.key AND a.ctid < b.ctid;
        `);
        log('Duplicates cleaned.');

        // 2. Drop constraint if exists
        log('Dropping existing pkey constraint...');
        try {
            await query('ALTER TABLE settings DROP CONSTRAINT settings_pkey');
            log('Constraint dropped.');
        } catch (e) {
            log('Drop failed (expected if missing): ' + e.message);
        }

        // 3. Add Primary Key
        log('Adding PRIMARY KEY...');
        try {
            await query('ALTER TABLE settings ADD PRIMARY KEY (key)');
            log('PRIMARY KEY added successfully.');
        } catch (e) {
            log('PRIMARY KEY addition failed: ' + e.message);
        }

    } catch (err) {
        log('FATAL ERROR: ' + err.message);
    } finally {
        log('--- END FIX ---');
        process.exit(0);
    }
}

// Clear log file
fs.writeFileSync(LOG_FILE, '');
fix();
