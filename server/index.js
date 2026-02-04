const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');
const { query, initializeDB, pool } = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "DELETE", "PATCH", "PUT"]
    }
});

io.on('connection', (socket) => {
    socket.on('disconnect', () => {
    });
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, __dirname);
    },
    filename: (req, file, cb) => {
        cb(null, 'database_backup.json');
    }
});
const upload = multer({ storage });

// --- Backup & Restore Endpoints ---
app.get('/api/backup', async (req, res) => {
    try {
        const products = (await query('SELECT * FROM products')).rows;
        const sales = (await query('SELECT * FROM sales')).rows;
        const saleItems = (await query('SELECT * FROM sale_items')).rows;
        const users = (await query('SELECT * FROM users')).rows;
        const settings = (await query('SELECT * FROM settings')).rows;

        const backup = {
            version: '1.0',
            timestamp: Date.now(),
            data: { products, sales, saleItems, users, settings }
        };

        const filename = `sms-backup-${new Date().toISOString().split('T')[0]}.json`;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.json(backup);
    } catch (err) {
        console.error('Backup error:', err);
        res.status(500).json({ error: 'Backup failed' });
    }
});

app.post('/api/restore', upload.single('database'), async (req, res) => {
    const client = await pool.connect();
    try {
        let data;
        if (req.file) {
            const content = fs.readFileSync(req.file.path, 'utf8');
            data = JSON.parse(content).data;
        } else {
            data = req.body.data;
        }

        if (!data) return res.status(400).json({ error: 'No data provided' });

        await client.query('BEGIN');
        await client.query('DELETE FROM sale_items');
        await client.query('DELETE FROM sales');
        await client.query('DELETE FROM products');
        await client.query('DELETE FROM users');
        await client.query('DELETE FROM settings');

        for (const p of data.products) {
            await client.query('INSERT INTO products (id, name, sku, category, "sellingPrice", "halfPrice", "quarterPrice", "costPrice", stock, unit) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
                [p.id, p.name, p.sku, p.category, p.sellingPrice, p.halfPrice, p.quarterPrice, p.costPrice, p.stock, p.unit]);
        }
        for (const s of data.sales) {
            await client.query('INSERT INTO sales (id, total, timestamp, paymentMethod) VALUES ($1, $2, $3, $4)',
                [s.id, s.total, s.timestamp, s.paymentMethod]);
        }
        for (const si of data.saleItems) {
            await client.query('INSERT INTO sale_items (saleId, productId, name, quantity, price, "costPrice") VALUES ($1, $2, $3, $4, $5, $6)',
                [si.saleId, si.productId, si.name, si.quantity, si.price, si.costPrice || 0]);
        }
        for (const u of data.users) {
            await client.query('INSERT INTO users (id, name, username, password, role) VALUES ($1, $2, $3, $4, $5)',
                [u.id, u.name, u.username, u.password, u.role]);
        }
        for (const s of data.settings) {
            await client.query('INSERT INTO settings (key, value) VALUES ($1, $2)', [s.key, s.value]);
        }
        await client.query('COMMIT');
        res.json({ success: true, message: 'Database restored successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Restore error:', err);
        res.status(500).json({ error: 'Restore failed' });
    } finally {
        client.release();
    }
});

const PORT = process.env.PORT || 5000;

// --- Auth Endpoints ---
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });

    try {
        const result = await query('SELECT * FROM users WHERE username = $1 AND password = $2', [username, password]);
        const user = result.rows[0];

        if (user) {
            const { password, ...userWithoutPassword } = user;
            res.json(userWithoutPassword);
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error during login' });
    }
});

