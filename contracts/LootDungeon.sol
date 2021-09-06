// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";

contract OwnableDelegateProxy {}

contract ProxyRegistry {
    mapping(address => OwnableDelegateProxy) public proxies;
}

contract LootDungeon is ERC1155, VRFConsumerBase, Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    /**
     * LOOT
     */
    uint256 public constant GENESIS_CARD = 0;
    uint256 public constant ESCAPE_CARD = 1;
    uint256 public constant FERRYMAN_CARD = 2;
    uint256 public constant RAT_MEAT = 3;
    uint256 public constant RAT_CARD = 4;
    uint256 public constant SKELETON_BONES = 5;
    uint256 public constant SKELETON_CARD = 6;
    uint256 public constant MINOTAUR_HORNS = 7;
    uint256 public constant MINOTAUR_CARD = 8;
    uint256 public constant SUCCUBUS_WINGS = 9;
    uint256 public constant SUCCUBUS_CARD = 10;
    uint256 public constant DEMON_HEAD = 11;
    uint256 public constant DEMON_CARD = 12;
    uint256 public constant DRAGON_EYE = 13;
    uint256 public constant DRAGON_CARD = 14;

    uint256 public constant WRAPPED_TOKEN_OFFSET = 10000000;

    struct Monster {
        string name;
        uint256 id;
        uint256 hp;
        uint256 armor;
        uint256 attack;
        uint256 agility;
        uint256 dexterity;
        uint256 guaranteedDrop;
        uint256 luckyDrop;
    }

    struct Item {
        uint256 hp;
        uint256 armor;
        uint256 attack;
        uint256 agility;
        uint256 dexterity;
    }

    struct BattleRoundResult {
        bool hasNextRound;
        bool won;
        int256 playerHp;
        int256 monsterHp;
    }

    uint256 public constant RAT_ID = 1;
    uint256 public constant SKELETON_ID = 2;
    uint256 public constant MINOTAUR_ID = 3;
    uint256 public constant SUCCUBUS_ID = 4;
    uint256 public constant DEMON_ID = 5;
    uint256 public constant DRAGON_ID = 6;

    Monster Rat =
        Monster("Sewer Rat", RAT_ID, 10, 0, 3, 4, 3, RAT_MEAT, RAT_CARD);
    Monster Skeleton =
        Monster(
            "Skeleton Warrior",
            SKELETON_ID,
            12,
            1,
            6,
            4,
            2,
            SKELETON_BONES,
            SKELETON_CARD
        );
    Monster Minotaur =
        Monster(
            "Minotaur Archer",
            MINOTAUR_ID,
            16,
            2,
            10,
            7,
            7,
            MINOTAUR_HORNS,
            MINOTAUR_CARD
        );
    Monster Succubus =
        Monster(
            "Succubus",
            SUCCUBUS_ID,
            10,
            2,
            20,
            10,
            5,
            SUCCUBUS_WINGS,
            SUCCUBUS_CARD
        );
    Monster Demon =
        Monster("Demon", DEMON_ID, 15, 4, 15, 5, 20, DEMON_HEAD, DEMON_CARD);
    Monster Dragon =
        Monster(
            "Fire Dragon",
            DRAGON_ID,
            30,
            5,
            25,
            0,
            0,
            DRAGON_EYE,
            DRAGON_CARD
        );

    Monster[6] public monsterArray;

    uint256 private constant DICE_PRECISION = 2**128;
    uint256 private constant ROLL_IN_PROGRESS = DICE_PRECISION + 1;

    uint256 public constant LOOT_TIME_LOCK = 1 days;

    uint256 public constant LUCKY_DROP_CHANCE_1_IN = 10;

    uint8 public constant ESCAPE_NFT_UNCLAIMABLE = 0;
    uint8 public constant ESCAPE_NFT_READY_TO_CLAIM = 1;
    uint8 public constant ESCAPE_NFT_CLAIMED = 2;

    uint8 public constant FERRYMAN_NFT_UNCLAIMABLE = 0;
    uint8 public constant FERRYMAN_NFT_READY_TO_CLAIM = 1;
    uint8 public constant FERRYMAN_NFT_CLAIMED = 2;

    mapping(uint256 => uint256) public remainingMonsterCount;

    bytes32 private s_keyHash;
    uint256 private s_fee;
    bool private isTestNetwork;

    uint256 public escapePrice = 0.04 ether;
    uint256 public battlePrice = 0.02 ether;
    uint256 public ferrymanPrice = 5 ether;
    Item public basePlayerStats = Item(10, 0, 1, 1, 1);
    bool public lockSettings = false;
    uint256 public maxRoundsPerBattle = 7;

    address public proxyRegistryAddress;
    address public lootAddress; // 0xFF9C1b15B16263C61d017ee9F65C50e4AE0113D7;

    mapping(uint256 => address) public lootOwners;
    mapping(uint256 => uint256) public lootTimeLock;
    mapping(uint256 => uint256) public tokenIdToEnterDungeonRollResult;
    mapping(uint256 => Monster) private tokenIdEncounteredMonster;
    mapping(address => uint8) private escapeNftClaimedState;
    mapping(address => uint8) private ferrymanCardClaimedState;

    mapping(uint256 => uint256) public tokenIdToMonsterBattleRollResult;
    mapping(bytes32 => uint256) private requestIdToTokenId;

    event EnteredDungeon(
        uint256 indexed tokenId,
        address indexed playerAddress,
        uint256 indexed encounteredMonster
    );

    event StartedBattle(uint256 indexed tokenId, address indexed playerAddress);

    event VrfResponseArrived(uint256 indexed tokenId);

    event WonBattle(uint256 indexed tokenId, address indexed playerAddress);

    event BribedTheFerryman(
        uint256 indexed tokenId,
        address indexed playerAddress
    );

    constructor(
        address vrfCoordinator,
        address link,
        bytes32 keyHash,
        uint256 fee,
        address _proxyRegistryAddress,
        address _lootAddress,
        bool _isTestNetwork
    )
        ERC1155("https://lootdungeon.app/api/item/{id}")
        VRFConsumerBase(vrfCoordinator, link)
    {
        s_keyHash = keyHash;
        s_fee = fee;

        remainingMonsterCount[Rat.id] = 2000;
        remainingMonsterCount[Skeleton.id] = 1000;
        remainingMonsterCount[Minotaur.id] = 700;
        remainingMonsterCount[Succubus.id] = 350;
        remainingMonsterCount[Demon.id] = 100;
        remainingMonsterCount[Dragon.id] = 50;

        monsterArray[0] = Rat;
        monsterArray[1] = Skeleton;
        monsterArray[2] = Minotaur;
        monsterArray[3] = Succubus;
        monsterArray[4] = Demon;
        monsterArray[5] = Dragon;

        proxyRegistryAddress = _proxyRegistryAddress;
        lootAddress = _lootAddress;

        isTestNetwork = _isTestNetwork;

        _mint(msg.sender, GENESIS_CARD, 5, "");

        // Mint one of each NFT
        _mint(msg.sender, ESCAPE_CARD, 1, "");
        _mint(msg.sender, FERRYMAN_CARD, 1, "");
        _mint(msg.sender, RAT_MEAT, 1, "");
        _mint(msg.sender, RAT_CARD, 1, "");
        _mint(msg.sender, SKELETON_BONES, 1, "");
        _mint(msg.sender, SKELETON_CARD, 1, "");
        _mint(msg.sender, MINOTAUR_HORNS, 1, "");
        _mint(msg.sender, MINOTAUR_CARD, 1, "");
        _mint(msg.sender, SUCCUBUS_WINGS, 1, "");
        _mint(msg.sender, SUCCUBUS_CARD, 1, "");
        _mint(msg.sender, DEMON_HEAD, 1, "");
        _mint(msg.sender, DEMON_CARD, 1, "");
        _mint(msg.sender, DRAGON_EYE, 1, "");
        _mint(msg.sender, DRAGON_CARD, 1, "");
    }

    modifier onlyIfEnoughLink() {
        if (isTestNetwork == false) {
            require(
                LINK.balanceOf(address(this)) >= s_fee,
                "Not enough LINK to pay fee"
            );
        }
        _;
    }

    modifier onlyLootBagOwner(uint256 tokenId) {
        require(
            lootOwners[tokenId] == _msgSender(),
            "You do not have permissions to use this loot bag"
        );
        _;
    }

    modifier onlyIfNotLocked() {
        require(lockSettings == false, "The contract settings are locked");
        _;
    }

    modifier onlyLootBagOwnerBeforeTimelock(uint256 tokenId) {
        require(lootOwners[tokenId] == _msgSender());
        require(block.timestamp <= lootTimeLock[tokenId]);
        _;
    }

    modifier onlyIfBattleFinished(uint256 tokenId) {
        require(
            tokenIdToMonsterBattleRollResult[tokenId] != uint256(0x0),
            "You have not started the battle yet"
        );

        require(
            tokenIdToMonsterBattleRollResult[tokenId] != ROLL_IN_PROGRESS,
            "Waiting for VRF to supply a random number"
        );

        _;
    }

    function hasEnoughLink() public view returns (bool) {
        return LINK.balanceOf(address(this)) >= s_fee;
    }

    function getLootOwner(uint256 tokenId) public view returns (address) {
        return lootOwners[tokenId];
    }

    function _getRolledMonster(uint256 rollResult)
        internal
        view
        returns (Monster memory)
    {
        uint256 totalMonsters = getRemainingMonsterCount();
        require(totalMonsters > 0, "All monsters have been slayed.");

        uint256 boundedResult = rollResult.sub(1).mod(totalMonsters);

        uint256 cap = 0;
        for (uint256 i = 0; i < monsterArray.length; i++) {
            Monster memory currMonster = monsterArray[i];

            cap += remainingMonsterCount[currMonster.id];
            if (boundedResult < cap) {
                return currMonster;
            }
        }

        revert("Shouldnt get to this point x__x");
    }

    function getEncounteredMonster(uint256 tokenId)
        public
        view
        returns (Monster memory)
    {
        require(
            hasEnteredTheDungeon(tokenId),
            "You are not in the dungeon yet"
        );

        return tokenIdEncounteredMonster[tokenId];
    }

    function getRemainingMonsterCount() public view returns (uint256) {
        uint256 totalMonsters = 0;

        for (uint256 i = 0; i < monsterArray.length; i++) {
            totalMonsters += remainingMonsterCount[monsterArray[i].id];
        }

        return totalMonsters;
    }

    function hasEnteredTheDungeon(uint256 tokenId) public view returns (bool) {
        return tokenIdToEnterDungeonRollResult[tokenId] != uint256(0x0);
    }

    function hasFinishedBattle(uint256 tokenId) public view returns (bool) {
        return
            tokenIdToMonsterBattleRollResult[tokenId] != uint256(0x0) &&
            tokenIdToMonsterBattleRollResult[tokenId] != ROLL_IN_PROGRESS;
    }

    function hasStartedBattle(uint256 tokenId) public view returns (bool) {
        return tokenIdToMonsterBattleRollResult[tokenId] != uint256(0x0);
    }

    /**
     * Requires the owner of the loot bag to approve the transfer first.
     */
    function enterTheDungeon(uint256 tokenId) external nonReentrant {
        require(
            getRemainingMonsterCount() > 0,
            "All monsters have been slayed"
        );

        IERC721 lootContract = IERC721(lootAddress);

        // If the contract is not already the owner of the loot bag, transfer it to this contract.
        if (lootContract.ownerOf(tokenId) != address(this)) {
            lootContract.transferFrom(_msgSender(), address(this), tokenId);
            lootOwners[tokenId] = _msgSender();
            lootTimeLock[tokenId] = block.timestamp + LOOT_TIME_LOCK;
        }

        require(
            lootOwners[tokenId] == _msgSender(),
            "You do not own this loot bag"
        );
        require(
            hasEnteredTheDungeon(tokenId) == false,
            "You are already in the dungeon"
        );

        _monsterEncounter(
            tokenId,
            _pseudorandom(string(abi.encodePacked(tokenId)), true)
        );
    }

    function _monsterEncounter(uint256 tokenId, uint256 randomness) internal {
        uint256 rollResult = randomness.mod(DICE_PRECISION).add(1); // Add 1 to distinguish from not-rolled state in edge-case (rng = 0)
        tokenIdToEnterDungeonRollResult[tokenId] = rollResult;

        Monster memory rolledMonster = _getRolledMonster(rollResult);
        tokenIdEncounteredMonster[tokenId] = rolledMonster;
        remainingMonsterCount[rolledMonster.id] = remainingMonsterCount[
            rolledMonster.id
        ].sub(1);

        emit EnteredDungeon(tokenId, _msgSender(), rolledMonster.id);
    }

    function escapeFromDungeon(uint256 tokenId)
        external
        payable
        onlyLootBagOwner(tokenId)
        nonReentrant
    {
        require(
            hasEnteredTheDungeon(tokenId),
            "You have not entered the dungeon yet"
        );
        require(
            hasStartedBattle(tokenId) == false,
            "You can't escape from a battle that already started"
        );
        require(
            msg.value >= escapePrice,
            "The amount of eth paid is not enough to escape from this battle"
        );
        Monster memory currMonster = tokenIdEncounteredMonster[tokenId];
        remainingMonsterCount[currMonster.id] = remainingMonsterCount[
            currMonster.id
        ].add(1);
        _exitDungeon(tokenId);

        // If it's the first escape, allow claiming escape NFT
        if (escapeNftClaimedState[_msgSender()] == ESCAPE_NFT_UNCLAIMABLE) {
            escapeNftClaimedState[_msgSender()] = ESCAPE_NFT_READY_TO_CLAIM;
        }
    }

    function _exitDungeon(uint256 tokenId) internal {
        address ogOwner = lootOwners[tokenId];
        lootOwners[tokenId] = address(0x0);
        tokenIdToEnterDungeonRollResult[tokenId] = uint256(0x0);
        tokenIdToMonsterBattleRollResult[tokenId] = uint256(0x0);
        lootTimeLock[tokenId] = uint256(0x0);

        IERC721 lootContract = IERC721(lootAddress);
        lootContract.transferFrom(address(this), ogOwner, tokenId);
    }

    function battleMonster(uint256 tokenId)
        external
        payable
        onlyIfEnoughLink
        onlyLootBagOwner(tokenId)
        nonReentrant
        returns (bytes32 requestId)
    {
        require(
            hasEnteredTheDungeon(tokenId),
            "You have not entered the dungeon yet"
        );
        require(
            hasStartedBattle(tokenId) == false,
            "The battle already started"
        );
        require(
            msg.value >= battlePrice,
            "The amount of eth paid is not enough to fight this battle"
        );

        if (isTestNetwork) {
            requestId = 0;
        } else {
            requestId = requestRandomness(s_keyHash, s_fee);
        }
        requestIdToTokenId[requestId] = tokenId;
        tokenIdToMonsterBattleRollResult[tokenId] = ROLL_IN_PROGRESS;

        if (isTestNetwork) {
            fulfillRandomness(requestId, tokenId);
        }

        emit StartedBattle(tokenId, _msgSender());

        return requestId;
    }

    function checkBattleResultsNoCache(
        uint256 tokenId,
        uint256 round,
        int256 lastRoundPlayerHp,
        int256 lastRoundMonsterHp
    )
        public
        view
        onlyIfBattleFinished(tokenId)
        returns (BattleRoundResult memory)
    {
        Item memory playerBaseStats = getStats(tokenId);
        return
            checkBattleResults(
                tokenId,
                round,
                lastRoundPlayerHp,
                lastRoundMonsterHp,
                playerBaseStats
            );
    }

    function checkBattleResults(
        uint256 tokenId,
        uint256 round,
        int256 lastRoundPlayerHp,
        int256 lastRoundMonsterHp,
        Item memory playerBaseStats
    )
        public
        view
        onlyIfBattleFinished(tokenId)
        returns (BattleRoundResult memory)
    {
        if (round > maxRoundsPerBattle - 1) {
            // Player wins by forfeit
            return
                BattleRoundResult(
                    false,
                    true,
                    lastRoundPlayerHp,
                    lastRoundMonsterHp
                );
        }

        bool hasNextRound = true;
        bool won = false;

        uint256 monsterDamage = _getMonsterDamage(
            tokenId,
            round,
            playerBaseStats
        );
        uint256 playerDamage = _getPlayerDamage(
            tokenId,
            round,
            playerBaseStats
        );

        int256 monsterHp = lastRoundMonsterHp - int256(monsterDamage);
        int256 playerHp = lastRoundPlayerHp - int256(playerDamage);

        if (playerHp <= 0 || monsterHp <= 0) {
            hasNextRound = false;
        }

        if (playerHp > 0 && monsterHp <= 0) {
            won = true;
        }

        return BattleRoundResult(hasNextRound, won, playerHp, monsterHp);
    }

    function _getMonsterDamage(
        uint256 tokenId,
        uint256 round,
        Item memory playerStats
    ) internal view returns (uint256 damage) {
        uint256 randomSeed = tokenIdToMonsterBattleRollResult[tokenId];
        Monster memory currMonster = tokenIdEncounteredMonster[tokenId];

        uint256 playerAccuracyRoll = _pseudorandom(
            string(abi.encodePacked(randomSeed, "player", round)),
            false
        ).mod(20).add(1);

        // Player hit
        if (playerAccuracyRoll + playerStats.dexterity < currMonster.agility) {
            return 0;
        }

        uint256 playerAttackRoll = _pseudorandom(
            string(abi.encodePacked(randomSeed, "playerAttack", round)),
            false
        ).mod(playerStats.attack).add(1);

        if (playerAttackRoll > currMonster.armor) {
            return playerAttackRoll.sub(currMonster.armor);
        }

        return 0;
    }

    function _getPlayerDamage(
        uint256 tokenId,
        uint256 round,
        Item memory playerStats
    ) internal view returns (uint256 damage) {
        uint256 randomSeed = tokenIdToMonsterBattleRollResult[tokenId];
        Monster memory currMonster = tokenIdEncounteredMonster[tokenId];

        uint256 monsterAccuracyRoll = _pseudorandom(
            string(abi.encodePacked(randomSeed, "monster", round)),
            false
        ).mod(20).add(1);

        // Monster miss
        if (monsterAccuracyRoll + currMonster.dexterity < playerStats.agility) {
            return 0;
        }

        uint256 monsterAttackRoll = _pseudorandom(
            string(abi.encodePacked(randomSeed, "monsterAttack", round)),
            false
        ).mod(currMonster.attack).add(1);

        if (monsterAttackRoll > playerStats.armor) {
            return monsterAttackRoll.sub(playerStats.armor);
        }

        return 0;
    }

    function fulfillRandomness(bytes32 requestId, uint256 randomness)
        internal
        override
    {
        uint256 tokenId = requestIdToTokenId[requestId];
        uint256 rollResult = randomness.mod(DICE_PRECISION).add(1); // Add 1 to distinguish from not-rolled state in edge-case (rng = 0)
        tokenIdToMonsterBattleRollResult[tokenId] = rollResult;
        emit VrfResponseArrived(tokenId);
    }

    function claimDrops(uint256 tokenId)
        external
        onlyLootBagOwner(tokenId)
        onlyIfBattleFinished(tokenId)
        nonReentrant
    {
        Item memory playerBaseStats = getStats(tokenId);
        Monster memory currMonster = tokenIdEncounteredMonster[tokenId];
        bool hasNextRound = true;
        bool won = false;
        int256 playerHp = int256(playerBaseStats.hp);
        int256 monsterHp = int256(currMonster.hp);
        uint256 round = 0;

        while (hasNextRound) {
            BattleRoundResult memory result = checkBattleResults(
                tokenId,
                round,
                playerHp,
                monsterHp,
                playerBaseStats
            );
            hasNextRound = result.hasNextRound;
            won = result.won;
            playerHp = result.playerHp;
            monsterHp = result.monsterHp;
            round++;
        }

        if (won) {
            emit WonBattle(tokenId, _msgSender());

            _mintMonsterLoot(tokenId);
            return _exitDungeon(tokenId);
        }

        revert("You cannot claim rewards if you did not win the battle");
    }

    function _mintMonsterLoot(uint256 tokenId) internal {
        Monster memory currMonster = tokenIdEncounteredMonster[tokenId];
        uint256 randomSeed = tokenIdToMonsterBattleRollResult[tokenId];

        uint256 luckyDropRoll = _pseudorandom(
            string(abi.encodePacked(randomSeed, "luckyDrop")),
            false
        ).mod(LUCKY_DROP_CHANCE_1_IN).add(1);

        _mint(_msgSender(), currMonster.guaranteedDrop, 1, "");

        if (luckyDropRoll <= 1) {
            _mint(_msgSender(), currMonster.luckyDrop, 1, "");
        }
    }

    function bribeFerryman(uint256 tokenId)
        external
        payable
        onlyLootBagOwnerBeforeTimelock(tokenId)
        onlyIfBattleFinished(tokenId)
        nonReentrant
    {
        require(
            msg.value >= ferrymanPrice,
            "The amount of eth paid is not enough to bribe the ferryman"
        );

        // If it's the first ferryman, allow claiming ferryman NFT
        if (
            ferrymanCardClaimedState[_msgSender()] == FERRYMAN_NFT_UNCLAIMABLE
        ) {
            ferrymanCardClaimedState[
                _msgSender()
            ] = FERRYMAN_NFT_READY_TO_CLAIM;
        }

        emit BribedTheFerryman(tokenId, _msgSender());

        _exitDungeon(tokenId);
    }

    function claimEscapeCard() external {
        require(canClaimEscapeCard(), "Escape NFT not ready to be claimed");
        escapeNftClaimedState[_msgSender()] = ESCAPE_NFT_CLAIMED;

        _mint(_msgSender(), ESCAPE_CARD, 1, "");
    }

    function claimFerrymanCard() external {
        require(
            canClaimFerrymanCard(),
            "Ferryman Card not ready to be claimed"
        );
        ferrymanCardClaimedState[_msgSender()] = FERRYMAN_NFT_CLAIMED;

        _mint(_msgSender(), FERRYMAN_CARD, 1, "");
    }

    function canClaimEscapeCard() public view returns (bool) {
        return escapeNftClaimedState[_msgSender()] == ESCAPE_NFT_READY_TO_CLAIM;
    }

    function canClaimFerrymanCard() public view returns (bool) {
        return
            ferrymanCardClaimedState[_msgSender()] ==
            FERRYMAN_NFT_READY_TO_CLAIM;
    }

    function _pseudorandom(string memory input, bool varyEachBlock)
        internal
        view
        returns (uint256)
    {
        bytes32 blockComponent = 0;
        if (!isTestNetwork && varyEachBlock) {
            // Remove randomness in tests
            blockComponent = blockhash(block.number);
        }
        return uint256(keccak256(abi.encodePacked(input, blockComponent)));
    }

    function _lootOgRandom(string memory input)
        internal
        pure
        returns (uint256)
    {
        return uint256(keccak256(abi.encodePacked(input)));
    }

    /**
     * WEAPON: Atk
     * CHEST: Armor
     * HEAD: HP
     * WAIST: HP
     * FOOT: AGI
     * HAND: DEX
     * NECK: Random
     * RING: Random
     */
    function getStats(uint256 tokenId) public view returns (Item memory) {
        uint256 hpBonus = (_lootOgRandom(
            string(abi.encodePacked("HEAD", toString(tokenId)))
        ) % 21) +
            (_lootOgRandom(
                string(abi.encodePacked("WAIST", toString(tokenId)))
            ) % 21);

        uint256 armorBonus = _lootOgRandom(
            string(abi.encodePacked("CHEST", toString(tokenId)))
        ) % 21;

        uint256 attackBonus = _lootOgRandom(
            string(abi.encodePacked("WEAPON", toString(tokenId)))
        ) % 21;

        uint256 agiBonus = _lootOgRandom(
            string(abi.encodePacked("FOOT", toString(tokenId)))
        ) % 21;

        uint256 dexBonus = _lootOgRandom(
            string(abi.encodePacked("HAND", toString(tokenId)))
        ) % 21;

        uint256 neckBonus = _lootOgRandom(
            string(abi.encodePacked("NECK", toString(tokenId)))
        ) % 21;

        uint256 ringBonus = _lootOgRandom(
            string(abi.encodePacked("RING", toString(tokenId)))
        ) % 21;

        if (neckBonus < 4) {
            dexBonus += ringBonus / 3 + 1;
        } else if (neckBonus < 8) {
            agiBonus += ringBonus / 3 + 1;
        } else if (neckBonus < 12) {
            hpBonus += ringBonus / 3 + 1;
        } else if (neckBonus < 16) {
            attackBonus += ringBonus / 4 + 1;
        } else {
            armorBonus += ringBonus / 5 + 1;
        }

        return
            Item(
                basePlayerStats.hp + hpBonus / 2,
                basePlayerStats.armor + armorBonus / 4,
                basePlayerStats.attack + attackBonus / 2,
                basePlayerStats.agility + agiBonus / 2,
                basePlayerStats.dexterity + dexBonus / 2
            );
    }

    // OpenSea stuff
    function isApprovedForAll(address _owner, address _operator)
        public
        view
        override
        returns (bool)
    {
        return owner() == _owner && _isOwnerOrProxy(_operator);
    }

    function _isOwnerOrProxy(address _address) internal view returns (bool) {
        ProxyRegistry proxyRegistry = ProxyRegistry(proxyRegistryAddress);
        return
            owner() == _address ||
            address(proxyRegistry.proxies(owner())) == _address;
    }

    function setProxyRegistryAddress(address _proxyRegistryAddress)
        public
        onlyOwner
    {
        proxyRegistryAddress = _proxyRegistryAddress;
    }

    // Withdraw stuff
    function withdrawEth() external onlyOwner {
        address payable _owner = payable(owner());
        _owner.transfer(address(this).balance);
    }

    function withdrawToken(address _tokenContract, uint256 amount)
        external
        onlyOwner
    {
        IERC20 tokenContract = IERC20(_tokenContract);
        tokenContract.transfer(owner(), amount);
    }

    function withdrawLoot(uint256 tokenId) external onlyOwner {
        require(
            block.timestamp >= lootTimeLock[tokenId],
            "Can't withdraw time-locked loot"
        );

        IERC721 lootContract = IERC721(lootAddress);
        lootOwners[tokenId] = address(0x0);
        tokenIdToEnterDungeonRollResult[tokenId] = uint256(0x0);
        tokenIdToMonsterBattleRollResult[tokenId] = uint256(0x0);
        lootTimeLock[tokenId] = uint256(0x0);
        lootContract.transferFrom(address(this), owner(), tokenId);
    }

    // Adjust params
    function setEscapePrice(uint256 newPrice)
        external
        onlyOwner
        onlyIfNotLocked
    {
        escapePrice = newPrice;
    }

    function setBattlePrice(uint256 newPrice)
        external
        onlyOwner
        onlyIfNotLocked
    {
        battlePrice = newPrice;
    }

    function setFerrymanPrice(uint256 newPrice)
        external
        onlyOwner
        onlyIfNotLocked
    {
        ferrymanPrice = newPrice;
    }

    function setLinkFee(uint256 newFee) external onlyOwner {
        s_fee = newFee;
    }

    function adjustPlayerStats(Item memory newStats)
        external
        onlyOwner
        onlyIfNotLocked
    {
        basePlayerStats = newStats;
    }

    function adjustMonster(Monster memory adjustedMonster, uint256 monsterIndex)
        external
        onlyOwner
        onlyIfNotLocked
    {
        monsterArray[monsterIndex] = adjustedMonster;
    }

    function adjustMaxRounds(uint256 maxRounds)
        external
        onlyOwner
        onlyIfNotLocked
    {
        maxRoundsPerBattle = maxRounds;
    }

    function setUri(string memory newUri) external onlyOwner {
        _setURI(newUri);
    }

    function lockFromAdditionalChanges() external onlyOwner onlyIfNotLocked {
        lockSettings = true;
    }

    // Lib
    function toString(uint256 value) internal pure returns (string memory) {
        // Inspired by OraclizeAPI's implementation - MIT license
        // https://github.com/oraclize/ethereum-api/blob/b42146b063c7d6ee1358846c198246239e9360e8/oraclizeAPI_0.4.25.sol

        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
