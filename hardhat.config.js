require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000  // Higher runs = lower gas for function calls
      },
      viaIR: true  // Enable IR-based code generation for better optimization
    }
  },
  networks: {
    // Local Hardhat network
    hardhat: {
      chainId: 31337,
    },
    // Celo Sepolia Testnet (New Developer Testnet - Chain ID 11142220)
    celoSepolia: {
      url: "https://forno.celo-sepolia.celo-testnet.org", // Celo Sepolia RPC
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11142220,
      timeout: 60000,
      httpHeaders: {
        "User-Agent": "hardhat"
      }
    },
  },
  etherscan: {
    apiKey: {
      alfajores: process.env.CELOSCAN_API_KEY || "api-key",
      celo: process.env.CELOSCAN_API_KEY || "api-key",
      celoSepolia: process.env.CELOSCAN_API_KEY || "api-key",
    },
    customChains: [
      {
        network: "celoSepolia",
        chainId: 11142220,
        urls: {
          apiURL: "https://api-sepolia.celoscan.io/api",
          browserURL: "https://celo-sepolia.blockscout.com",
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
};
