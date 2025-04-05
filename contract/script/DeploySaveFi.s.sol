// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {SaveFi} from "../src/SaveFi.sol";
import {MultiBaas} from "forge-multibaas/MultiBaas.sol";

contract DeploySaveFi is Script {
    SaveFi public saveFi;
    address public usdcAddress;
    address public aUsdcAddress;
    address public saveTokenAddress;
    address public aavePoolAddress;
    address public swapRouter02Address;

    function run() public returns (SaveFi) {
        if (block.chainid == 11155111) {
            usdcAddress = 0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8;
            aUsdcAddress = 0x16dA4541aD1807f4443d92D26044C1147406EB80;
            saveTokenAddress = 0x8cC62c8252eb108be866039Cfc49645450A80D68;
            aavePoolAddress = 0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951;
            swapRouter02Address = 0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E;
        }
        vm.startBroadcast();

        if (block.chainid == 31337) {
            saveFi = new SaveFi(usdcAddress, aUsdcAddress, saveTokenAddress, aavePoolAddress, swapRouter02Address);
        } else {
            saveFi = new SaveFi(usdcAddress, aUsdcAddress, saveTokenAddress, aavePoolAddress, swapRouter02Address);
            MultiBaas.linkContract("SaveFi", address(saveFi));
        }

        vm.stopBroadcast();

        return saveFi;
    }
}
