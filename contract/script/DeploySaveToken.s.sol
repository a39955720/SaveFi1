// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {SaveToken} from "../src/SaveToken.sol";

contract DeploySaveToken is Script {
    function run() public {
        vm.startBroadcast();

        new SaveToken(1000000 ether);

        vm.stopBroadcast();
    }
}
