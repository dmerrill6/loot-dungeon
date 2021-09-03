const Loot = artifacts.require("Loot");
const LootDungeon = artifacts.require("LootDungeon");


module.exports = async function(deployer, network) {
  await deployer.deploy(Loot, {gas: 67000000});
};
