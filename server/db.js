const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const initializeDB = async () => {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS products (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                sku TEXT UNIQUE NOT NULL,
                category TEXT NOT NULL,
                "sellingPrice" REAL NOT NULL,
                "halfPrice" REAL,
                "quarterPrice" REAL,
                "costPrice" REAL NOT NULL,
                stock REAL NOT NULL,
                unit TEXT DEFAULT 'Pack',
                archived INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS sales (
                id TEXT PRIMARY KEY,
                total REAL NOT NULL,
                timestamp BIGINT NOT NULL,
                paymentMethod TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS sale_items (
                id SERIAL PRIMARY KEY,
                saleId TEXT NOT NULL,
                productId TEXT NOT NULL,
                name TEXT NOT NULL,
                quantity REAL NOT NULL,
                price REAL NOT NULL,
                costPrice REAL DEFAULT 0,
                FOREIGN KEY (saleId) REFERENCES sales(id),
                FOREIGN KEY (productId) REFERENCES products(id)
            );

            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
            CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
            CREATE INDEX IF NOT EXISTS idx_sales_timestamp ON sales(timestamp);
            CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(saleId);
            CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(productId);
        `);

        // Migration: Add columns if they don't exist (PostgreSQL handles this differently, usually via specialized migration tools, but we'll use a manual check for simplicity)
        const addColumnIfMissing = async (table, column, type, defaultValue = null) => {
            const res = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name=$1 AND column_name=$2
            `, [table, column]);

            if (res.rowCount === 0) {
                const defaultClause = defaultValue !== null ? `DEFAULT ${defaultValue}` : '';
                try {
                    await client.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${type} ${defaultClause}`);
                } catch (err) {
                    // Ignore column already exists error
                    if (err.code !== '42701') {
                        throw err;
                    }
                }
            }
        };

        await addColumnIfMissing('products', '"halfPrice"', 'REAL');
        await addColumnIfMissing('products', '"quarterPrice"', 'REAL');
        await addColumnIfMissing('products', 'unit', 'TEXT', "'Pack'");
        await addColumnIfMissing('products', 'archived', 'INTEGER', '0');
        await addColumnIfMissing('sale_items', '"costPrice"', 'REAL', '0');

        // Migration: Fill existing sale_items with current product costPrice
        await client.query(`
            UPDATE sale_items 
            SET "costPrice" = (SELECT "costPrice" FROM products WHERE products.id = sale_items.productId)
            WHERE "costPrice" = 0 OR "costPrice" IS NULL
        `);

        // Seed initial data if empty
        const userCountRes = await client.query('SELECT count(*) as count FROM users');
        if (parseInt(userCountRes.rows[0].count) === 0) {
            await client.query('INSERT INTO users (id, name, username, password, role) VALUES ($1, $2, $3, $4, $5)',
                ['1', 'Administrator', 'admin', 'admin', 'Admin']);
        }

        const settingsCountRes = await client.query('SELECT count(*) as count FROM settings');
        if (parseInt(settingsCountRes.rows[0].count) === 0) {
            const initialSettings = {
                storeName: 'Home of Disposables',
                storeEmail: 'contact@store.com',
                storePhone: '+233 XX XXX XXXX',
                storeAddress: 'Accra, Ghana',
                currencySymbol: 'GH₵',
                taxRate: '5.0',
                language: 'English (US)',
                timezone: '(GMT+00:00) Ghana Time',
                dateFormat: 'DD/MM/YYYY',
                lowStockAlerts: 'true',
                dailySummary: 'false',
                staffLoginAlerts: 'true',
                systemUpdates: 'true',
                revenueGoal: '50000',
                lowStockThreshold: '5'
            };
            for (const [key, value] of Object.entries(initialSettings)) {
                await client.query('INSERT INTO settings (key, value) VALUES ($1, $2)', [key, value]);
            }
        }
    } finally {
        client.release();
    }
};

module.exports = {
    query: (text, params) => pool.query(text, params),
    initializeDB,
    pool
};
