const LootDungeon = artifacts.require("LootDungeon");
const Loot = artifacts.require("Loot");


const chai = require('chai');
const expect = chai.expect;
const BN = require('bn.js');
const bnChai = require('bn-chai');
chai.use(bnChai(BN));

const ESCAPE_CARD = 1;

contract("LootDungeon", accounts => {
  const tokenId = 2;
  const tokenIdAccount1 = 1;
  let dungeon, loot;

  
  before(async () => {
    dungeon = await LootDungeon.deployed();
    loot = await Loot.deployed()

    await loot.claim(tokenId, {from: accounts[0]})
    await loot.claim(tokenIdAccount1, {from: accounts[1]})
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
      assert.notStrictEqual(monster.id, 0);
    })

    it("should timelock the loot", async () => {
      const unlockTime = await dungeon.lootTimeLock.call(tokenId);
      const lastBlock = await web3.eth.getBlock("latest");

      console.log('unlockTime', unlockTime)
      const timestamp = new web3.utils.BN(lastBlock.timestamp).div(1000);
      const unlockTimeBN = new web3.utils.BN(unlockTime).div(1000)

      expect(unlockTimeBN).to.be.above(timestamp);
      expect(unlockTimeBN).to.be.below(timestamp).plus(48 * 60 * 60);
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
      let err
      try {
        await dungeon.escapeFromDungeon(tokenId, { from: accounts[0], value: web3.utils.toWei("0.04", "ether") });
      } catch (error) {
        err = error;
      }

      assert.equal(err, null);
    });

    it("should return the loot to the original user", async () => {
      const newOwner = await loot.ownerOf.call(tokenId);
      const contractTokenOwner = await dungeon.getLootOwner.call(tokenId)
      assert.equal(newOwner, accounts[0])
      assert.equal(contractTokenOwner, "0x0000000000000000000000000000000000000000")
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
  })
  
});
