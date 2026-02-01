const Database = require('better-sqlite3');
const path = require('path');
const http = require('http');

// 1. Connect to DB directly to verify persistence
const dbPath = path.join(__dirname, 'server', 'database.sqlite');
const db = new Database(dbPath);

async function testUpdate() {
    console.log('--- Starting Verification Test ---');

    // 2. Create a test user via API
    const newUser = {
        name: 'Test User',
        username: 'testuser_' + Date.now(),
        role: 'Cashier'
    };

    console.log('Creating user via API...');
    const createRes = await makeRequest('/api/users', 'POST', newUser);
    const userId = createRes.id;
    console.log(`User created with ID: ${userId}`);

    // 3. Update the user via API
    const updateData = {
        name: 'Updated Name',
        username: newUser.username,
        role: 'Admin',
        password: 'newpassword123'
    };

    console.log('Updating user via API...');
    await makeRequest(`/api/users/${userId}`, 'PUT', updateData);
    console.log('User updated via API.');

    // 4. Verify in Database directly
    console.log('Verifying in SQLite database file...');
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

    if (row.name === 'Updated Name' && row.role === 'Admin' && row.password === 'newpassword123') {
        console.log('SUCCESS: Database reflects the changes!');
        console.log('DB Row:', row);
    } else {
        console.error('FAILURE: Database does not match expected values.');
        console.error('Expected:', updateData);
        console.error('Actual:', row);
    }

    // 5. Cleanup
    console.log('Cleaning up...');
    await makeRequest(`/api/users/${userId}`, 'DELETE');
    console.log('Test user deleted.');
}

function makeRequest(path, method, body) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(data ? JSON.parse(data) : {});
                } else {
                    reject(new Error(`Request failed with status ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', (e) => reject(e));
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

testUpdate().catch(console.error);
