import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

import dorzModule from "./proxyDorz.js";


const upgradeDorz = buildModule("ProxyDorz2", (m) => {
  const proxyAdminOwner = m.getAccount(0);

  const { proxyDr, proxyAdminDr } = m.useModule(dorzModule);

  const dorz = m.contract("Dorz2");

  m.call(proxyAdminDr, "upgradeAndCall", [proxyDr, dorz, "0x"], {
    from: proxyAdminOwner,
  });

  return { proxyAdminDr, proxyDr };
});

const dorzUpgradeModule = buildModule("Dorz2Module", (m) => {
  const { proxyDr } = m.useModule(upgradeDorz);

  const dorz = m.contractAt("Dorz2", proxyDr);

  return { dorz };
});

export default dorzUpgradeModule;