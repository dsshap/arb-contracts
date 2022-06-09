require("@nomiclabs/hardhat-waffle");
require("hardhat-etherscan-abi");
// require('hardhat/config').HardhatUserConfig

const { config } = require('dotenv');
config({ path: `config/${process.env.ENVIRONMENT ? process.env.ENVIRONMENT : 'localhost'}.env` });

module.exports = {
  solidity: "0.6.12",
  networks: {
    localhost: {
      url: 'http://127.0.0.1:8545',
      allowUnlimitedContractSize: true,
      gasPrice: 'auto',
      gas: 10000000,
      blockGasLimit: 60000000,
    },
    hardhat: {
      forking: {
        url: process.env.ETHEREUM_RPC_URL
      }
    },
    goerli: {
      url: 'https://rpc.goerli.mudit.blog/',
    },
    ethereum: {
      url: process.env.ETHEREUM_RPC_URL,
    },
    matic: {
      url: process.env.ETHEREUM_RPC_URL,
      accounts: [`0x${process.env.PRIVATE_KEY}`]
    },
    kovan: {
      url: process.env.ETHEREUM_RPC_URL,
      accounts: [`0x${process.env.PRIVATE_KEY}`]
    }
  }
};
