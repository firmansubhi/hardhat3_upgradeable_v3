import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

import vestingModule from "./proxyVesting.js";


const upgradeVesting = buildModule("ProxyVesting2", (m) => {
  const proxyAdminOwner = m.getAccount(0);

  const { proxyVest, proxyAdminVest } = m.useModule(vestingModule);

  const vesting = m.contract("Vesting2");

  const encodedFunctionCall = m.encodeFunctionCall(vesting, "updateAPR", []);

  m.call(proxyAdminVest, "upgradeAndCall", [proxyVest, vesting, encodedFunctionCall], {
    from: proxyAdminOwner,
  });

  return { proxyAdminVest, proxyVest };
});

const vestingUpgradeModule = buildModule("Vesting2Module", (m) => {
  const { proxyVest } = m.useModule(upgradeVesting);

  const vesting = m.contractAt("Vesting2", proxyVest);

  return { vesting };
});

export default vestingUpgradeModule;