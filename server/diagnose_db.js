const { query } = require('./db');

async function diagnose() {
    try {
        console.log('--- START DIAGNOSIS ---');

        const res = await query(`
            SELECT constraint_name, constraint_type
            FROM information_schema.table_constraints
            WHERE table_name = 'settings'
        `);

        console.log('CONSTRAINTS:', JSON.stringify(res.rows));

        const content = await query('SELECT key FROM settings LIMIT 5');
        console.log('KEYS:', JSON.stringify(content.rows));

    } catch (err) {
        console.error('ERROR:', err);
    } finally {
        console.log('--- END DIAGNOSIS ---');
        process.exit(0);
    }
}

diagnose();
