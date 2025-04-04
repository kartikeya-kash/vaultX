document.addEventListener('DOMContentLoaded', function() {
    // Get the username from session storage
    const username = sessionStorage.getItem('username');
    const email = sessionStorage.getItem('email');
    
    if (!username || !email) {
        window.location.href = 'index.html';
        return;
    }

    // Display user info
    document.getElementById('username-display').textContent = username;
    document.getElementById('email-display').textContent = email;

    // Fetch user balance from server
    fetch('http://localhost:3000/userinfo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch user data');
        }
        return response.json();
    })
    .then(data => {
        document.getElementById('balance-display').textContent = data.balance || '0.00';
        // Also fetch KCoin balance
        fetchKCoinBalance();
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('balance-display').textContent = 'Error loading balance';
    });

    // Fetch and display blockchain
    fetchBlockchain();

    // Logout button
    document.getElementById('logout-btn').addEventListener('click', function() {
        sessionStorage.removeItem('username');
        sessionStorage.removeItem('email');
        window.location.href = 'index.html';
    });

    // Mine block button
    document.getElementById('mineBlock').addEventListener('click', function() {
        mineBlock();
    });

    // Check validity button
    document.getElementById('checkValidity').addEventListener('click', function() {
        checkValidity();
    });

    // Blockchain functions
    function fetchKCoinBalance() {
        fetch('http://localhost:3000/get-balance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email })
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('kcoin-balance').textContent = data.balance.toFixed(2);
        })
        .catch(error => {
            console.error('Error fetching KCoin balance:', error);
        });
    }

    function mineBlock() {
        const statusElement = document.getElementById('statusMessage');
        const miningProcessElement = document.getElementById('miningProcess');
        const hashAttemptsElement = document.getElementById('hashAttempts');
        const miningStatsElement = document.getElementById('miningStats');
        
        // Reset UI
        statusElement.style.display = 'block';
        statusElement.className = 'status mining';
        statusElement.textContent = 'Mining new block...';
        miningProcessElement.style.display = 'block';
        hashAttemptsElement.innerHTML = '';
        miningStatsElement.innerHTML = '';
        
        // Start timer
        const startTime = performance.now();
        let attemptCount = 0;
        
        // Create a websocket connection for real-time updates
        const socket = new WebSocket('ws://localhost:3000/mine-block-ws');
        
        socket.onopen = function() {
            socket.send(JSON.stringify({ email: sessionStorage.getItem('email') }));
        };
        
        socket.onmessage = function(event) {
            const data = JSON.parse(event.data);
            
            if (data.type === 'hash_attempt') {
                attemptCount++;
                const attemptElement = document.createElement('div');
                attemptElement.textContent = `Attempt #${attemptCount}: ${data.hash}`;
                hashAttemptsElement.appendChild(attemptElement);
                hashAttemptsElement.scrollTop = hashAttemptsElement.scrollHeight;
            }
            else if (data.type === 'block_mined') {
                // Calculate mining time
                const endTime = performance.now();
                const miningTime = ((endTime - startTime) / 1000).toFixed(5);
                
                // Update UI
                
                statusElement.textContent = 'Block mined successfully!';
                statusElement.className = 'status valid';
                miningStatsElement.style.color = 'black'; 
                miningStatsElement.innerHTML = `
                    <p>Block mined in ${miningTime} seconds</p>
                    <p>Total attempts: ${attemptCount}</p>
                    <p>Hash found: ${data.block.hash}</p>
                    <p>Nonce: ${data.block.nonce}</p>
                    <p>NOTE: Refresh to see your updated balance!!</p>
                `;
                
                // Update balance and blockchain display
                fetchKCoinBalance();
                fetchBlockchain();
                
                // Close the websocket
                socket.close();
                
                setTimeout(() => {
                    statusElement.style.display = 'none';
                }, 5000);
            }
            else if (data.type === 'error') {
                statusElement.textContent = 'Error mining block: ' + data.message;
                statusElement.className = 'status invalid';
                console.error('Error mining block:', data.message);
                socket.close();
            }
        };
        
        socket.onerror = function(error) {
            statusElement.textContent = 'Error mining block: Connection error';
            statusElement.className = 'status invalid';
            console.error('WebSocket error:', error);
        };
    }

    function fetchBlockchain() {
        fetch('http://localhost:3000/get-blockchain')
        .then(response => response.json())
        .then(data => {
            displayBlockchain(data.blockchain);
        })
        .catch(error => {
            console.error('Error fetching blockchain:', error);
        });
    }

    function displayBlockchain(blocks) {
        const blockchainView = document.getElementById('blockchainView');
        blockchainView.innerHTML = '';
        
        blocks.forEach(block => {
            const blockElement = document.createElement('div');
            blockElement.className = 'block';
            
            blockElement.innerHTML = `
                <div class="block-header">Block #${block.block_index}</div>
                <div class="block-data" style="text-align: left;">
                    <p><strong>Timestamp:</strong> ${new Date(block.timestamp).toLocaleString()}</p>
                    <p><strong>Previous Hash:</strong> ${block.previous_hash.substring(0, 20)}...</p>
                    <p><strong>Hash:</strong> ${block.hash.substring(0, 20)}...</p>
                    <p><strong>Nonce:</strong> ${block.nonce}</p>
                    <p><strong>Data:</strong> ${block.data}</p>
                    <p><strong>Mined by:</strong> ${block.mined_by || 'System'}</p>
                </div>
            `;
            
            blockchainView.appendChild(blockElement);
        });
    }

    function checkValidity() {
        const statusElement = document.getElementById('statusMessage');
        statusElement.style.display = 'block';
        statusElement.className = 'status';
        statusElement.textContent = 'Checking blockchain validity...';
        
        fetch('http://localhost:3000/check-validity')
        .then(response => response.json())
        .then(data => {
            if (data.isValid) {
                statusElement.textContent = 'Blockchain is valid!';
                statusElement.className = 'status valid';
            } else {
                statusElement.textContent = 'Blockchain is NOT valid!';
                statusElement.className = 'status invalid';
            }
            
            setTimeout(() => {
                statusElement.style.display = 'none';
            }, 3000);
        })
        .catch(error => {
            statusElement.textContent = 'Error checking validity: ' + error.message;
            statusElement.className = 'status invalid';
            console.error('Error checking validity:', error);
        });
    }
});