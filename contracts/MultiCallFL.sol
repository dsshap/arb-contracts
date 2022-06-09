//SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "hardhat/console.sol";

import "@aave/protocol-v2/contracts/flashloan/base/FlashLoanReceiverBase.sol";
import "@aave/protocol-v2/contracts/flashloan/interfaces/IFlashLoanReceiver.sol";
import "@aave/protocol-v2/contracts/interfaces/ILendingPoolAddressesProvider.sol";
import "@aave/protocol-v2/contracts/interfaces/ILendingPool.sol";

interface IWETH is IERC20 {
    function deposit() external payable;
    function withdraw(uint) external;
}

contract MultiCallFL is
    FlashLoanReceiverBase
{
    using SafeMath for uint256;

    address private immutable EXECUTOR;
    address private immutable OWNER;
    address public WETH_ADDRESS;
    IWETH private WETH;

    modifier onlyOwner() {
        require(msg.sender == OWNER, "caller is not the owner");
        _;
    }

    modifier onlyExecutor() {
        require(msg.sender == EXECUTOR, "caller is not the executor");
        _;
    }

    modifier onlyLender() {
        require(msg.sender == address(LENDING_POOL), "caller is not the lender");
        _;
    }

    constructor(
        address executor,
        address wethAddress,
        ILendingPoolAddressesProvider addressProvider
    ) FlashLoanReceiverBase(addressProvider)
        public payable
    {
        OWNER = msg.sender;
        EXECUTOR = executor;
        WETH_ADDRESS = wethAddress;
        WETH = IWETH(WETH_ADDRESS);
    }

    function flashloan(uint256 amountToBorrow, bytes memory params)
        external
        onlyExecutor
    {
        require(amountToBorrow > 0, "loan amount cannot be 0");

        address receiverAddress = address(this);

        address[] memory assets = new address[](1);
        assets[0] = WETH_ADDRESS;

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amountToBorrow;

        uint256[] memory modes = new uint256[](1);
        modes[0] = 0;

        address onBehalfOf = address(this);
        uint16 referralCode = 0;

        LENDING_POOL.flashLoan(
            receiverAddress,
            assets,
            amounts,
            modes,
            onBehalfOf,
            params,
            referralCode
        );
    }

    /**
        This function is called after the contract
        has received the flash loan amount
     */
    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        bytes calldata params
    )
        external
        onlyLender
        override
        returns (bool)
    {
        require(initiator == address(this), "not initiated by contract");

        uint256 wethBalance = WETH.balanceOf(address(this));
        require(wethBalance > premiums[0], "not enough weth to cover fees");

        uint debt = amounts[0].add(premiums[0]);
        WETH.approve(address(LENDING_POOL), debt);
        uniswapWethParams(amounts[0], params, debt);
        return true;
    }

    function uniswapWethParams(
        uint256 loan,
        bytes memory params,
        uint256 debt
    )
        internal
    {
        (
            uint256 ethAmountToCoinbase,
            address[] memory targets,
            bytes[] memory payloads
        ) = abi.decode(params, (uint256, address[], bytes[]));

        require(targets.length == payloads.length,
            "targets and payloads mismatch");

        WETH.transfer(targets[0], loan);

        for (uint256 i = 0; i < targets.length; i++) {
            (
                bool success,
                bytes memory response // Do i really need this if its not referenced? Or should i use this in place of the hard coded error string?
            ) = targets[i].call(payloads[i]);

            require(success, "target call with payload failed");
        }

        uint256 wethBalance = WETH.balanceOf(address(this));
        uint256 profit = wethBalance - debt - ethAmountToCoinbase;

        require(profit >= 0, "negative profit");

        if (ethAmountToCoinbase == 0) return;

        uint256 ethBalance = address(this).balance;
        if (ethBalance < ethAmountToCoinbase) {
            WETH.withdraw(ethAmountToCoinbase - ethBalance);
        }
        block.coinbase.transfer(ethAmountToCoinbase);
    }

    function withdraw(address payable to, uint256 value, bytes calldata data)
        external
        onlyOwner
        payable
        returns (bytes memory)
    {
        require(to != address(0), "address cannot 0");
        require(value > 0, "value amount cannot be 0");

        uint256 ethBalance = address(this).balance;
        uint256 wethBalance = WETH.balanceOf(address(this));

        require(ethBalance + wethBalance >= value, "requesting more than available");

        if (ethBalance < value) {
            WETH.withdraw(value - ethBalance);
        }

        (bool success, bytes memory result) = to.call{value: value}(data);
        require(success, "call failed");

        return result;
    }

    // Function to receive Ether. msg.data must be empty
    receive() external payable {}

    // Fallback function is called when msg.data is not empty
    fallback() external payable {}
}
