import hre from "hardhat";

async function main() {
    const { ethers } = await hre.network.connect({
        network: "localhost",
    });

    const [currentAccount] = await ethers.getSigners();
    console.log("Current account:", currentAccount.address);

    const proxy = "0xb11f9b33ee93B1f990a805fa68817A74e82A6891";
    const proxyAdmin = "0x71535B5662df5B31f98a68B292707fDcf35b9F48";
    const v2Implementation = "0xCfaa0489f27b8A6980DeA5134f32516c755B7e63";

    const proxyAdminContract = await ethers.getContractAt("ProxyAdmin", proxyAdmin);
    const v2 = await ethers.getContractAt("Dorz2", v2Implementation);

    const encodedFunctionCall = v2.interface.encodeFunctionData("version");
    console.log("Upgrading to V2...");
    const upgradeTx = await proxyAdminContract.connect(currentAccount).upgradeAndCall(proxy, v2Implementation, encodedFunctionCall);
    await upgradeTx.wait();
    console.log("Upgraded to V2");

    //const v2Proxy = await ethers.getContractAt("Dorz2", proxy);
    //const currentValue = await v2Proxy.getNaik();
    //console.log("Current value after upgrade and call:", currentValue.toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});