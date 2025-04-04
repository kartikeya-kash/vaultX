const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const WebSocket = require('ws');

const app = express();
const port = 3000;
const INITIAL_DIFFICULTY = 3; // Number of leading zeros required

// Middleware
app.use(bodyParser.json());
app.use(cors());

// MySQL Connection Pool
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'vaultX',
    connectionLimit: 10
});

// Create WebSocket server
const wss = new WebSocket.Server({ noServer: true });

// WebSocket endpoint for mining
wss.on('connection', function connection(ws) {
    ws.on('message', async function incoming(message) {
        try {
            const { email } = JSON.parse(message);
            const difficulty = INITIAL_DIFFICULTY;
            
            // Get latest block
            const [rows] = await pool.promise().query(
                'SELECT * FROM blocks ORDER BY block_index DESC LIMIT 1'
            );
            
            const previousBlock = rows.length > 0 ? rows[0] : null;
            const newIndex = previousBlock ? previousBlock.block_index + 1 : 0;
            const previousHash = previousBlock ? previousBlock.hash : '0';
            
            // Create new block
            const newBlock = {
                index: newIndex,
                timestamp: new Date().toISOString(),
                data: { amount: Math.random() * 100 },
                previousHash: previousHash,
                nonce: 0
            };
            
            // Mine the block with real-time updates
            const crypto = require('crypto-js');
            let hash;
            do {
                newBlock.nonce++;
                hash = crypto.SHA256(
                    newBlock.index + 
                    newBlock.timestamp + 
                    newBlock.previousHash + 
                    JSON.stringify(newBlock.data) + 
                    newBlock.nonce
                ).toString();
                
                // Send hash attempt to client
                ws.send(JSON.stringify({
                    type: 'hash_attempt',
                    hash: hash
                }));
                
                // Small delay to make the process visible
                // await new Promise(resolve => setTimeout(resolve, 10));  to show hash output little slow
            } while (!hash.startsWith('0'.repeat(difficulty)));
            
            newBlock.hash = hash;
            
            // Save block to database
            await pool.promise().query(
                `INSERT INTO blocks 
                (block_index, timestamp, data, previous_hash, hash, nonce, mined_by) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    newBlock.index,
                    newBlock.timestamp,
                    JSON.stringify(newBlock.data),
                    newBlock.previousHash,
                    newBlock.hash,
                    newBlock.nonce,
                    email
                ]
            );
            
            // Update user balance
            await pool.promise().query(
                `UPDATE user_balances 
                SET balance = balance + 3.45 
                WHERE email = ?`,
                [email]
            );
            
            // Send success message
            ws.send(JSON.stringify({
                type: 'block_mined',
                block: newBlock
            }));
            
        } catch (error) {
            console.error('Mining error:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: error.message
            }));
        } finally {
            ws.close();
        }
    });
});

// Register endpoint
app.post('/register', (req, res) => {
    const { username, email, password } = req.body;

    const sql = 'INSERT INTO userinfo (username, email, password) VALUES (?, ?, ?)';
    
    pool.query(sql, [username, email, password], (err, result) => {
        if (err) {
            console.error('Error inserting data:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ message: 'User registered successfully', userId: result.insertId });
        // After successful registration in the /register endpoint
        pool.query('INSERT INTO user_balances (email, balance) VALUES (?, 0.00)', [email]);
    });
});

// Login endpoint
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    const sql = 'SELECT * FROM userinfo WHERE email = ?';

    pool.query(sql, [email], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = results[0];

        if (user.password !== password) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        res.json({ message: 'Login successful', username: user.username });
    });
});

// User info endpoint
// User info endpoint
app.post('/userinfo', (req, res) => {
    const { email } = req.body;

    // First get user info
    const userSql = 'SELECT username, email FROM userinfo WHERE email = ?';
    
    pool.query(userSql, [email], (err, userResults) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (userResults.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = userResults[0];
        
        // Then get balance from user_balances
        const balanceSql = 'SELECT balance FROM user_balances WHERE email = ?';
        
        pool.query(balanceSql, [email], (err, balanceResults) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            let balance = 0.00;
            if (balanceResults.length > 0) {
                balance = balanceResults[0].balance;
            } else {
                // Initialize if not exists
                const initSql = 'INSERT INTO user_balances (email, balance) VALUES (?, 0.00)';
                pool.query(initSql, [email]);
            }
            
            res.json({ 
                username: user.username,
                email: user.email,
                balance: balance
            });
        });
    });
});

// Get user balance endpoint
app.post('/get-balance', (req, res) => {
    const { email } = req.body;

    const sql = 'SELECT balance FROM user_balances WHERE email = ?';
    
    pool.query(sql, [email], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (results.length === 0) {
            // Initialize balance if not exists
            const initSql = 'INSERT INTO user_balances (email, balance) VALUES (?, 0.00)';
            pool.query(initSql, [email], (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }
                return res.json({ balance: 0.00 });
            });
        } else {
            res.json({ balance: results[0].balance });
        }
    });
});

// Mine new block (HTTP endpoint - kept for compatibility)
app.post('/mine-block', (req, res) => {
    const { email } = req.body;
    const difficulty = INITIAL_DIFFICULTY; // You could make this dynamic
    
    // Get latest block
    const getLatestBlockSql = 'SELECT * FROM blocks ORDER BY block_index DESC LIMIT 1';
    
    pool.query(getLatestBlockSql, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        const previousBlock = results.length > 0 ? results[0] : null;
        const newIndex = previousBlock ? previousBlock.block_index + 1 : 0;
        const previousHash = previousBlock ? previousBlock.hash : '0';
        
        // Create new block
        const newBlock = {
            index: newIndex,
            timestamp: new Date().toISOString(),
            data: { amount: Math.random() * 100 },
            previousHash: previousHash,
            nonce: 0 // Start with 0
        };
        
        // Mine the block (find a valid nonce)
        const crypto = require('crypto-js');
        let hash;
        do {
            newBlock.nonce++;
            hash = crypto.SHA256(
                newBlock.index + 
                newBlock.timestamp + 
                newBlock.previousHash + 
                JSON.stringify(newBlock.data) + 
                newBlock.nonce
            ).toString();
        } while (!hash.startsWith('0'.repeat(difficulty)));
        
        newBlock.hash = hash;
        
        // Save block to database
        const insertSql = `
            INSERT INTO blocks 
            (block_index, timestamp, data, previous_hash, hash, nonce, mined_by) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        pool.query(insertSql, [
            newBlock.index,
            newBlock.timestamp,
            JSON.stringify(newBlock.data),
            newBlock.previousHash,
            newBlock.hash,
            newBlock.nonce,
            email
        ], (err, result) => {
            if (err) {
                console.error('Error saving block:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            // Update user balance
            const updateBalanceSql = `
                UPDATE user_balances 
                SET balance = balance + 3.45 
                WHERE email = ?
            `;
            
            pool.query(updateBalanceSql, [email], (err) => {
                if (err) {
                    console.error('Error updating balance:', err);
                    return res.status(500).json({ error: 'Database error' });
                }
                
                res.json({ 
                    message: 'Block mined successfully',
                    block: newBlock,
                    newBalance: 3.45
                });
            });
        });
    });
});

// Get blockchain endpoint
app.get('/get-blockchain', (req, res) => {
    const sql = 'SELECT * FROM blocks ORDER BY block_index ASC';
    
    pool.query(sql, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        res.json({ blockchain: results });
    });
});

// Check chain validity endpoint
app.get('/check-validity', (req, res) => {
    const sql = 'SELECT * FROM blocks ORDER BY block_index ASC';
    
    pool.query(sql, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        let isValid = true;
        
        // Check chain validity
        for (let i = 1; i < results.length; i++) {
            const currentBlock = results[i];
            const previousBlock = results[i - 1];
            
            // Recalculate hash to verify
            const crypto = require('crypto-js');
            const calculatedHash = crypto.SHA256(
                currentBlock.block_index + 
                currentBlock.timestamp + 
                currentBlock.previous_hash + 
                currentBlock.data + 
                currentBlock.nonce
            ).toString();
            
            if (currentBlock.hash !== calculatedHash) {
                isValid = false;
                break;
            }
            
            if (currentBlock.previous_hash !== previousBlock.hash) {
                isValid = false;
                break;
            }
        }
        
        res.json({ isValid });
    });
});

// Create HTTP server
const server = app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

// Add WebSocket support to the HTTP server
server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});