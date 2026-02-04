const { Client } = require('pg');
require('dotenv').config(); // Load from current directory (server/.env)

const createDB = async () => {
    // Connect to the default 'postgres' database to create the new one
    const connectionString = process.env.DATABASE_URL.replace('/sms_db', '/postgres');

    const client = new Client({
        connectionString,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    try {
        await client.connect();

        // Check if database exists
        const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'sms_db'");

        if (res.rowCount === 0) {
            console.log('Database sms_db does not exist. Creating...');
            await client.query('CREATE DATABASE sms_db');
            console.log('Database sms_db created successfully.');
        } else {
            console.log('Database sms_db already exists.');
        }
    } catch (err) {
        console.error('Error creating database:', err);
    } finally {
        await client.end();
    }
};

createDB();
