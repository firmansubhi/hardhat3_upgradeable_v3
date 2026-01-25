import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { configVariable, defineConfig } from "hardhat/config";
import hardhatAbiExporter from "@solidstate/hardhat-abi-exporter";
import 'dotenv/config';

export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin, hardhatAbiExporter],
  solidity: {
	npmFilesToBuild: [
      "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol",
      "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol",
    ],
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
		  //viaIR: false, 
        },
      },
    },
  },
  networks: {
	localhost: {
      type: "http",
      chainType: "l1",
      url: configVariable("LOCAL_URL"),
      accounts: [configVariable("LOCAL_PRIVATE_KEY")],
    },
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      url: configVariable("SEPOLIA_RPC_URL"),
      accounts: [configVariable("SEPOLIA_PRIVATE_KEY")],
    },
  },
  abiExporter: {
    path: './abi',
	runOnCompile: true,
	clear: true,
	flat: true,
	format: "minimal",
  },
});
