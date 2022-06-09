const { config } = require('dotenv');
const { expect } = require("chai");
const { BigNumber, getBalance, utils } = require("ethers");

describe("UniswapQuery", () => {

    let deployer;

    beforeEach(async () => {
        [ deployer ] = await ethers.getSigners();

        const UniswapQueryFactory = await ethers.getContractFactory("UniswapQuery");
        uniswapQuery = await UniswapQueryFactory.connect(deployer).deploy();
        await uniswapQuery.deployed();
    });

    it("Gets Pairs by index range", async () => {
        const pairs = (await uniswapQuery.getPairsByIndexRange("0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac", 0, 10));
        expect(pairs.length).to.equal(10);
    });

});
