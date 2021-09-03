const Loot = artifacts.require("Loot");
const LootDungeon = artifacts.require("LootDungeon");


module.exports = async function(deployer, network) {
  let proxyRegistryAddress;
  if (network === 'rinkeby') {
    proxyRegistryAddress = "0xf57b2c51ded3a29e6891aba85459d600256cf317";
  } else {
    proxyRegistryAddress = "0xa5409ec958c83c3f309868babaca7c86dcb077c1";
  }

  await Loot.deployed();
  await deployer.deploy(
    LootDungeon,
    "0x01BE23585060835E02B77ef475b0Cc51aA1e0709",
    "0xb3dCcb4Cf7a26f6cf6B120Cf5A73875B7BBc655B",
    "0x2ed0feb3e7fd2022120aa84fab1945545a9f2ffc9076fd6156fa96eaff4c1311",
    "100000000000000000",
    proxyRegistryAddress,
    Loot.address,
    network === 'test'
  )
};
