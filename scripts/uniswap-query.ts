import { config } from 'dotenv';
import { BigNumber, Contract, ethers, Wallet, utils } from "ethers";
import { UNISWAP_QUERY_ABI } from "../src/abi";

config({ path: `config/${process.env.ENVIRONMENT}.env` });

const PRIVATE_KEY = process.env.PRIVATE_KEY || ""
const ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL || "http://127.0.0.1:8545"
const UNISWAP_LOOKUP_CONTRACT_ADDRESS = process.env.UNISWAP_LOOKUP_CONTRACT_ADDRESS || ""

async function main() {

  const provider = new ethers.providers.JsonRpcProvider(ETHEREUM_RPC_URL);

  // const gasPrice = await provider.getGasPrice();
  // console.log('getGasPrice', gasPrice.toString())

  // const blockNumber = await provider.getBlockNumber()
  // console.log(blockNumber);
  // return;

  // const wallet = new Wallet(PRIVATE_KEY);
  // const walletSigner = wallet.connect(provider)

  // console.log(await provider.getTransactionCount(wallet.address, 'latest'))

  const uniswapQuery = new Contract(UNISWAP_LOOKUP_CONTRACT_ADDRESS, UNISWAP_QUERY_ABI, provider);
  const pairs = (await uniswapQuery.getPairsByIndexRange("0xCf083Be4164828f00cAE704EC15a36D711491284", 0, 10));
  console.log(pairs)

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
