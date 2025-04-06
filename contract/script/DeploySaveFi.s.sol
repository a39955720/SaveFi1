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
        } else if (block.chainid == 42220) {
            //CELO Mainnet
            usdcAddress = 0xcebA9300f2b948710d2653dD7B07f33A8B32118C;
            aUsdcAddress = 0xFF8309b9e99bfd2D4021bc71a362aBD93dBd4785;
            saveTokenAddress = 0xABdA89f41220534CcAceb900bCB53F6A98D6d1d6;
            aavePoolAddress = 0x3E59A31363E2ad014dcbc521c4a0d5757d9f3402;
            swapRouter02Address = 0x5615CDAb10dc425a742d643d949a7F474C01abc4;
        } else if (block.chainid == 137) {
            //Polygon pos Mainnet
            usdcAddress = 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174;
            aUsdcAddress = 0x625E7708f30cA75bfd92586e17077590C60eb4cD;
            saveTokenAddress = 0x2B1099443d9e23b4A0928EE0d050f64924f9D0a2;
            aavePoolAddress = 0x794a61358D6845594F94dc1DB02A252b5b4814aD;
            swapRouter02Address = 0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45;
        } else {
            revert("Unsupported network");
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
