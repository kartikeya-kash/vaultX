**VaultX - Blockchain-Based Digital Wallet**

**Description:**
Developed a secure digital wallet application with blockchain integration, allowing users to mine blocks,
earn cryptocurrency (VX), and track transactions. The system features user authentication,
real-time mining visualization, and blockchain validation.

**Key Components & Technologies:**

Frontend: HTML5, CSS3, JavaScript
Backend: Node.js, Express.js
Database: MySQL
Blockchain: Custom implementation with Proof-of-Work (PoW) mining
APIs: RESTful endpoints for user/auth management and blockchain operations
WebSocket: Real-time mining progress updates


**Features:**

1. User Authentication
    Secure registration/login with session management.
    Password validation and error handling.

2. Blockchain Integration
    Mining: Users mine blocks via PoW (SHA-256 hashing) with adjustable difficulty.
    Rewards: Earn 3.45 VX per mined block (stored in MySQL).

3. Real-Time Mining UI
    WebSocket broadcasts hash attempts, nonce values, and mining stats live to the dashboard.

4. Dashboard
    Displays user balance, mined blocks, and transaction history.
    Interactive buttons for mining/validating the chain.

**Technical Highlights:**
    Database Design: MySQL tables for user data (userinfo), balances (user_balances), and blockchain (blocks).
    Security: Session-based auth, data sanitization, and cryptographic hashing.
    Performance: Asynchronous mining with WebSocket for real-time feedback.

**Impact:**
Demonstrated end-to-end blockchain implementation, combining financial tracking with decentralized ledger technology in a user-friendly interface.

**Code & Deployment:**
GitHub: https://github.com/kartikeya-kash/vaultX/tree/master
Deployed: Localhost (Node.js server) with MySQL backend.

**Skills Demonstrated:**
Full-stack development, blockchain fundamentals, database management, and real-time system design.

