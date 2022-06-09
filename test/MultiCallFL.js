const { config } = require('dotenv');
const { expect } = require("chai");
const { BigNumber, getBalance, utils } = require("ethers");

describe("MultiCallFL", () => {

    let deployer;
    let arbitor;
    let WETH;
    let multiCall;
    let simpleWethSwap;

    beforeEach(async () => {
        [ deployer, arbitor ] = await ethers.getSigners();

        WETH = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", process.env.WETH_ADDRESS, arbitor);

        const SESFactory = await ethers.getContractFactory("SimpleWethSwap");
        simpleWethSwap = await SESFactory.connect(deployer).deploy(WETH.address);
        await simpleWethSwap.deployed();

        const MCFLFactory = await ethers.getContractFactory("MultiCallFL");
        multiCall = await MCFLFactory.connect(deployer).deploy(arbitor.address, WETH.address, process.env.FLASHLOAN_PROVIDER);
        await multiCall.deployed();

        const wethSendArbitorTx = await arbitor.sendTransaction({
            to: WETH.address,
            value: ethers.utils.parseEther('1000'),
        });
        await wethSendArbitorTx.wait();

        await WETH.transfer(multiCall.address, ethers.utils.parseEther('1000'))
    });

    it("Initiate properly", async () => {
        const addressProvider = await multiCall.ADDRESSES_PROVIDER();
        await expect(addressProvider.toLowerCase()).to.equal(process.env.FLASHLOAN_PROVIDER);
        await expect(await multiCall.WETH_ADDRESS()).to.equal(process.env.WETH_ADDRESS);
    });

    it("Initiate Flash Loan", async () => {
        const loan = ethers.utils.parseEther('1');
        const fee = loan.mul(9).div(10000);

        const sendbackCall = await simpleWethSwap.populateTransaction.transfer(multiCall.address, loan)
        const params = new utils.AbiCoder().encode(
            ['uint256', 'address[]', 'bytes[]'],
            [0, [simpleWethSwap.address], [sendbackCall.data]]
        )

        const initialBalance = await WETH.balanceOf(multiCall.address);
        const endBalance = initialBalance.sub(fee);
        const transaction = multiCall.connect(arbitor).flashloan(loan, params);

        // const lendingBalance = await WETH.allowance(factory.address, process.env.LENDINGPOOL);
        await expect(transaction).to.emit(WETH, 'Approval').withArgs(multiCall.address, process.env.LENDINGPOOL, loan.add(fee));
        expect(await WETH.balanceOf(multiCall.address)).to.equal(endBalance)
    });

    it("Transfer funds out", async () => {
        const amount = ethers.utils.parseEther('1000');
        const transaction = await multiCall.connect(deployer).withdraw(deployer.address, amount, []);
        expect(transaction).to.changeEtherBalance(deployer, amount);
    });

    it("Transfer funds include weth withdraw", async () => {
        const provider = await ethers.getDefaultProvider();
        const ethToSend = ethers.utils.parseEther('10');
        const wethSendTx = await deployer.sendTransaction({
            to: multiCall.address,
            value: ethToSend,
        });
        await wethSendTx.wait();

        const amount = ethers.utils.parseEther('1010');
        const transaction = await multiCall.connect(deployer).withdraw(deployer.address, amount, []);
        const wethBalance = await WETH.balanceOf(multiCall.address);
        const ethBalance = await provider.getBalance(multiCall.address);

        expect(transaction).to.changeEtherBalance(deployer, amount);
        expect(wethBalance).to.equal(0);
        expect(ethBalance).to.equal(0);
    });

    it("Transfer too much funds out", async () => {
        const amount = ethers.utils.parseEther('5000');
        const transaction = multiCall.connect(deployer).withdraw(deployer.address, amount, []);
        await expect(transaction).to.be.revertedWith("requesting more than available")
    });

    it("Transfer funds out by unknown", async () => {
        const [ , , unknown ] = await ethers.getSigners();
        const amount = ethers.utils.parseEther('1000');
        const transaction = multiCall.connect(unknown).withdraw(unknown.address, amount, []);
        await expect(transaction).to.be.revertedWith("caller is not the owner")
    });

    it("Initiate flash loan from unknown sender", async () => {
        const [ , , unknown ] = await ethers.getSigners();
        const loan = ethers.utils.parseEther('1');

        const params = new utils.AbiCoder().encode(
            ['uint256', 'address[]', 'bytes[]'],
            [0, [], []]
        )

        const transaction = multiCall.connect(unknown).flashloan(loan, params);
        await expect(transaction).to.be.revertedWith("caller is not the executor")
    });

    it("Execute flash loan from unknown sender", async () => {
        const [ , , unknown ] = await ethers.getSigners();
        const loan = ethers.utils.parseEther('1');
        const fee = loan.mul(100).div(10000);

        const transaction = multiCall.connect(unknown).executeOperation([WETH.address], [loan], [fee], unknown.address, []);
        await expect(transaction).to.be.revertedWith("caller is not the lender")
    });
});
