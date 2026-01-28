import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const proxyDorz = buildModule("ProxyDorz", (m) => {
  const proxyAdminOwner = m.getAccount(0);

  const dorz = m.contract("Dorz");

  const proxyDr = m.contract("TransparentUpgradeableProxy", [
	dorz,
	proxyAdminOwner,
	"0x",
  ]);

  const proxyAdminAddress = m.readEventArgument(
	proxyDr,
	"AdminChanged",
	"newAdmin"
  );

  const proxyAdminDr = m.contractAt("ProxyAdmin", proxyAdminAddress);

  return { implementation: dorz, proxyAdminDr, proxyDr };
});

const dorzModule =  buildModule("DorzModule", (m) => {
  const { proxyDr, proxyAdminDr } = m.useModule(proxyDorz);

  const dorz = m.contractAt("Dorz", proxyDr);

  const initialOwner = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";
  const vestingWallet = "0x70997970c51812dc3a010c7d01b50e0d17dc79c8";
  const teamWallet = "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc";

  m.call(dorz, "initialize", [initialOwner, vestingWallet, teamWallet]);

  return { dorz, proxyDr, proxyAdminDr };
});

export default dorzModule;