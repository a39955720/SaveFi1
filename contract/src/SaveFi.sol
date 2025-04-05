// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {DepositContract} from "./DepositContract.sol";

error SaveFi__AlreadyWithdrawn();
error SaveFi__DepositAmountShouldBeGreaterThanZero();
error SaveFi__TotalDepositDaysShouldBeGreaterThanZero();
error SaveFi__InsufficientAllowance();
error SaveFi__TooEarlyToDeposit();
error SaveFi__TooEarlyToWithdraw();
error SaveFi__NotStarted();
error SaveFi__AlreadyStarted();

contract SaveFi is Ownable {
    IERC20 private immutable i_usdc;
    IERC20 private immutable i_aUsdc;
    ERC20Burnable private immutable i_save;
    address private immutable i_aavePoolAddress;
    address private immutable i_swapRouter02Address;

    mapping(address => DepositPlan) private s_depositPlan;

    struct DepositPlan {
        bool isWithdrawn;
        bool isStarted;
        DepositContract depositContract;
        uint256 amountPerDeposit;
        uint256 depositEndTime;
        uint256 nextDepositDeadline;
    }

    event DepositPlanStarted(
        address indexed user,
        address depositContract,
        uint256 amount,
        uint256 depositEndTime,
        uint256 nextDepositDeadline
    );
    event Deposited(address indexed user, uint256 amount, uint256 nextDepositDeadline, bool onTime);
    event Withdrawn(address indexed user, uint256 amount, bool early);

    modifier onlyIfNotWithdrawn() {
        if (s_depositPlan[msg.sender].isWithdrawn) {
            revert SaveFi__AlreadyWithdrawn();
        }
        _;
    }

    modifier onlyIfStarted() {
        if (!s_depositPlan[msg.sender].isStarted) {
            revert SaveFi__NotStarted();
        }
        _;
    }

    constructor(
        address _usdcAddress,
        address _aUsdcAddress,
        address _saveTokenAddress,
        address _aavePoolAddress,
        address _swapRouter02Address
    ) Ownable(msg.sender) {
        i_usdc = IERC20(_usdcAddress);
        i_aUsdc = IERC20(_aUsdcAddress);
        i_save = ERC20Burnable(_saveTokenAddress);
        i_aavePoolAddress = _aavePoolAddress;
        i_swapRouter02Address = _swapRouter02Address;
    }

    function startDeposit(uint256 amountPerDeposit, uint256 totalDepositDays) external {
        if (amountPerDeposit == 0) {
            revert SaveFi__DepositAmountShouldBeGreaterThanZero();
        }
        if (totalDepositDays == 0) {
            revert SaveFi__TotalDepositDaysShouldBeGreaterThanZero();
        }
        if (i_usdc.allowance(msg.sender, address(this)) < amountPerDeposit) {
            revert SaveFi__InsufficientAllowance();
        }
        if (s_depositPlan[msg.sender].isStarted) {
            revert SaveFi__AlreadyStarted();
        }

        DepositContract depositContract = new DepositContract(
            address(i_usdc),
            address(i_aUsdc),
            address(i_save),
            i_aavePoolAddress,
            i_swapRouter02Address,
            msg.sender,
            owner(),
            amountPerDeposit
        );

        i_usdc.transferFrom(msg.sender, address(depositContract), amountPerDeposit);
        depositContract.firstDeposit();

        s_depositPlan[msg.sender] = DepositPlan(
            false,
            true,
            depositContract,
            amountPerDeposit,
            block.timestamp + totalDepositDays * 1 days,
            block.timestamp + 30 days
        );

        s_depositPlan[msg.sender].isStarted = true;

        emit DepositPlanStarted(
            msg.sender,
            address(depositContract),
            amountPerDeposit,
            s_depositPlan[msg.sender].depositEndTime,
            s_depositPlan[msg.sender].nextDepositDeadline
        );
    }

    function deposit(uint256 minAmountOut) external onlyIfNotWithdrawn onlyIfStarted {
        if (block.timestamp < s_depositPlan[msg.sender].nextDepositDeadline - 30 days) {
            revert SaveFi__TooEarlyToDeposit();
        }
        if (i_usdc.allowance(msg.sender, address(this)) < s_depositPlan[msg.sender].amountPerDeposit) {
            revert SaveFi__InsufficientAllowance();
        }

        s_depositPlan[msg.sender].nextDepositDeadline += 30 days;

        i_usdc.transferFrom(
            msg.sender, address(s_depositPlan[msg.sender].depositContract), s_depositPlan[msg.sender].amountPerDeposit
        );

        if (block.timestamp < s_depositPlan[msg.sender].nextDepositDeadline) {
            s_depositPlan[msg.sender].depositContract.deposit(true, minAmountOut);
            emit Deposited(
                msg.sender,
                s_depositPlan[msg.sender].amountPerDeposit,
                s_depositPlan[msg.sender].nextDepositDeadline,
                true
            );
        } else {
            s_depositPlan[msg.sender].depositContract.deposit(false, minAmountOut);
            emit Deposited(
                msg.sender,
                s_depositPlan[msg.sender].amountPerDeposit,
                s_depositPlan[msg.sender].nextDepositDeadline,
                false
            );
        }
    }

    function withdraw(uint256 minAmountOut) external onlyIfNotWithdrawn onlyIfStarted {
        if (block.timestamp < s_depositPlan[msg.sender].depositEndTime) {
            revert SaveFi__TooEarlyToWithdraw();
        }

        s_depositPlan[msg.sender].isWithdrawn = true;
        s_depositPlan[msg.sender].isStarted = false;
        s_depositPlan[msg.sender].depositContract.withdraw(minAmountOut);
        emit Withdrawn(msg.sender, s_depositPlan[msg.sender].depositContract.getTotalDepositAmount(), false);
    }

    function earlyWithdraw(uint256 minAmountOut) external onlyIfNotWithdrawn onlyIfStarted {
        s_depositPlan[msg.sender].isWithdrawn = true;
        s_depositPlan[msg.sender].isStarted = false;
        s_depositPlan[msg.sender].depositContract.earlyWithdraw(minAmountOut);
        emit Withdrawn(msg.sender, s_depositPlan[msg.sender].depositContract.getTotalDepositAmount(), true);
    }

    function getDepositPlan(address user) external view returns (DepositPlan memory) {
        return s_depositPlan[user];
    }

    function getUserTotalDepositedAmount(address user) external view returns (uint256) {
        return s_depositPlan[user].depositContract.getTotalDepositAmount();
    }

    function getUserTotalSaveTokenAmount(address user) external view returns (uint256) {
        return s_depositPlan[user].depositContract.getTotalSaveTokenAmount();
    }
}
