//SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "hardhat/console.sol";
import "@uniswap/v2-core/contracts/interfaces/IERC20.sol";

contract SimpleWethSwap {
    address public WETH_ADDRESS;

    constructor(address wethAddress)
        public
        payable
    {
        WETH_ADDRESS = wethAddress;
    }

    function transfer(address to, uint256 amount)
        external
        returns (bool)
    {
        return IERC20(WETH_ADDRESS).transfer(to, amount);
    }
}
