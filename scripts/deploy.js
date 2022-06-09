const { config } = require('dotenv');
const { ethers, run } = require('hardhat');

config({ path: `../config/${process.env.ENVIRONMENT ? process.env.ENVIRONMENT : 'localhost'}.env` });

async function main() {
  const [ deployer, arbitor ] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const UniswapQueryFactory = await ethers.getContractFactory("UniswapQuery");
  const uniswapQuery = await UniswapQueryFactory.deploy();
  console.log("UniswapQuery address:", uniswapQuery.address);

  // const MultiCallFL = await ethers.getContractFactory("MultiCallFL");
  // const multiCallFL = await MultiCallFL.deploy(arbitor.address, process.env.WETH_ADDRESS, process.env.FLASHLOAN_PROVIDER);
  // console.log("MultiCallFL address:", multiCallFL.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
