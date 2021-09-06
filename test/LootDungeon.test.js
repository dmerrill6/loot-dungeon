const LootDungeon = artifacts.require("LootDungeon");
const Loot = artifacts.require("Loot");

const chai = require("chai");
const expect = chai.expect;
const BN = require("bn.js");
const bnChai = require("bn-chai");
const { assert } = require("chai");
chai.use(bnChai(BN));

const ESCAPE_CARD = 1;
const FERRYMAN_CARD = 2;
const RAT_MEAT = 3;

contract("LootDungeon", (accounts) => {
  const tokenId = 2;
  const tokenIdAccount1 = 4370;
  let dungeon, loot;
  let initialMonsterAmount = 0;
  let mainAccount;

  const printStats = async (tokenId) => {
    const stats = await dungeon.getStats(tokenId);

    console.log(
      `${tokenId}: hp: ${stats.hp}, armor: ${stats.armor}, attack: ${stats.attack}, agi: ${stats.agility}, dex: ${stats.dexterity}`
    );
  };

  before(async () => {
    mainAccount = accounts[2];
    dungeon = await LootDungeon.deployed();
    loot = await Loot.deployed();

    await loot.claim(tokenId, { from: mainAccount });
    await loot.claim(tokenIdAccount1, { from: accounts[1] });
    initialMonsterAmount = await dungeon.getRemainingMonsterCount();

    for (let i = 1; i < 10; i++) {
      await printStats(i);
    }
    await printStats(4370);
  });

  describe("entering the dungeon", () => {
    it("should block entering the dungeon if user does not have loot", async () => {
      let err;
      try {
        await dungeon.enterTheDungeon(tokenId, { from: mainAccount });
      } catch (error) {
        err = error;
      }

      assert.equal(
        err.message,
        "Returned error: VM Exception while processing transaction: revert ERC721: transfer caller is not owner nor approved -- Reason given: ERC721: transfer caller is not owner nor approved."
      );
    });

    it("should block entering the dungeon if user has not approved the loot transfer", async () => {
      let err;
      try {
        await dungeon.enterTheDungeon(tokenId, { from: mainAccount });
      } catch (error) {
        err = error;
      }

      assert.equal(
        err.message,
        "Returned error: VM Exception while processing transaction: revert ERC721: transfer caller is not owner nor approved -- Reason given: ERC721: transfer caller is not owner nor approved."
      );
    });

    it("should permit transfer", async () => {
      await loot.setApprovalForAll(dungeon.address, true, {
        from: mainAccount,
      });
    });

    it("should allow entering the dungeon if the user approved the transfer", async () => {
      let hasEntered = await dungeon.hasEnteredTheDungeon.call(tokenId);
      assert.equal(hasEntered, false);

      let err;
      try {
        await dungeon.enterTheDungeon(tokenId, { from: mainAccount });
      } catch (error) {
        err = error;
      }

      assert.equal(err, null);
      hasEntered = await dungeon.hasEnteredTheDungeon.call(tokenId);
      assert.equal(hasEntered, true);
    });

    it("should transfer the ownership of the loot to the contract", async () => {
      const newOwner = await loot.ownerOf.call(tokenId);
      const contractTokenOwner = await dungeon.getLootOwner.call(tokenId);
      assert.equal(newOwner, dungeon.address);
      assert.equal(contractTokenOwner, mainAccount);
    });

    it("should encounter a monster", async () => {
      const monster = await dungeon.getEncounteredMonster.call(tokenId);
      assert.equal(monster.id, 1);
    });

    it("should reduce the amount of available monsters", async () => {
      const amount = await dungeon.getRemainingMonsterCount();
      console.log("amount", amount.toString());
      assert.equal(amount.toString(), String(initialMonsterAmount - 1));
    });

    it("should timelock the loot", async () => {
      const unlockTime = await dungeon.lootTimeLock.call(tokenId);
      const lastBlock = await web3.eth.getBlock("latest");

      console.log("unlockTime", unlockTime);
      const timestamp = new web3.utils.BN(lastBlock.timestamp).div("1000");
      const unlockTimeBN = new web3.utils.BN(unlockTime).div("1000");

      expect(unlockTimeBN).to.be.above(timestamp);
      expect(unlockTimeBN)
        .to.be.below(timestamp)
        .plus(String(48 * 60 * 60));
    });

    it("should not allow reentering the dungeon", async () => {
      let err;
      try {
        await dungeon.enterTheDungeon(tokenId, { from: mainAccount });
      } catch (error) {
        err = error;
      }

      assert.equal(
        err.message,
        "Returned error: VM Exception while processing transaction: revert You are already in the dungeon -- Reason given: You are already in the dungeon."
      );
    });
  });

  describe("escaping", () => {
    it("should not allow escaping using a non-owned token", async () => {
      let err;
      try {
        await dungeon.escapeFromDungeon(tokenIdAccount1, { from: mainAccount });
      } catch (error) {
        err = error;
      }

      assert.equal(
        err.message,
        "Returned error: VM Exception while processing transaction: revert You do not have permissions to use this loot bag -- Reason given: You do not have permissions to use this loot bag."
      );
    });

    it("should not allow claiming the escape NFT before escaping", async () => {
      let err;
      try {
        await dungeon.claimEscapeCard({ from: mainAccount });
      } catch (error) {
        err = error;
      }

      assert.equal(
        err.message,
        "Returned error: VM Exception while processing transaction: revert Escape NFT not ready to be claimed -- Reason given: Escape NFT not ready to be claimed."
      );
    });

    it("should not allow escaping without paying the fee", async () => {
      let err;
      try {
        await dungeon.escapeFromDungeon(tokenId, { from: mainAccount });
      } catch (error) {
        err = error;
      }

      assert.equal(
        err.message,
        "Returned error: VM Exception while processing transaction: revert The amount of eth paid is not enough to escape from this battle -- Reason given: The amount of eth paid is not enough to escape from this battle."
      );
    });

    it("should allow escaping when paying the fee", async () => {
      let hasEntered = await dungeon.hasEnteredTheDungeon.call(tokenId);
      expect(hasEntered).to.equal(true);
      let err;
      try {
        await dungeon.escapeFromDungeon(tokenId, {
          from: mainAccount,
          value: web3.utils.toWei("0.04", "ether"),
        });
      } catch (error) {
        err = error;
      }

      assert.equal(err, null);
      hasEntered = await dungeon.hasEnteredTheDungeon.call(tokenId);
      expect(hasEntered).to.equal(false);
    });

    it("should return the loot to the original user", async () => {
      const newOwner = await loot.ownerOf.call(tokenId);
      const contractTokenOwner = await dungeon.getLootOwner.call(tokenId);
      assert.equal(newOwner, mainAccount);
      assert.equal(
        contractTokenOwner,
        "0x0000000000000000000000000000000000000000"
      );
    });

    it("should inc the amount of available monsters", async () => {
      const amount = await dungeon.getRemainingMonsterCount.call();
      assert.equal(amount.toString(), initialMonsterAmount.toString());
    });

    it("should allow claiming the escape NFT after escaping", async () => {
      let err;
      try {
        await dungeon.claimEscapeCard({ from: mainAccount });
      } catch (error) {
        err = error;
      }

      assert.equal(err, null);
      const balance = await dungeon.balanceOf.call(mainAccount, ESCAPE_CARD);
      assert.equal(balance, 1);
    });

    it("should not allow claiming the escape NFT twice", async () => {
      let err;
      try {
        await dungeon.claimEscapeCard({ from: mainAccount });
      } catch (error) {
        err = error;
      }

      assert.equal(
        err.message,
        "Returned error: VM Exception while processing transaction: revert Escape NFT not ready to be claimed -- Reason given: Escape NFT not ready to be claimed."
      );
      const balance = await dungeon.balanceOf.call(mainAccount, ESCAPE_CARD);
      assert.equal(balance, 1);
    });

    it("should not allow battling after escaping", async () => {
      let err;
      try {
        await dungeon.battleMonster(tokenId, {
          from: mainAccount,
          value: web3.utils.toWei("0.02", "ether"),
        });
      } catch (error) {
        err = error;
      }

      assert.equal(
        err.message,
        "Returned error: VM Exception while processing transaction: revert You do not have permissions to use this loot bag -- Reason given: You do not have permissions to use this loot bag."
      );
    });
  });

  describe("Entering a second time", () => {
    it("should allow entering the dungeon after escaping", async () => {
      let hasEntered = await dungeon.hasEnteredTheDungeon.call(tokenId);
      assert.equal(hasEntered, false);

      let err;
      try {
        await dungeon.enterTheDungeon(tokenId, { from: mainAccount });
      } catch (error) {
        err = error;
      }

      assert.equal(err, null);
      hasEntered = await dungeon.hasEnteredTheDungeon.call(tokenId);
      assert.equal(hasEntered, true);
    });
  });

  describe("when calculating stats", () => {
    it.skip("calculates the stats correctly", async () => {
      const mostOpLoot = 2465;
      const stats = await dungeon.getStats(mostOpLoot);
      await printStats(mostOpLoot);
      expect(parseInt(stats.hp, 10)).to.be.above(30);
      expect(parseInt(stats.armor, 10)).to.be.above(4);
      expect(parseInt(stats.attack, 10)).to.be.above(10);
      expect(parseInt(stats.agility, 10)).to.be.above(5);
      expect(parseInt(stats.dexterity, 10)).to.be.above(2);
    });

    it.skip("calculates the stats for a mediocre loot", async () => {
      const mediocreLoot = 3791;
      const stats = await dungeon.getStats(mediocreLoot);
      await printStats(mediocreLoot);
      expect(parseInt(stats.hp, 10)).to.be.below(26);
      expect(parseInt(stats.armor, 10)).to.be.below(2);
      expect(parseInt(stats.attack, 10)).to.be.below(5);
      expect(parseInt(stats.agility, 10)).to.be.below(4);
      expect(parseInt(stats.dexterity, 10)).to.be.below(5);
    });
  });

  describe("when battling", () => {
    it("should allow removing the link fees", async () => {
      let err;
      try {
        await dungeon.setLinkFee(0);
      } catch (error) {
        err = error;
      }

      assert.equal(err, null);
    });

    it("should not allow battling if not paying the fee", async () => {
      let err;
      try {
        await dungeon.battleMonster(tokenId, {
          from: mainAccount,
          value: web3.utils.toWei("0.01", "ether"),
        });
      } catch (error) {
        err = error;
      }

      assert.equal(
        err.message,
        "Returned error: VM Exception while processing transaction: revert The amount of eth paid is not enough to fight this battle -- Reason given: The amount of eth paid is not enough to fight this battle."
      );
    });

    it("should allow battling if paying the fee", async () => {
      let err;
      let hasBattleStarted = await dungeon.hasStartedBattle.call(tokenId);
      expect(hasBattleStarted).to.equal(false);
      try {
        await dungeon.battleMonster(tokenId, {
          from: mainAccount,
          value: web3.utils.toWei("0.02", "ether"),
        });
      } catch (error) {
        err = error;
      }

      assert.equal(err, null);
      hasBattleStarted = await dungeon.hasStartedBattle.call(tokenId);
      expect(hasBattleStarted).to.equal(true);
    });

    it("should be able to get the results of each round", async () => {
      let hasNextRound = true;
      let round = 0;
      const stats = await dungeon.getStats(tokenId);
      const monsterStats = await dungeon.getEncounteredMonster(tokenId);
      let hp = parseInt(stats.hp, 10);
      let monsterHp = parseInt(monsterStats.hp, 10);
      let won = null;

      while (hasNextRound) {
        const roundRes = await dungeon.checkBattleResultsNoCache(
          tokenId,
          round,
          hp,
          monsterHp
        );
        console.log(`Round ${round}: ${roundRes}`);
        hp = parseInt(roundRes.playerHp);
        monsterHp = parseInt(roundRes.monsterHp);
        hasNextRound = roundRes.hasNextRound;
        won = roundRes.won;
        round++;
      }

      expect(won).to.equal(true);
    });

    it("should be able to claim rewards if won", async () => {
      const currOwner = await dungeon.lootOwners.call(tokenId);
      console.log("currOwner", currOwner, mainAccount);
      let err;
      try {
        await dungeon.claimDrops(tokenId, { from: mainAccount });
      } catch (error) {
        err = error;
      }

      assert.equal(err, null);
      const newLootOwner = await loot.ownerOf.call(tokenId);
      expect(newLootOwner).to.equal(mainAccount);
      const contractTokenOwner = await dungeon.getLootOwner.call(tokenId);
      assert.equal(
        contractTokenOwner,
        "0x0000000000000000000000000000000000000000"
      );

      const balance = await dungeon.balanceOf.call(mainAccount, RAT_MEAT);
      assert.equal(balance, 1);
    });

    it("should exit the dungeon", async () => {
      let hasEntered = await dungeon.hasEnteredTheDungeon.call(tokenId);

      assert.equal(hasEntered, false);
    });

    it("should not inc the amount of available monsters", async () => {
      const amount = await dungeon.getRemainingMonsterCount();
      assert.equal(amount, initialMonsterAmount - 1);
    });

    it("should allow entering the dungeon after battling", async () => {
      let hasEntered = await dungeon.hasEnteredTheDungeon.call(tokenId);
      assert.equal(hasEntered, false);

      let err;
      try {
        await dungeon.enterTheDungeon(tokenId, { from: mainAccount });
      } catch (error) {
        err = error;
      }

      assert.equal(err, null);
      hasEntered = await dungeon.hasEnteredTheDungeon.call(tokenId);
      assert.equal(hasEntered, true);
    });
  });

  describe("when dying", () => {
    let newTokenId = 201;
    it("should allow entering the dungeon after battling with a different token", async () => {
      await loot.claim(newTokenId, { from: mainAccount });
      let hasEntered = await dungeon.hasEnteredTheDungeon.call(newTokenId);
      assert.equal(hasEntered, false);

      let err;
      try {
        await dungeon.enterTheDungeon(newTokenId, { from: mainAccount });
      } catch (error) {
        err = error;
      }

      assert.equal(err, null);
      hasEntered = await dungeon.hasEnteredTheDungeon.call(newTokenId);
      assert.equal(hasEntered, true);

      const monster = await dungeon.getEncounteredMonster.call(newTokenId);
      assert.equal(monster.id, 3);
    });

    it("should not allow claiming the ferryman card before dying", async () => {
      let err;
      try {
        await dungeon.claimFerrymanCard({ from: mainAccount });
      } catch (error) {
        err = error;
      }

      assert.equal(
        err.message,
        "Returned error: VM Exception while processing transaction: revert Ferryman Card not ready to be claimed -- Reason given: Ferryman Card not ready to be claimed."
      );
    });

    it("should allow battling if paying the fee", async () => {
      let err;
      let hasBattleStarted = await dungeon.hasStartedBattle.call(newTokenId);
      expect(hasBattleStarted).to.equal(false);
      try {
        await dungeon.battleMonster(newTokenId, {
          from: mainAccount,
          value: web3.utils.toWei("0.02", "ether"),
        });
      } catch (error) {
        err = error;
      }

      assert.equal(err, null);
      hasBattleStarted = await dungeon.hasStartedBattle.call(newTokenId);
      expect(hasBattleStarted).to.equal(true);
    });

    it("should die in battle", async () => {
      let hasNextRound = true;
      let round = 0;
      const stats = await dungeon.getStats(newTokenId);
      const monsterStats = await dungeon.getEncounteredMonster(newTokenId);
      let hp = parseInt(stats.hp, 10);
      let monsterHp = parseInt(monsterStats.hp, 10);
      let won = null;
      console.log(stats);
      console.log(`Round ${-1}: ${hp}, ${monsterHp}`);

      while (hasNextRound) {
        const roundRes = await dungeon.checkBattleResultsNoCache(
          newTokenId,
          round,
          hp,
          monsterHp
        );
        console.log(`Round ${round}: ${roundRes}`);
        hp = parseInt(roundRes.playerHp);
        monsterHp = parseInt(roundRes.monsterHp);
        hasNextRound = roundRes.hasNextRound;
        won = roundRes.won;
        round++;
      }

      expect(won).to.equal(false);
    });

    it("should not be able to claim the rewards", async () => {
      let err;
      try {
        await dungeon.claimDrops(newTokenId, { from: mainAccount });
      } catch (error) {
        err = error;
      }

      assert.equal(
        err.message,
        "Returned error: VM Exception while processing transaction: revert You cannot claim rewards if you did not win the battle -- Reason given: You cannot claim rewards if you did not win the battle."
      );
    });

    it("should not allow battling if dead", async () => {
      let err;
      try {
        await dungeon.battleMonster(newTokenId, {
          from: mainAccount,
          value: web3.utils.toWei("0.02", "ether"),
        });
      } catch (error) {
        err = error;
      }

      assert.equal(
        err.message,
        "Returned error: VM Exception while processing transaction: revert The battle already started -- Reason given: The battle already started."
      );
      hasBattleStarted = await dungeon.hasStartedBattle.call(newTokenId);
      expect(hasBattleStarted).to.equal(true);
    });

    it("should not allow reentering the dungeon", async () => {
      let err;
      try {
        await dungeon.enterTheDungeon(newTokenId, { from: mainAccount });
      } catch (error) {
        err = error;
      }

      assert.equal(
        err.message,
        "Returned error: VM Exception while processing transaction: revert You are already in the dungeon -- Reason given: You are already in the dungeon."
      );
    });

    it("should not allow reviving if not paying", async () => {
      let err;
      try {
        await dungeon.bribeFerryman(newTokenId, { from: mainAccount });
      } catch (error) {
        err = error;
      }

      assert.equal(
        err.message,
        "Returned error: VM Exception while processing transaction: revert The amount of eth paid is not enough to bribe the ferryman -- Reason given: The amount of eth paid is not enough to bribe the ferryman."
      );
    });

    it("should allow reviving", async () => {
      let err;
      try {
        await dungeon.bribeFerryman(newTokenId, {
          from: mainAccount,
          value: web3.utils.toWei("5", "ether"),
        });
      } catch (error) {
        err = error;
      }

      assert.equal(err, null);
      let hasEntered = await dungeon.hasEnteredTheDungeon.call(newTokenId);
      assert.equal(hasEntered, false);
    });

    it("should allow claiming the ferryman card", async () => {
      let err;
      try {
        await dungeon.claimFerrymanCard({ from: mainAccount });
      } catch (error) {
        err = error;
      }

      assert.equal(err, null);
      const balance = await dungeon.balanceOf.call(mainAccount, FERRYMAN_CARD);
      assert.equal(balance, 1);
    });

    it("should not allow claiming the ferryman card twice", async () => {
      let err;
      try {
        await dungeon.claimFerrymanCard({ from: mainAccount });
      } catch (error) {
        err = error;
      }

      assert.equal(
        err.message,
        "Returned error: VM Exception while processing transaction: revert Ferryman Card not ready to be claimed -- Reason given: Ferryman Card not ready to be claimed."
      );
    });

    it("should allow entering the dungeon after reviving", async () => {
      let hasEntered = await dungeon.hasEnteredTheDungeon.call(newTokenId);
      assert.equal(hasEntered, false);

      let err;
      try {
        await dungeon.enterTheDungeon(newTokenId, { from: mainAccount });
      } catch (error) {
        err = error;
      }

      assert.equal(err, null);
      hasEntered = await dungeon.hasEnteredTheDungeon.call(newTokenId);
      assert.equal(hasEntered, true);
    });
  });

  describe("misc", () => {
    it("the domain is correct", async () => {
      let uri = await dungeon.uri.call(0);
      assert.equal(uri, "https://lootdungeon.app/api/item/{id}");
    });

    it("only owner", async () => {
      let err;
      try {
        await dungeon.setFerrymanPrice(0, { from: accounts[1] });
      } catch (error) {
        err = error;
      }

      assert.equal(
        err.message,
        "Returned error: VM Exception while processing transaction: revert Ownable: caller is not the owner -- Reason given: Ownable: caller is not the owner."
      );
    });
  });
});
