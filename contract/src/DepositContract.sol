// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

error DepositContract__OnlySaveFi();
error DepositContract__InsufficientAmountOut();

interface Pool {
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
}

interface ISwapRouter02 {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut);
}

contract DepositContract {
    IERC20 private immutable i_usdc;
    IERC20 private immutable i_aUsdc;
    ERC20Burnable private immutable i_save;
    Pool private immutable i_aavePool;
    ISwapRouter02 public immutable i_swapRouter02;
    address private immutable i_depositor;
    address private immutable i_saveFiAddress;
    address private immutable i_projectOwner;
    uint256 private immutable i_amountPerDeposit;

    uint256 private s_totalDepositAmount;

    modifier onlySaveFi() {
        if (msg.sender != i_saveFiAddress) {
            revert DepositContract__OnlySaveFi();
        }
        _;
    }

    constructor(
        address _usdcAddress,
        address _aUsdcAddress,
        address _saveTokenAddress,
        address _aavePoolAddress,
        address _swapRouter02Address,
        address _depositor,
        address _projectOwner,
        uint256 _amountPerDeposit
    ) {
        i_usdc = IERC20(_usdcAddress);
        i_aUsdc = IERC20(_aUsdcAddress);
        i_save = ERC20Burnable(_saveTokenAddress);
        i_aavePool = Pool(_aavePoolAddress);
        i_swapRouter02 = ISwapRouter02(_swapRouter02Address);
        i_depositor = _depositor;
        i_saveFiAddress = msg.sender;
        i_projectOwner = _projectOwner;
        i_amountPerDeposit = _amountPerDeposit;

        i_usdc.approve(address(i_swapRouter02), type(uint256).max);
        i_usdc.approve(address(i_aavePool), type(uint256).max);
    }

    function firstDeposit() external onlySaveFi {
        _depositToAave(i_amountPerDeposit);
    }

    function deposit(bool isDepositOnTime, uint256 minAmountOut) external onlySaveFi {
        uint256 depositorInterest = i_aUsdc.balanceOf(address(this)) - s_totalDepositAmount;
        uint256 withdrawnAmount = i_aavePool.withdraw(address(i_usdc), depositorInterest, address(this));
        uint256 fee = withdrawnAmount * 10 / 100;
        i_usdc.transfer(i_projectOwner, fee);

        _depositToAave(i_amountPerDeposit);

        uint256 amountIn = withdrawnAmount - fee;
        uint256 amountOut = _swapUsdcToSave(amountIn, minAmountOut);

        if (!isDepositOnTime) {
            i_save.burn(amountOut);
        }
    }

    function withdraw(uint256 minAmountOut) external onlySaveFi {
        uint256 depositorInterest = i_aUsdc.balanceOf(address(this)) - s_totalDepositAmount;
        uint256 withdrawnAmount = i_aavePool.withdraw(address(i_usdc), depositorInterest, address(this));
        uint256 fee = withdrawnAmount * 10 / 100;
        i_usdc.transfer(i_projectOwner, fee);

        uint256 amountIn = withdrawnAmount - fee;
        _swapUsdcToSave(amountIn, minAmountOut);

        i_aavePool.withdraw(address(i_usdc), type(uint256).max, address(this));
        i_usdc.transfer(i_depositor, i_usdc.balanceOf(address(this)));
        i_save.transfer(i_depositor, i_save.balanceOf(address(this)));
    }

    function earlyWithdraw(uint256 minAmountOut) external onlySaveFi {
        uint256 depositorInterest = i_aUsdc.balanceOf(address(this)) - s_totalDepositAmount;
        uint256 withdrawnAmount = i_aavePool.withdraw(address(i_usdc), depositorInterest, address(this));
        uint256 fee = withdrawnAmount * 10 / 100;
        i_usdc.transfer(i_projectOwner, fee);

        uint256 amountIn = withdrawnAmount - fee;
        _swapUsdcToSave(amountIn, minAmountOut);

        i_aavePool.withdraw(address(i_usdc), type(uint256).max, address(this));
        i_usdc.transfer(i_depositor, i_usdc.balanceOf(address(this)));
        i_save.burn(i_save.balanceOf(address(this)));
    }

    function _depositToAave(uint256 amount) private {
        i_aavePool.supply(address(i_usdc), amount, address(this), 0);
        s_totalDepositAmount += amount;
    }

    function _swapUsdcToSave(uint256 amountIn, uint256 minAmountOut) private returns (uint256 amountOut) {
        ISwapRouter02.ExactInputSingleParams memory params = ISwapRouter02.ExactInputSingleParams({
            tokenIn: address(i_usdc),
            tokenOut: address(i_save),
            fee: 3000,
            recipient: address(this),
            amountIn: amountIn,
            amountOutMinimum: minAmountOut,
            sqrtPriceLimitX96: 0
        });

        amountOut = i_swapRouter02.exactInputSingle(params);

        if (amountOut < minAmountOut) {
            revert DepositContract__InsufficientAmountOut();
        }
    }

    function getTotalDepositAmount() external view returns (uint256) {
        return s_totalDepositAmount;
    }

    function getTotalSaveTokenAmount() external view returns (uint256) {
        return i_save.balanceOf(address(this));
    }
}
