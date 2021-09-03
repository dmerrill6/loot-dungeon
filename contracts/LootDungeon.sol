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

    struct Monster {
        string name;
        uint256 id;
        uint256 hp;
        uint256 attack;
        uint256 defense;
        uint256 guaranteedDrop;
        uint256 luckyDrop;
    }

    uint256 public constant MONSTER_TYPES = 2;

    uint256 public constant RAT_ID = 1;
    uint256 public constant SKELETON_ID = 2;

    Monster public Rat = Monster("Rat", RAT_ID, 20, 5, 0, RAT_MEAT, RAT_CARD);
    Monster public Skeleton =
        Monster(
            "Skeleton Warrior",
            SKELETON_ID,
            50,
            7,
            1,
            SKELETON_BONES,
            SKELETON_CARD
        );

    uint256 private constant DICE_PRECISION = 2**128;
    uint256 private constant ROLL_IN_PROGRESS = DICE_PRECISION + 1;

    uint256 public constant LOOT_TIME_LOCK = 1 days;

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
    uint256 public ferrymanPrice = 4 ether;

    address public proxyRegistryAddress;
    address public lootAddress; // 0xFF9C1b15B16263C61d017ee9F65C50e4AE0113D7;

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

    constructor(
        address vrfCoordinator,
        address link,
        bytes32 keyHash,
        uint256 fee,
        address _proxyRegistryAddress,
        address _lootAddress,
        bool _isTestNetwork
    )
        ERC1155("https://[MY_DOMAIN]/api/item/{id}.json")
        VRFConsumerBase(vrfCoordinator, link)
    {
        s_keyHash = keyHash;
        s_fee = fee;

        remainingMonsterCount[Rat.id] = 1000;
        remainingMonsterCount[Skeleton.id] = 500;

        proxyRegistryAddress = _proxyRegistryAddress;
        lootAddress = _lootAddress;
        isTestNetwork = _isTestNetwork;

        _mint(msg.sender, GENESIS_CARD, 5, "");
    }

    function _getMonsterArr()
        internal
        view
        returns (Monster[MONSTER_TYPES] memory)
    {
        return [Rat, Skeleton];
    }

    modifier hasEnoughLink() {
        require(
            LINK.balanceOf(address(this)) >= s_fee,
            "Not enough LINK to pay fee"
        );
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
        if (hasEnteredTheDungeon(tokenId) != true) {
            revert("You have not entered the dungeon yet");
        }
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

        IERC721 lootContract = IERC721(lootAddress);
        lootContract.transferFrom(address(this), ogOwner, tokenId);
    }

    function battleMonster(uint256 tokenId)
        external
        payable
        hasEnoughLink
        onlyLootBagOwner(tokenId)
        nonReentrant
        returns (bytes32 requestId)
    {
        if (hasEnteredTheDungeon(tokenId) != true) {
            revert("You have not entered the dungeon yet");
        }
        require(
            msg.value >= battlePrice,
            "The amount of eth paid is not enough to fight this battle"
        );

        requestId = requestRandomness(s_keyHash, s_fee);
        requestIdToTokenId[requestId] = tokenId;
        tokenIdToMonsterBattleRollResult[tokenId] = ROLL_IN_PROGRESS;

        if (isTestNetwork) {
            fulfillRandomness(requestId, tokenId);
        }

        return requestId;
    }

    function checkBattleResults(
        uint256 tokenId,
        uint256 round,
        int256 lastRoundPlayerHp,
        int256 lastRoundMonsterHp
    )
        public
        view
        onlyIfBattleFinished(tokenId)
        returns (
            string memory,
            bool hasNextRound,
            bool won,
            int256 playerHp,
            int256 monsterHp
        )
    {
        hasNextRound = true;
        won = false;
        uint256 rolledNumber = tokenIdToMonsterBattleRollResult[tokenId];
        uint256 playerRoll = _pseudorandom(
            string(abi.encodePacked(rolledNumber, "player", round))
        );

        uint256 monsterRoll = _pseudorandom(
            string(abi.encodePacked(rolledNumber, "monster", round))
        );

        //TODO: Calculate damage
        playerHp = lastRoundPlayerHp - int256(monsterRoll.mod(10));
        monsterHp = lastRoundMonsterHp - int256(playerRoll.mod(10));

        if (playerHp <= 0 || monsterHp <= 0) {
            hasNextRound = false;
        }

        if (playerHp > 0 && monsterHp <= 0) {
            won = true;
        }

        return ("You died", hasNextRound, won, playerHp, monsterHp);
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
    {
        Monster memory currMonster = tokenIdEncounteredMonster[tokenId];
        bool hasNextRound = true;
        bool won = false;
        int256 playerHp = 100; // TODO: Get from stats
        int256 monsterHp = int256(currMonster.hp);
        string memory _msg;
        uint256 round = 0;

        while (hasNextRound) {
            (_msg, hasNextRound, won, playerHp, monsterHp) = checkBattleResults(
                tokenId,
                round,
                playerHp,
                monsterHp
            );
            round++;
        }

        if (won) {
            _mint(_msgSender(), currMonster.guaranteedDrop, 1, "");
            _mint(_msgSender(), currMonster.luckyDrop, 1, "");
            _exitDungeon(tokenId);
        }
    }

    function bribeFerryman(uint256 tokenId)
        external
        payable
        onlyLootBagOwnerBeforeTimelock(tokenId)
        onlyIfBattleFinished(tokenId)
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

    function claiFerrymanCard() external {
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
}
