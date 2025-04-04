var userbalance = 0; //to store number of coins of the user
const SHA256 = require('crypto-js/sha256');//import the lib
class Block{
    constructor(index , timestamp , data , previousHash = ''){ // what will the parameter to calculate the hash
        this.index=index;
        this.timestamp=timestamp;
        this.data=data;
        this.previousHash=previousHash;
        this.hash=this.calculateHash();
        this.nonce = 0;// a random value for proof of work
    }

    calculateHash(){ // to calculate the hash of the Block by taking the properties of the block
        return SHA256(this.index + this.timestamp + this.previousHash +JSON.stringify(this.data) + this.nonce).toString();
    }

    mineBlock(difficulty){  // act as a proof of work which require lot of hash power (in simple terms electricity 
        // to calculate the hash) to avoid spamming of block in the chain and to avoid security risks in the blockchain

    while(this.hash.substring(0,difficulty) != Array(difficulty+1).join("0")){
    this.nonce++;
    console.log(this.hash);
    this.hash = this.calculateHash();
}
userbalance+=3.45 ; //add 3.45 coins in the balance of each user 
console.log("Block Mined: "+ this.hash);
    }
}


class blockChain{

    constructor(){
        this.chain = [this.createGenesisBlock()]; // array of block
        this.difficulty = 10; 
    }

    createGenesisBlock(){
        return new Block(0,'23/03/2025',"Genesis Block" , "0");
    }

    getLatestBlock(){ // to show the recently created block 
return this.chain[this.chain.length-1];
    }

    addBlock(newBlock){ // to add a block to chain
    newBlock.previousHash = this.getLatestBlock().hash;
    newBlock.mineBlock(this.difficulty); // pass difficulty
    this.chain.push(newBlock);
    }

isChainValid(){
    for(let i =1 ; i<this.chain.length;i++){
        const currentBlock = this.chain[i];
        const previousBlock = this.chain[i-1];

        if(currentBlock.hash != currentBlock.calculateHash()){
            return false;
        }
        if(currentBlock.previousHash != previousBlock.hash){
            return false;
        }
    }

    return true;
}
    
}

let kcoin = new blockChain(); // new coin called kcoin

//testing code for mining blocks
/* console.log("mining block 1 ... ");
kcoin.addBlock(new Block(1, '1/02/2000', { amount: 4 }));

console.log("mining block 2 ... ");
kcoin.addBlock(new Block(2, '3/02/2000', { amount: 20 }));
console.log(JSON.stringify(kcoin,null,4)); */