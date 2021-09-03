const LootDungeon = artifacts.require("LootDungeon");
const Loot = artifacts.require("Loot");


const chai = require('chai');
const expect = chai.expect;
const BN = require('bn.js');
const bnChai = require('bn-chai');
const { assert } = require('chai');
chai.use(bnChai(BN));

const ESCAPE_CARD = 1;
const FERRYMAN_CARD = 2;
const RAT_MEAT = 3;

contract("LootDungeon", accounts => {
  const tokenId = 2;
  const tokenIdAccount1 = 1;
  let dungeon, loot;
  let initialMonsterAmount = 0;

  
  before(async () => {
    dungeon = await LootDungeon.deployed();
    loot = await Loot.deployed()

    await loot.claim(tokenId, {from: accounts[0]})
    await loot.claim(tokenIdAccount1, {from: accounts[1]})
    initialMonsterAmount = await dungeon.getRemainingMonsterCount()
  })

  describe('entering the dungeon', () => {
    it("should block entering the dungeon if user does not have loot", async () => {
      let err
      try {
        await dungeon.enterTheDungeon(tokenId, { from: accounts[0] });
      } catch (error) {
        err = error;
      }

      assert.equal(err.message, "Returned error: VM Exception while processing transaction: revert ERC721: transfer caller is not owner nor approved -- Reason given: ERC721: transfer caller is not owner nor approved.")
    });

    it("should block entering the dungeon if user has not approved the loot transfer", async () => {  
      let err
      try {
        await dungeon.enterTheDungeon(tokenId, { from: accounts[0] });
      } catch (error) {
        err = error;
      }

      assert.equal(err.message, "Returned error: VM Exception while processing transaction: revert ERC721: transfer caller is not owner nor approved -- Reason given: ERC721: transfer caller is not owner nor approved.")
    });
    
    it("should permit transfer", async () => {
      await loot.setApprovalForAll(dungeon.address, true, {from: accounts[0]})
    })

    it("should allow entering the dungeon if the user approved the transfer", async () => {
      let hasEntered = await dungeon.hasEnteredTheDungeon.call(tokenId);
      assert.equal(hasEntered, false);
  
      let err
      try {
        await dungeon.enterTheDungeon(tokenId, { from: accounts[0] });
      } catch (error) {
        err = error;
      }

      assert.equal(err, null);
      hasEntered = await dungeon.hasEnteredTheDungeon.call(tokenId);
      assert.equal(hasEntered, true);
    });

    it("should transfer the ownership of the loot to the contract", async () => {
      const newOwner = await loot.ownerOf.call(tokenId);
      const contractTokenOwner = await dungeon.getLootOwner.call(tokenId)
      assert.equal(newOwner, dungeon.address)
      assert.equal(contractTokenOwner, accounts[0])
    })

    it("should encounter a monster", async () => {
      const monster = await dungeon.getEncounteredMonster.call(tokenId);
      assert.equal(monster.id, 1);
    })

    it('should mint a loot token wrapper', async () => {
      const id = await dungeon.lootIdToWrappedLootId(tokenId)
      let balance = await dungeon.balanceOf(accounts[0], id);

      assert.equal(balance, 1);
    })

    it("should reduce the amount of available monsters", async () => {
      const amount = await dungeon.getRemainingMonsterCount()
      console.log('amount', amount.toString())
      assert.equal(amount.toString(), String(initialMonsterAmount - 1))
    })

    it("should timelock the loot", async () => {
      const unlockTime = await dungeon.lootTimeLock.call(tokenId);
      const lastBlock = await web3.eth.getBlock("latest");

      console.log('unlockTime', unlockTime)
      const timestamp = new web3.utils.BN(lastBlock.timestamp).div("1000");
      const unlockTimeBN = new web3.utils.BN(unlockTime).div("1000")

      expect(unlockTimeBN).to.be.above(timestamp);
      expect(unlockTimeBN).to.be.below(timestamp).plus(String(48 * 60 * 60));
    })

    it("should not allow reentering the dungeon", async () => {  
      let err
      try {
        await dungeon.enterTheDungeon(tokenId, { from: accounts[0] });
      } catch (error) {
        err = error;
      }

      assert.equal(err.message, "Returned error: VM Exception while processing transaction: revert You are already in the dungeon -- Reason given: You are already in the dungeon.");
    });
  });

  describe('escaping', () => {
    it("should not allow escaping using a non-owned token", async () => {  
      let err
      try {
        await dungeon.escapeFromDungeon(tokenIdAccount1, { from: accounts[0] });
      } catch (error) {
        err = error;
      }

      assert.equal(err.message, "Returned error: VM Exception while processing transaction: revert You do not have permissions to use this loot bag -- Reason given: You do not have permissions to use this loot bag.");
    });

    it("should not allow claiming the escape NFT before escaping", async () => {  
      let err
      try {
        await dungeon.claimEscapeCard({ from: accounts[0] });
      } catch (error) {
        err = error;
      }

      assert.equal(err.message, "Returned error: VM Exception while processing transaction: revert Escape NFT not ready to be claimed -- Reason given: Escape NFT not ready to be claimed.");
    });

    it("should not allow escaping without paying the fee", async () => {  
      let err
      try {
        await dungeon.escapeFromDungeon(tokenId, { from: accounts[0] });
      } catch (error) {
        err = error;
      }

      assert.equal(err.message, "Returned error: VM Exception while processing transaction: revert The amount of eth paid is not enough to escape from this battle -- Reason given: The amount of eth paid is not enough to escape from this battle.");
    });

    it("should allow escaping when paying the fee", async () => {  
      let hasEntered = await dungeon.hasEnteredTheDungeon.call(tokenId);
      expect(hasEntered).to.equal(true);
      let err
      try {
        await dungeon.escapeFromDungeon(tokenId, { from: accounts[0], value: web3.utils.toWei("0.04", "ether") });
      } catch (error) {
        err = error;
      }

      assert.equal(err, null);
      hasEntered = await dungeon.hasEnteredTheDungeon.call(tokenId);
      expect(hasEntered).to.equal(false);
    });

    it("should return the loot to the original user", async () => {
      const newOwner = await loot.ownerOf.call(tokenId);
      const contractTokenOwner = await dungeon.getLootOwner.call(tokenId)
      assert.equal(newOwner, accounts[0])
      assert.equal(contractTokenOwner, "0x0000000000000000000000000000000000000000")
    })

    it('should burn the loot token wrapper', async () => {
      const id = await dungeon.lootIdToWrappedLootId(tokenId)
      let balance = await dungeon.balanceOf(accounts[0], id);

      assert.equal(balance, 0);
    })

    it("should inc the amount of available monsters", async () => {
      const amount = await dungeon.getRemainingMonsterCount()
      assert.equal(amount.toString(), initialMonsterAmount.toString())
    })

    it("should allow claiming the escape NFT after escaping", async () => {  
      let err
      try {
        await dungeon.claimEscapeCard({ from: accounts[0] });
      } catch (error) {
        err = error;
      }

      assert.equal(err, null);
      const balance = await dungeon.balanceOf.call(accounts[0], ESCAPE_CARD);
      assert.equal(balance, 1);
    });

    it("should not allow claiming the escape NFT twice", async () => {  
      let err
      try {
        await dungeon.claimEscapeCard({ from: accounts[0] });
      } catch (error) {
        err = error;
      }

      assert.equal(err.message, "Returned error: VM Exception while processing transaction: revert Escape NFT not ready to be claimed -- Reason given: Escape NFT not ready to be claimed.");
      const balance = await dungeon.balanceOf.call(accounts[0], ESCAPE_CARD);
      assert.equal(balance, 1);
    });

    it("should not allow battling after escaping", async () => {  
      let err
      try {
        await dungeon.battleMonster(tokenId, { from: accounts[0], value: web3.utils.toWei("0.02", "ether") });
      } catch (error) {
        err = error;
      }

      assert.equal(err.message, "Returned error: VM Exception while processing transaction: revert You do not have permissions to use this loot bag -- Reason given: You do not have permissions to use this loot bag.");
    });
  })

  describe('Entering a second time', () => {
    it("should allow entering the dungeon after escaping", async () => {
      let hasEntered = await dungeon.hasEnteredTheDungeon.call(tokenId);
      assert.equal(hasEntered, false);
  
      let err
      try {
        await dungeon.enterTheDungeon(tokenId, { from: accounts[0] });
      } catch (error) {
        err = error;
      }

      assert.equal(err, null);
      hasEntered = await dungeon.hasEnteredTheDungeon.call(tokenId);
      assert.equal(hasEntered, true);
    });
  });

  describe('when calculating stats', () => {
    it('calculates the stats correctly', async () => {
      const mostOpLoot = 3043;
      const stats = await dungeon.getStats(mostOpLoot);
      console.log(stats);
      expect(parseInt(stats.hp, 10)).to.be.above(30);
      expect(parseInt(stats.armor, 10)).to.be.above(3);
      expect(parseInt(stats.attack, 10)).to.be.above(12);
      expect(parseInt(stats.agility, 10)).to.be.above(12);
      expect(parseInt(stats.dexterity, 10)).to.be.above(5);
    })

    it('calculates the stats for a mediocre loot', async () => {
      const mediocreLoot = 3455;
      const stats = await dungeon.getStats(mediocreLoot);
      console.log(stats);
      expect(parseInt(stats.hp, 10)).to.be.below(25);
      expect(parseInt(stats.armor, 10)).to.be.below(2);
      expect(parseInt(stats.attack, 10)).to.be.below(5);
      expect(parseInt(stats.agility, 10)).to.be.below(4);
      expect(parseInt(stats.dexterity, 10)).to.be.below(5);
    })
  })

  describe('when battling', () => {
    it("should allow removing the link fees", async () => {
      let err
      try {
        await dungeon.setLinkFee(0)
      } catch (error) {
        err = error;
      }

      assert.equal(err, null);
    })

    it("should not allow battling if not paying the fee", async () => {  
      let err
      try {
        await dungeon.battleMonster(tokenId, { from: accounts[0], value: web3.utils.toWei("0.01", "ether") });
      } catch (error) {
        err = error;
      }

      assert.equal(err.message, "Returned error: VM Exception while processing transaction: revert The amount of eth paid is not enough to fight this battle -- Reason given: The amount of eth paid is not enough to fight this battle.");
    });

    it("should allow battling if paying the fee", async () => {  
      let err
      let hasBattleStarted = await dungeon.hasStartedBattle.call(tokenId);
      expect(hasBattleStarted).to.equal(false);
      try {
        await dungeon.battleMonster(tokenId, { from: accounts[0], value: web3.utils.toWei("0.02", "ether") });
      } catch (error) {
        err = error;
      }

      assert.equal(err, null)
      hasBattleStarted = await dungeon.hasStartedBattle.call(tokenId);
      expect(hasBattleStarted).to.equal(true);
    });

    it('should be able to get the results of each round', async () => {
      let hasNextRound = true;
      let round = 0;
      const stats = await dungeon.getStats(tokenId);
      const monsterStats = await dungeon.getEncounteredMonster(tokenId);
      let hp = parseInt(stats.hp, 10);
      let monsterHp = parseInt(monsterStats.hp, 10);
      let won = null;

      while(hasNextRound) {
        const roundRes = await dungeon.checkBattleResultsNoCache(tokenId, round, hp, monsterHp);
        console.log(`Round ${round}: ${roundRes}`);
        hp = parseInt(roundRes.playerHp);
        monsterHp = parseInt(roundRes.monsterHp);
        hasNextRound = roundRes.hasNextRound;
        won = roundRes.won;
        round++;
      }

      expect(won).to.equal(true);
    })

    it('should be able to claim rewards if won', async () => {
      let err
      try {
        await dungeon.claimDrops(tokenId)
      } catch (error) {
        err = error;
      }

      assert.equal(err, null);
      const newLootOwner = await loot.ownerOf.call(tokenId)
      expect(newLootOwner).to.equal(accounts[0]);
      const contractTokenOwner = await dungeon.getLootOwner.call(tokenId)
      assert.equal(contractTokenOwner, "0x0000000000000000000000000000000000000000")
      
      const balance = await dungeon.balanceOf.call(accounts[0], RAT_MEAT);
      assert.equal(balance, 1);
    })

    it('should exit the dungeon', async () => {
      let hasEntered = await dungeon.hasEnteredTheDungeon.call(tokenId);

      assert.equal(hasEntered, false);
    })

    it('should burn the loot token wrapper', async () => {
      const id = await dungeon.lootIdToWrappedLootId(tokenId)
      let balance = await dungeon.balanceOf(accounts[0], id);

      assert.equal(balance, 0);
    })

    it("should not inc the amount of available monsters", async () => {
      const amount = await dungeon.getRemainingMonsterCount()
      assert.equal(amount, initialMonsterAmount - 1)
    })

    it("should allow entering the dungeon after battling", async () => {
      let hasEntered = await dungeon.hasEnteredTheDungeon.call(tokenId);
      assert.equal(hasEntered, false);
  
      let err
      try {
        await dungeon.enterTheDungeon(tokenId, { from: accounts[0] });
      } catch (error) {
        err = error;
      }

      assert.equal(err, null);
      hasEntered = await dungeon.hasEnteredTheDungeon.call(tokenId);
      assert.equal(hasEntered, true);
    });
  });  

  describe('when dying', () => {
    let newTokenId = 201;
    it("should allow entering the dungeon after battling with a different token", async () => {
      await loot.claim(newTokenId, {from: accounts[0]})
      let hasEntered = await dungeon.hasEnteredTheDungeon.call(newTokenId);
      assert.equal(hasEntered, false);
  
      let err
      try {
        await dungeon.enterTheDungeon(newTokenId, { from: accounts[0] });
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
      let err
      try {
        await dungeon.claimFerrymanCard({ from: accounts[0] });
      } catch (error) {
        err = error;
      }

      assert.equal(err.message, "Returned error: VM Exception while processing transaction: revert Ferryman Card not ready to be claimed -- Reason given: Ferryman Card not ready to be claimed.");
    });

    it("should allow battling if paying the fee", async () => {  
      let err
      let hasBattleStarted = await dungeon.hasStartedBattle.call(newTokenId);
      expect(hasBattleStarted).to.equal(false);
      try {
        await dungeon.battleMonster(newTokenId, { from: accounts[0], value: web3.utils.toWei("0.02", "ether") });
      } catch (error) {
        err = error;
      }

      assert.equal(err, null)
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

      while(hasNextRound) {
        const roundRes = await dungeon.checkBattleResultsNoCache(newTokenId, round, hp, monsterHp);
        console.log(`Round ${round}: ${roundRes}`);
        hp = parseInt(roundRes.playerHp);
        monsterHp = parseInt(roundRes.monsterHp);
        hasNextRound = roundRes.hasNextRound;
        won = roundRes.won;
        round++;
      }

      expect(won).to.equal(false);
    });

    it('should not be able to claim the rewards', async () => {
      let err
      try {
        await dungeon.claimDrops(newTokenId)
      } catch (error) {
        err = error;
      }

      assert.equal(err.message, "Returned error: VM Exception while processing transaction: revert You cannot claim rewards if you did not win the battle -- Reason given: You cannot claim rewards if you did not win the battle.");
    })

    it("should not allow battling if dead", async () => {  
      let err
      try {
        await dungeon.battleMonster(newTokenId, { from: accounts[0], value: web3.utils.toWei("0.02", "ether") });
      } catch (error) {
        err = error;
      }

      assert.equal(err.message, "Returned error: VM Exception while processing transaction: revert The battle already started -- Reason given: The battle already started.")
      hasBattleStarted = await dungeon.hasStartedBattle.call(newTokenId);
      expect(hasBattleStarted).to.equal(true);
    });

    it("should not allow reentering the dungeon", async () => {  
      let err
      try {
        await dungeon.enterTheDungeon(newTokenId, { from: accounts[0] });
      } catch (error) {
        err = error;
      }

      assert.equal(err.message, "Returned error: VM Exception while processing transaction: revert You are already in the dungeon -- Reason given: You are already in the dungeon.");
    });

    it("should not allow reviving if not paying", async () => {  
      let err
      try {
        await dungeon.bribeFerryman(newTokenId);
      } catch (error) {
        err = error;
      }

      assert.equal(err.message, "Returned error: VM Exception while processing transaction: revert The amount of eth paid is not enough to bribe the ferryman -- Reason given: The amount of eth paid is not enough to bribe the ferryman.");
    });

    it("should allow reviving", async () => {  
      let err
      try {
        await dungeon.bribeFerryman(newTokenId, { from: accounts[0], value: web3.utils.toWei("5", "ether") });
      } catch (error) {
        err = error;
      }

      assert.equal(err, null);
      let hasEntered = await dungeon.hasEnteredTheDungeon.call(newTokenId);
      assert.equal(hasEntered, false);
    });

    it("should allow claiming the ferryman card", async () => {  
      let err
      try {
        await dungeon.claimFerrymanCard({ from: accounts[0] });
      } catch (error) {
        err = error;
      }

      assert.equal(err, null);
      const balance = await dungeon.balanceOf.call(accounts[0], FERRYMAN_CARD);
      assert.equal(balance, 1);
    });

    it("should not allow claiming the ferryman card twice", async () => {  
      let err
      try {
        await dungeon.claimFerrymanCard({ from: accounts[0] });
      } catch (error) {
        err = error;
      }

      assert.equal(err.message, "Returned error: VM Exception while processing transaction: revert Ferryman Card not ready to be claimed -- Reason given: Ferryman Card not ready to be claimed.");
    });

    it("should allow entering the dungeon after reviving", async () => {
      let hasEntered = await dungeon.hasEnteredTheDungeon.call(newTokenId);
      assert.equal(hasEntered, false);
  
      let err
      try {
        await dungeon.enterTheDungeon(newTokenId, { from: accounts[0] });
      } catch (error) {
        err = error;
      }

      assert.equal(err, null);
      hasEntered = await dungeon.hasEnteredTheDungeon.call(newTokenId);
      assert.equal(hasEntered, true);
    });
  })
});
