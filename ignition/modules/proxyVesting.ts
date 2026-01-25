import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const proxyVesting = buildModule("ProxyVesting", (m) => {
  const proxyAdminOwner = m.getAccount(0);

  const vesting = m.contract("Vesting");

  const proxyVest = m.contract("TransparentUpgradeableProxy", [
	vesting,
	proxyAdminOwner,
	"0x",
  ]);

  const proxyAdminAddress = m.readEventArgument(
	proxyVest,
	"AdminChanged",
	"newAdmin"
  );

  const proxyAdminVest = m.contractAt("ProxyAdmin", proxyAdminAddress);

  return { implementation: vesting, proxyAdminVest, proxyVest };
});

const vestingModule =  buildModule("VestingModule", (m) => {
  const { implementation, proxyVest, proxyAdminVest } = m.useModule(proxyVesting);

  const vesting = m.contractAt("Vesting", proxyVest);

  //https://docs.chain.link/data-feeds/price-feeds/addresses?networkType=testnet&testnetSearch=ETH&testnetPage=1#Sepolia%20Testnet
  //sepolia testnet
  //0x694AA1769357215DE4FAC081bf1f309aDC325306
  //mainnet
  //0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419

  const dorzProxy = "0xCB09BB42A4Def3420e3AeC8a55eedD1C24036AA9";
  const EthtoUsd = "0x694AA1769357215DE4FAC081bf1f309aDC325306";
  const MyCoinperUSD = "0x694AA1769357215DE4FAC081bf1f309aDC325306";


  m.call(vesting, "initialize", [dorzProxy, EthtoUsd, MyCoinperUSD]);

  return { implementation, vesting, proxyVest, proxyAdminVest };
});

export default vestingModule;