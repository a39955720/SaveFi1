// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract SaveToken is ERC20, ERC20Burnable {
    constructor(uint256 initialSupply) ERC20("SaveToken", "SAVE") {
        _mint(msg.sender, initialSupply);
    }
}
