const Loot = artifacts.require("Loot");
const LootDungeon = artifacts.require("LootDungeon");
const LootStats = artifacts.require("LootStats");


module.exports = async function(deployer, network) {
  let proxyRegistryAddress;
  if (network === 'rinkeby') {
    proxyRegistryAddress = "0xf57b2c51ded3a29e6891aba85459d600256cf317";
  } else {
    proxyRegistryAddress = "0xa5409ec958c83c3f309868babaca7c86dcb077c1";
  }

  let chainlinkFee, vrfCoord, link, keyhash;
  if (network === 'mainnet') {
    chainlinkFee = "2000000000000000000"
    vrfCoord = "0xf0d54349aDdcf704F77AE15b96510dEA15cb7952"
    link = "0x514910771AF9Ca656af840dff83E8264EcF986CA"
    keyhash = "0xAA77729D3466CA35AE8D28B3BBAC7CC36A5031EFDC430821C02BC31A238AF445"
  } else {
    chainlinkFee = "100000000000000000"
    vrfCoord = "0xb3dCcb4Cf7a26f6cf6B120Cf5A73875B7BBc655B"
    link = "0x01BE23585060835E02B77ef475b0Cc51aA1e0709"
    keyhash = "0x2ed0feb3e7fd2022120aa84fab1945545a9f2ffc9076fd6156fa96eaff4c1311"
  }

  await Loot.deployed();
  await LootStats.deployed();
  await deployer.deploy(
    LootDungeon,
    vrfCoordinator,
    link,
    keyhash,
    chainlinkFee,
    proxyRegistryAddress,
    Loot.address,
    LootStats.address,
    network === 'test'
  )
};
