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
  m.call(dorz, "initialize", []);

  return { dorz, proxyDr, proxyAdminDr };
});

export default dorzModule;