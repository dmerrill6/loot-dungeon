// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";
import "./LootStats.sol";

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

    uint256 public constant MONSTER_TYPES = 6;

    uint256 public constant RAT_ID = 1;
    uint256 public constant SKELETON_ID = 2;
    uint256 public constant MINOTAUR_ID = 3;
    uint256 public constant SUCCUBUS_ID = 4;
    uint256 public constant DEMON_ID = 5;
    uint256 public constant DRAGON_ID = 6;

    Monster public Rat =
        Monster("Rat", RAT_ID, 10, 0, 3, 4, 3, RAT_MEAT, RAT_CARD);

    Monster public Skeleton =
        Monster(
            "Skeleton Warrior",
            SKELETON_ID,
            10,
            1,
            4,
            4,
            2,
            SKELETON_BONES,
            SKELETON_CARD
        );

    Monster public Minotaur =
        Monster(
            "Minotaur Archer",
            MINOTAUR_ID,
            16,
            2,
            10,
            7,
            4,
            MINOTAUR_HORNS,
            MINOTAUR_CARD
        );

    Monster public Succubus =
        Monster(
            "Succubus",
            SUCCUBUS_ID,
            20,
            3,
            14,
            10,
            5,
            SUCCUBUS_WINGS,
            SUCCUBUS_CARD
        );

    Monster public Demon =
        Monster("Demon", DEMON_ID, 25, 4, 16, 5, 20, DEMON_HEAD, DEMON_CARD);

    Monster public Dragon =
        Monster(
            "Fire Dragon",
            DRAGON_ID,
            30,
            6,
            25,
            0,
            5,
            DRAGON_EYE,
            DRAGON_CARD
        );

    uint256 private constant DICE_PRECISION = 2**128;
    uint256 private constant ROLL_IN_PROGRESS = DICE_PRECISION + 1;

    uint256 public constant MAX_ROUNDS_PER_BATTLE = 6;

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
    Item public basePlayerStats = Item(20, 1, 1, 1, 1);

    address public proxyRegistryAddress;
    address public lootAddress; // 0xFF9C1b15B16263C61d017ee9F65C50e4AE0113D7;
    address public lootComponentsAddress; //0x3eb43b1545a360d1D065CB7539339363dFD445F3
    address public lootStatsAddress;

    mapping(uint256 => address) private lootOwners;
    mapping(uint256 => uint256) public lootTimeLock;
    mapping(uint256 => uint256) private tokenIdToEnterDungeonRollResult;
    mapping(uint256 => Monster) private tokenIdEncounteredMonster;
    mapping(address => uint8) private escapeNftClaimedState;
    mapping(address => uint8) private ferrymanCardClaimedState;

    mapping(uint256 => uint256) private tokenIdToMonsterBattleRollResult;
    mapping(bytes32 => uint256) private requestIdToTokenId;

    event EnteredDungeon(
        uint256 indexed tokenId,
        address indexed playerAddress,
        uint256 indexed encounteredMonster
    );

    event StartedBattle(uint256 indexed tokenId, address indexed playerAddress);

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
        address _lootStatsAddress,
        bool _isTestNetwork
    )
        ERC1155("https://[MY_DOMAIN]/api/item/{id}.json")
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

        proxyRegistryAddress = _proxyRegistryAddress;
        lootAddress = _lootAddress;
        lootStatsAddress = _lootStatsAddress;

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

    function _getMonsterArr()
        internal
        view
        returns (Monster[MONSTER_TYPES] memory)
    {
        return [Rat, Skeleton, Minotaur, Succubus, Demon, Dragon];
    }

    modifier hasEnoughLink() {
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
        Monster[MONSTER_TYPES] memory monsterArr = _getMonsterArr();

        uint256 cap = 0;
        for (uint256 i = 0; i < monsterArr.length; i++) {
            Monster memory currMonster = monsterArr[i];

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
        Monster[MONSTER_TYPES] memory monsterArr = _getMonsterArr();

        for (uint256 i = 0; i < monsterArr.length; i++) {
            totalMonsters += remainingMonsterCount[monsterArr[i].id];
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

    function lootIdToWrappedLootId(uint256 tokenId)
        public
        pure
        returns (uint256)
    {
        return WRAPPED_TOKEN_OFFSET + tokenId;
    }

    function wrappedLootIdToLootId(uint256 wrappedTokenId)
        public
        pure
        returns (uint256)
    {
        return wrappedTokenId.sub(WRAPPED_TOKEN_OFFSET);
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
            _mint(_msgSender(), lootIdToWrappedLootId(tokenId), 1, ""); // We use this to track loots in dungeon per user
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
            _pseudorandom(string(abi.encodePacked(tokenId)))
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
        _burn(_msgSender(), lootIdToWrappedLootId(tokenId), 1);
    }

    function battleMonster(uint256 tokenId)
        external
        payable
        hasEnoughLink
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
        if (round > MAX_ROUNDS_PER_BATTLE) {
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
            string(abi.encodePacked(randomSeed, "player", round))
        ).mod(20).add(1);

        // Player hit
        if (playerAccuracyRoll + playerStats.dexterity > currMonster.agility) {
            uint256 playerAttackRoll = _pseudorandom(
                string(abi.encodePacked(randomSeed, "playerAttack", round))
            ).mod(playerStats.attack).add(1);

            if (playerAttackRoll > currMonster.armor) {
                return playerAttackRoll.sub(currMonster.armor);
            }
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
            string(abi.encodePacked(randomSeed, "monster", round))
        ).mod(20).add(1);

        // Monster hit
        if (monsterAccuracyRoll + currMonster.dexterity > playerStats.agility) {
            uint256 monsterAttackRoll = _pseudorandom(
                string(abi.encodePacked(randomSeed, "monsterAttack", round))
            ).mod(currMonster.attack).add(1);

            if (monsterAttackRoll > playerStats.armor) {
                return monsterAttackRoll.sub(playerStats.armor);
            }
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
            string(abi.encodePacked(randomSeed, "luckyDrop"))
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
        require(
            escapeNftClaimedState[_msgSender()] == ESCAPE_NFT_READY_TO_CLAIM,
            "Escape NFT not ready to be claimed"
        );
        escapeNftClaimedState[_msgSender()] = ESCAPE_NFT_CLAIMED;

        _mint(_msgSender(), ESCAPE_CARD, 1, "");
    }

    function claimFerrymanCard() external {
        require(
            ferrymanCardClaimedState[_msgSender()] ==
                FERRYMAN_NFT_READY_TO_CLAIM,
            "Ferryman Card not ready to be claimed"
        );
        ferrymanCardClaimedState[_msgSender()] = FERRYMAN_NFT_CLAIMED;

        _mint(_msgSender(), FERRYMAN_CARD, 1, "");
    }

    function _pseudorandom(string memory input)
        internal
        view
        returns (uint256)
    {
        uint256 blockComponent = block.number;
        if (isTestNetwork) {
            // Remove randomness in tests
            blockComponent = 0;
        }
        return uint256(keccak256(abi.encodePacked(input, blockComponent)));
    }

    // Stats calculation
    /*
     * Weapon: Attack, Agility, Dexterity
     * Chest: Base HP
     * Head: Armor
     * Waist: Armor
     * Foot: Agility
     * Hand: Dexterity
     * Neck and Ring: Only suffix bonus
     */

    function getStats(uint256 tokenId) public view returns (Item memory) {
        LootStats stats = LootStats(lootStatsAddress);
        LootStats.Item memory weaponStats = stats.getWeaponStats(tokenId);
        LootStats.Item memory armorStats = stats.getArmorStats(tokenId);
        LootStats.Item memory accessoryStats = stats.getAccessoryStats(tokenId);

        return
            Item(
                basePlayerStats.hp +
                    weaponStats.hp +
                    armorStats.hp +
                    accessoryStats.hp,
                basePlayerStats.armor +
                    weaponStats.armor +
                    armorStats.armor +
                    accessoryStats.armor,
                basePlayerStats.attack +
                    weaponStats.attack +
                    armorStats.attack +
                    accessoryStats.attack,
                basePlayerStats.agility +
                    weaponStats.agility +
                    armorStats.agility +
                    accessoryStats.agility,
                basePlayerStats.dexterity +
                    weaponStats.dexterity +
                    armorStats.dexterity +
                    accessoryStats.dexterity
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
        lootContract.transferFrom(address(this), owner(), tokenId);
    }

    // Set params
    function setEscapePrice(uint256 newPrice) external onlyOwner {
        escapePrice = newPrice;
    }

    function setBattlePrice(uint256 newPrice) external onlyOwner {
        battlePrice = newPrice;
    }

    function setFerrymanPrice(uint256 newPrice) external onlyOwner {
        ferrymanPrice = newPrice;
    }

    function setLinkFee(uint256 newFee) external onlyOwner {
        s_fee = newFee;
    }

    function adjustPlayerStats(Item memory newStats) external onlyOwner {
        basePlayerStats = newStats;
    }

    function changeStatsContract(address newAddress) external onlyOwner {
        lootStatsAddress = newAddress;
    }
}
