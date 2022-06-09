//SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

interface IWETH is IERC20 {
    function deposit() external payable;
    function withdraw(uint) external;
}

contract MultiCall {
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

    constructor(
        address executor,
        address wethAddress
    )
        public
        payable
    {
        OWNER = msg.sender;
        EXECUTOR = executor;
        WETH_ADDRESS = wethAddress;
        WETH = IWETH(WETH_ADDRESS);
    }

    function uniswapWeth(
        uint256 wethAmountToFirstMarket,
        uint256 ethAmountToCoinbase,
        address[] memory targets,
        bytes[] memory payloads
    )
        external
        onlyExecutor
        payable
    {
        require(targets.length == payloads.length, "targets and payloads mismatch");

        uint256 wethBalanceBefore = WETH.balanceOf(address(this));
        require(wethBalanceBefore > wethAmountToFirstMarket, "not enough weth");

        WETH.transfer(targets[0], wethAmountToFirstMarket);

        for (uint256 i = 0; i < targets.length; i++) {
            (
                bool success,
                bytes memory response // Do i really need this if its not referenced? Or should i use this in place of the hard coded error string?
            ) = targets[i].call(payloads[i]);

            require(success, "target call with payload failed");
        }

        uint256 wethBalanceAfter = WETH.balanceOf(address(this));
        uint256 profit = wethBalanceAfter - wethBalanceBefore - ethAmountToCoinbase;

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
