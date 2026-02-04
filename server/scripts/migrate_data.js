const Database = require('better-sqlite3');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();
const { initializeDB } = require('../db');

const sqlitePath = path.join(__dirname, '../database.sqlite');

const migrate = async () => {
    console.log('Starting migration...');
    console.log(`Reading from SQLite: ${sqlitePath}`);

    let sqlite;
    try {
        sqlite = new Database(sqlitePath, { readonly: true });
    } catch (e) {
        console.error('Could not open SQLite database:', e.message);
        return;
    }

    const pgPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    const client = await pgPool.connect();

    try {
        await initializeDB(); // Create tables first

        // 1. Users
        const users = sqlite.prepare('SELECT * FROM users').all();
        console.log(`Migrating ${users.length} users...`);
        for (const u of users) {
            await client.query(
                'INSERT INTO users (id, name, username, password, role) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING',
                [u.id, u.name, u.username, u.password, u.role]
            );
        }

        // 2. Settings
        const settings = sqlite.prepare('SELECT * FROM settings').all();
        console.log(`Migrating ${settings.length} settings...`);
        for (const s of settings) {
            await client.query(
                'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value',
                [s.key, s.value]
            );
        }

        // 3. Products
        const products = sqlite.prepare('SELECT * FROM products').all();
        console.log(`Migrating ${products.length} products...`);
        for (const p of products) {
            // Check for columns that might be missing in older SQLite DBs
            const halfPrice = p.halfPrice !== undefined ? p.halfPrice : null;
            const quarterPrice = p.quarterPrice !== undefined ? p.quarterPrice : null;
            const unit = p.unit || 'Pack';
            const archived = p.archived || 0;

            await client.query(
                `INSERT INTO products (id, name, sku, category, sellingPrice, halfPrice, quarterPrice, costPrice, stock, unit, archived) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                 ON CONFLICT (id) DO NOTHING`,
                [p.id, p.name, p.sku, p.category, p.sellingPrice, halfPrice, quarterPrice, p.costPrice, p.stock, unit, archived]
            );
        }

        // 4. Sales
        const sales = sqlite.prepare('SELECT * FROM sales').all();
        console.log(`Migrating ${sales.length} sales...`);
        for (const s of sales) {
            await client.query(
                'INSERT INTO sales (id, total, timestamp, paymentMethod) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING',
                [s.id, s.total, s.timestamp, s.paymentMethod]
            );
        }

        // 5. Sale Items
        const saleItems = sqlite.prepare('SELECT * FROM sale_items').all();
        console.log(`Migrating ${saleItems.length} sale items...`);
        for (const si of saleItems) {
            const costPrice = si.costPrice !== undefined ? si.costPrice : 0;
            // Note: Postgres SERIAL creates new IDs, but we might want to preserve structure.
            // However, sale_items ID in SQLite is INTEGER PRIMARY KEY AUTOINCREMENT.
            // In Postgres we used SERIAL. We can just insert without ID and let Postgres generate, 
            // OR if we need to preserve exact IDs we should include it. 
            // Since sale_items don't have external references usually, letting Postgres generate is safer to avoid conflicts,
            // BUT for historical accuracy we should try to keep them if possible, or just drop ID.
            // Let's insert without ID to be safe, links are via saleId and productId.

            await client.query(
                `INSERT INTO sale_items (saleId, productId, name, quantity, price, costPrice) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [si.saleId, si.productId, si.name, si.quantity, si.price, costPrice]
            );
        }

        console.log('Migration completed successfully!');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        client.release();
        await pgPool.end();
        sqlite.close();
    }
};

migrate();
