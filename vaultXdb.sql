create database vaultX;
use vaultX;

create table userinfo(
username varchar(20) not null,
email varchar(200) primary key,
password varchar(200) not null 
);



SET SQL_SAFE_UPDATES = 0;
DELETE FROM userinfo;


ALTER TABLE userinfo ADD COLUMN balance DECIMAL(10,2) DEFAULT 0.00;



-- Add blockchain tables to your vaultX database
CREATE TABLE blocks (
    block_id INT AUTO_INCREMENT PRIMARY KEY,
    block_index INT NOT NULL,
    timestamp VARCHAR(50) NOT NULL,
    data TEXT NOT NULL,
    previous_hash VARCHAR(64) NOT NULL,
    hash VARCHAR(64) NOT NULL,
    nonce INT NOT NULL,
    mined_by VARCHAR(200),
    FOREIGN KEY (mined_by) REFERENCES userinfo(email)
);

CREATE TABLE user_balances (
    email VARCHAR(200) PRIMARY KEY,
    balance DECIMAL(10,2) DEFAULT 0.00,
    FOREIGN KEY (email) REFERENCES userinfo(email)
);

select * from user_balances;
select * from userinfo;
select * from blocks;


DELETE FROM userinfo;
DELETE FROM user_balances;
DELETE FROM blocks;

ALTER TABLE userinfo DROP COLUMN balance;