app.post('/api/change-password', async (req, res) => {
    const { userId, currentPassword, newPassword } = req.body;
    try {
        const result = await query('SELECT * FROM users WHERE id = $1 AND password = $2', [userId, currentPassword]);
        if (result.rows[0]) {
            await query('UPDATE users SET password = $1 WHERE id = $2', [newPassword, userId]);
            res.json({ success: true });
        } else {
            res.status(401).json({ error: 'Incorrect current password' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to change password' });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const result = await query('SELECT id, name, username, role FROM users');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

app.post('/api/users', async (req, res) => {
    const { name, username, role } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    try {
        await query('INSERT INTO users (id, name, username, password, role) VALUES ($1, $2, $3, $4, $5)', [id, name, username, username, role]);
        res.json({ id, name, username, role });
    } catch (err) {
        res.status(400).json({ error: 'Username already exists' });
    }
});

app.delete('/api/users/:id', async (req, res) => {
    try {
        await query('DELETE FROM users WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

app.put('/api/users/:id', async (req, res) => {
    const { name, username, role, password } = req.body;
    const { id } = req.params;
    try {
        const existing = (await query('SELECT * FROM users WHERE id = $1', [id])).rows[0];
        if (!existing) return res.status(404).json({ error: 'User not found' });

        if (password) {
            await query('UPDATE users SET name = $1, username = $2, role = $3, password = $4 WHERE id = $5', [name, username, role, password, id]);
        } else {
            await query('UPDATE users SET name = $1, username = $2, role = $3 WHERE id = $4', [name, username, role, id]);
        }
        res.json({ id, name, username, role });
    } catch (err) {
        res.status(400).json({ error: 'Failed to update user' });
    }
});

// --- Products Endpoints ---
app.get('/api/products', async (req, res) => {
    try {
        const result = await query('SELECT * FROM products WHERE archived = 0');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

app.post('/api/products', async (req, res) => {
    const { name, sku, category, sellingPrice, halfPrice, quarterPrice, costPrice, stock, unit } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    const finalSku = sku || `PROD-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    try {
        await query('INSERT INTO products (id, name, sku, category, "sellingPrice", "halfPrice", "quarterPrice", "costPrice", stock, unit) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
            [id, name, finalSku, category || 'Uncategorized', sellingPrice || 0, halfPrice || null, quarterPrice || null, costPrice || 0, stock || 0, unit || 'Pack']);

        const newProduct = { id, name, sku: finalSku, category: category || 'Uncategorized', sellingPrice: sellingPrice || 0, halfPrice, quarterPrice, costPrice: costPrice || 0, stock: stock || 0, unit: unit || 'Pack' };
        io.emit('product_updated', newProduct);
        res.json(newProduct);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.patch('/api/products/:id/stock', async (req, res) => {
    try {
        await query('UPDATE products SET stock = stock + $1 WHERE id = $2', [req.body.quantity, req.params.id]);
        const result = await query('SELECT * FROM products WHERE id = $1', [req.params.id]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update stock' });
    }
});

app.put('/api/products/:id', async (req, res) => {
    const { name, sku, category, sellingPrice, halfPrice, quarterPrice, costPrice, stock, unit } = req.body;
    try {
        const existing = (await query('SELECT sku FROM products WHERE id = $1', [req.params.id])).rows[0];
        if (!existing) return res.status(404).json({ error: 'Product not found' });

        const finalSku = sku || existing.sku;
        await query('UPDATE products SET name = $1, sku = $2, category = $3, "sellingPrice" = $4, "halfPrice" = $5, "quarterPrice" = $6, "costPrice" = $7, stock = $8, unit = $9 WHERE id = $10',
            [name, finalSku, category, sellingPrice, halfPrice || null, quarterPrice || null, costPrice, stock, unit, req.params.id]);

        const updatedProduct = { id: req.params.id, name, sku: finalSku, category, sellingPrice, halfPrice, quarterPrice, costPrice, stock, unit };
        io.emit('product_updated', updatedProduct);
        res.json(updatedProduct);
    } catch (err) {
        res.status(400).json({ error: 'Failed to update product' });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        await query('DELETE FROM products WHERE id = $1', [req.params.id]);
        io.emit('product_deleted', req.params.id);
        res.json({ success: true, message: 'Product deleted permanently' });
    } catch (err) {
        if (err.message.includes('foreign key')) {
            try {
                await query('UPDATE products SET archived = 1 WHERE id = $1', [req.params.id]);
                io.emit('product_deleted', req.params.id);
                return res.json({ success: true, message: 'Product archived' });
            } catch (archiveErr) {
                return res.status(500).json({ error: 'Failed to archive' });
            }
        }
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// --- Sales Endpoints ---
app.get('/api/sales', async (req, res) => {
    const { startDate, endDate } = req.query;
    try {
        let sql = 'SELECT * FROM sales';
        const params = [];
        if (startDate && endDate) {
            sql += ' WHERE timestamp BETWEEN $1 AND $2';
            params.push(startDate, endDate);
        }
        sql += ' ORDER BY timestamp DESC';
        const result = await query(sql, params);
        const salesWithItems = await Promise.all(result.rows.map(async (sale) => {
            const items = (await query('SELECT * FROM sale_items WHERE saleId = $1', [sale.id])).rows;
            return { ...sale, items };
        }));
        res.json(salesWithItems);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch sales' });
    }
});

app.post('/api/sales', async (req, res) => {
    const { items, total, paymentMethod } = req.body;
    const saleId = `SALE-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const timestamp = Date.now();

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('INSERT INTO sales (id, total, timestamp, paymentMethod) VALUES ($1, $2, $3, $4)', [saleId, total, timestamp, paymentMethod]);
        for (const item of items) {
            await client.query('INSERT INTO sale_items (saleId, productId, name, quantity, price, "costPrice") VALUES ($1, $2, $3, $4, $5, $6)',
                [saleId, item.productId, item.name, item.quantity, item.price, item.costPrice || 0]);
            await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [item.quantity, item.productId]);
        }
        await client.query('COMMIT');
        const saleData = { id: saleId, timestamp, total, paymentMethod, items };
        io.emit('sale_completed', saleData);
        res.json(saleData);
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: 'Failed to record sale' });
    } finally {
        client.release();
    }
});

app.delete('/api/sales/:id', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const items = (await client.query('SELECT productId, quantity FROM sale_items WHERE saleId = $1', [req.params.id])).rows;
        for (const item of items) {
            await client.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [item.quantity, item.productId]);
        }
        await client.query('DELETE FROM sale_items WHERE saleId = $1', [req.params.id]);
        await client.query('DELETE FROM sales WHERE id = $1', [req.params.id]);
        await client.query('COMMIT');
        io.emit('sale_voided', req.params.id);
        res.json({ success: true });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: 'Failed to void sale' });
    } finally {
        client.release();
    }
});

// --- Reports ---
app.get('/api/reports', async (req, res) => {
    try {
        const valuationResult = await query('SELECT SUM(stock * "costPrice") as "totalCost", SUM(stock * "sellingPrice") as "totalRetail" FROM products WHERE archived = 0');
        const inventoryValuation = valuationResult.rows[0];

        const categoryAnalysis = (await query('SELECT p.category as name, SUM(si.quantity * si.price) as value FROM sale_items si JOIN products p ON si.productId = p.id GROUP BY p.category')).rows;

        const topByQty = (await query('SELECT name, SUM(quantity) as quantity FROM sale_items GROUP BY productId, name ORDER BY quantity DESC LIMIT 5')).rows;
        const topByRevenue = (await query('SELECT name, SUM(quantity * price) as revenue FROM sale_items GROUP BY productId, name ORDER BY revenue DESC LIMIT 5')).rows;

        const dailySummary = (await query(`
            SELECT 
                TO_TIMESTAMP(s.timestamp / 1000)::DATE as date,
                COUNT(DISTINCT s.id) as orders,
                SUM(s.total) as revenue,
                SUM(si.quantity) as items,
                SUM(si.quantity * si.costPrice) as cost
            FROM sales s
            JOIN sale_items si ON s.id = si.saleId
            GROUP BY date
            ORDER BY date DESC
            LIMIT 30
        `)).rows;

        res.json({
            inventoryValuation: {
                totalCost: parseFloat(inventoryValuation.totalCost) || 0,
                totalRetail: parseFloat(inventoryValuation.totalRetail) || 0,
                potentialProfit: (parseFloat(inventoryValuation.totalRetail) || 0) - (parseFloat(inventoryValuation.totalCost) || 0)
            },
            categoryAnalysis: categoryAnalysis.map(c => ({ ...c, value: parseFloat(c.value) })),
            productPerformance: {
                sortedByQty: topByQty.map(p => ({ ...p, quantity: parseFloat(p.quantity) })),
                sortedByRevenue: topByRevenue.map(p => ({ ...p, revenue: parseFloat(p.revenue) }))
            },
            dailySummary: dailySummary.map(d => ({
                date: d.date.toISOString().split('T')[0],
                orders: parseInt(d.orders),
                revenue: parseFloat(d.revenue),
                items: parseFloat(d.items),
                cost: parseFloat(d.cost),
                profit: parseFloat(d.revenue) - (parseFloat(d.cost) || 0)
            }))
        });
    } catch (err) {
        console.error('Reports error:', err);
        res.status(500).json({ error: 'Failed to generate reports' });
    }
});

// --- Settings ---
app.get('/api/settings', async (req, res) => {
    try {
        const result = await query('SELECT * FROM settings');
        const map = {};
        result.rows.forEach(s => map[s.key] = s.value);
        res.json(map);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

app.post('/api/settings', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const [key, value] of Object.entries(req.body)) {
            const result = await client.query('SELECT key FROM settings WHERE key = $1', [key]);
            if (result.rows.length > 0) {
                await client.query('UPDATE settings SET value = $1 WHERE key = $2', [String(value), key]);
            } else {
                await client.query('INSERT INTO settings (key, value) VALUES ($1, $2)', [key, String(value)]);
            }
        }
        await client.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        console.error('Save settings error:', err);
        await client.query('ROLLBACK');
        res.status(500).json({ error: 'Failed to save settings' });
    } finally {
        client.release();
    }
});

// --- Server Startup ---
const start = async () => {
    try {
        await initializeDB();
        server.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
    }
};

start();
