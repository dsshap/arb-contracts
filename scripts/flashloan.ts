import { config } from 'dotenv';
import { BigNumber, Contract, ethers, Wallet, utils } from "ethers";
import { BUNDLE_EXECUTOR_ABI } from "../src/abi";

config({ path: `config/${process.env.ENVIRONMENT}.env` });

const PRIVATE_KEY = process.env.PRIVATE_KEY || ""
const ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL || "http://127.0.0.1:8545"
const BUNDLE_EXECUTOR_ADDRESS = process.env.BUNDLE_EXECUTOR_ADDRESS || ""

async function main() {

  const provider = new ethers.providers.JsonRpcProvider(ETHEREUM_RPC_URL);

  const gasPrice = await provider.getGasPrice();
  console.log('getGasPrice', gasPrice.toString())

  // const blockNumber = await provider.getBlockNumber()
  // console.log(blockNumber);
  // return;

  const wallet = new Wallet(PRIVATE_KEY);
  const walletSigner = wallet.connect(provider)

  console.log(await provider.getTransactionCount(wallet.address, 'latest'))

  const fl = new Contract(BUNDLE_EXECUTOR_ADDRESS, BUNDLE_EXECUTOR_ABI, walletSigner)

  const ethersAbiCoder = new utils.AbiCoder()
  // const flashloanParametersTypes = []
  // const flashloanParamtersInputs = []
  const encodedParameters = ethersAbiCoder.encode([], [])

  const transaction = await fl.flashloan(1, [], {
    gasPrice: gasPrice,
    gasLimit: BigNumber.from(1000000),
  });
  console.log(transaction)

  const result = await transaction.wait()
  console.log(result)

  // const signedTransaction = await arbitrageSigningWallet.signTransaction(transaction);
  // console.log(signedTransaction)

  // const result = await walletSigner.sendTransaction(transaction)
  // console.log(result)


}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
