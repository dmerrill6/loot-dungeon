// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ILootComponents.sol";

contract LootStats {
    struct Item {
        uint256 hp;
        uint256 armor;
        uint256 attack;
        uint256 agility;
        uint256 dexterity;
    }

    address public lootComponentsAddress;

    constructor(address _lootComponentsAddress) {
        lootComponentsAddress = _lootComponentsAddress;
    }

    function getWeaponStats(uint256 tokenId) public view returns (Item memory) {
        ILootComponents components = ILootComponents(lootComponentsAddress);

        uint256[5] memory weaponComponents = components.weaponComponents(
            tokenId
        );

        uint256 attack = _getItemStat(weaponComponents, 3) + 2;

        // Item memory weaponStats = _getTotalStat(
        //     weaponComponents,
        //     _getWeaponStats(weaponComponents[0])
        // );

        return Item(0, 0, attack, 0, 0);
    }

    function getAccessoryStats(uint256 tokenId)
        public
        view
        returns (Item memory)
    {
        ILootComponents components = ILootComponents(lootComponentsAddress);

        uint256[5] memory neckComponents = components.neckComponents(tokenId);
        uint256[5] memory ringComponents = components.ringComponents(tokenId);
        Item memory neckStats = _getAccessoryBonusStat(neckComponents);
        Item memory ringStats = _getAccessoryBonusStat(ringComponents);

        // Item memory neckStats = _getTotalStat(
        //     neckComponents,
        //     Item(0, 0, 0, 0, 0)
        // );
        // Item memory ringStats = _getTotalStat(
        //     ringComponents,
        //     Item(0, 0, 0, 0, 0)
        // );

        return
            Item(
                neckStats.hp + ringStats.hp,
                neckStats.armor + ringStats.armor,
                neckStats.attack + ringStats.attack,
                neckStats.agility + ringStats.agility,
                neckStats.dexterity + ringStats.dexterity
            );
    }

    function _getAccessoryBonusStat(uint256[5] memory components)
        internal
        pure
        returns (Item memory)
    {
        uint256 bonusStat = _getItemStat(components, 0);

        uint256 hp = 0;
        uint256 armor = 0;
        uint256 attack = 0;
        uint256 agility = 0;
        uint256 dexterity = 0;

        if (bonusStat < 1) {
            hp += 5;
        } else if (bonusStat < 2) {
            dexterity += 3;
        } else if (bonusStat < 3) {
            agility += 3;
        } else if (bonusStat < 4) {
            attack += 3;
        } else {
            armor += 2;
        }

        return Item(hp, armor, attack, agility, dexterity);
    }

    function getArmorStats(uint256 tokenId) public view returns (Item memory) {
        ILootComponents components = ILootComponents(lootComponentsAddress);

        uint256[5] memory chestComponents = components.chestComponents(tokenId);
        uint256[5] memory headComponents = components.headComponents(tokenId);
        uint256[5] memory waistComponents = components.waistComponents(tokenId);
        uint256[5] memory footComponents = components.footComponents(tokenId);
        uint256[5] memory handComponents = components.handComponents(tokenId);

        uint256 hp = _getItemStat(headComponents, 1) +
            _getItemStat(waistComponents, 5);
        uint256 armor = _getItemStat(chestComponents, 3);
        uint256 agility = _getItemStat(footComponents, 2) + 1;
        uint256 dexterity = _getItemStat(handComponents, 4) + 1;

        return Item(hp, armor, 0, agility, dexterity);

        // Item memory chestStats = _getTotalStat(
        //     chestComponents,
        //     Item(_getChestHpStat(chestComponents[0]), 0, 0, 0, 0)
        // );
        // Item memory headStats = _getTotalStat(
        //     headComponents,
        //     Item(0, _getHeadArmorStat(headComponents[0]), 0, 0, 0)
        // );
        // Item memory waistStats = _getTotalStat(
        //     waistComponents,
        //     Item(0, _getWaistArmorStat(waistComponents[0]), 0, 0, 0)
        // );
        // Item memory footStats = _getTotalStat(
        //     footComponents,
        //     Item(0, 0, 0, _getFootAgilityStat(footComponents[0]), 0)
        // );
        // Item memory handStats = _getTotalStat(
        //     handComponents,
        //     Item(0, 0, 0, 0, _getHandDexStat(handComponents[0]))
        // );

        // return
        //     Item(
        //         chestStats.hp +
        //             headStats.hp +
        //             waistStats.hp +
        //             footStats.hp +
        //             handStats.hp,
        //         chestStats.armor +
        //             headStats.armor +
        //             waistStats.armor +
        //             footStats.armor +
        //             handStats.armor,
        //         chestStats.attack +
        //             headStats.attack +
        //             waistStats.attack +
        //             footStats.attack +
        //             handStats.attack,
        //         chestStats.agility +
        //             headStats.agility +
        //             waistStats.agility +
        //             footStats.agility +
        //             handStats.agility,
        //         chestStats.dexterity +
        //             headStats.dexterity +
        //             waistStats.dexterity +
        //             footStats.dexterity +
        //             handStats.dexterity
        //     );
    }

    function _getItemStat(uint256[5] memory components, uint256 offset)
        internal
        pure
        returns (uint256)
    {
        uint256 baseStat = (components[0] + offset) % 4;
        if (components[1] > 0) {
            baseStat += components[1] % 2;
        }

        if (components[2] > 0) {
            baseStat += components[2] % 3;
        }

        if (components[4] > 0) {
            baseStat++;
        }

        return baseStat;
    }

    // function _getTotalStat(uint256[5] memory components, Item memory baseStats)
    //     internal
    //     pure
    //     returns (Item memory)
    // {
    //     Item memory suffixStats = _getSuffixBonusStats(components[1]);
    //     Item memory multipliers = _getExtraMultipliers(components);

    //     uint256 hp = suffixStats.hp == 0 ? 0 : suffixStats.hp + multipliers.hp;
    //     uint256 arm = suffixStats.armor == 0
    //         ? 0
    //         : suffixStats.armor + multipliers.armor;
    //     uint256 att = suffixStats.attack == 0
    //         ? 0
    //         : suffixStats.attack + multipliers.attack;
    //     uint256 agi = suffixStats.agility == 0
    //         ? 0
    //         : suffixStats.agility + multipliers.agility;
    //     uint256 dex = suffixStats.dexterity == 0
    //         ? 0
    //         : suffixStats.dexterity + multipliers.dexterity;

    //     return
    //         Item(
    //             baseStats.hp + hp,
    //             baseStats.armor + arm,
    //             baseStats.attack + att,
    //             baseStats.agility + agi,
    //             baseStats.dexterity + dex
    //         );
    // }

    // function _getExtraMultipliers(uint256[5] memory components)
    //     internal
    //     pure
    //     returns (Item memory)
    // {
    //     if (components[3] > 0) {
    //         return Item(2, 2, 2, 2, 2);
    //     }
    //     if (components[2] > 0) {
    //         return Item(1, 1, 1, 1, 1);
    //     }

    //     return Item(0, 0, 0, 0, 0);
    // }

    // function _getSuffixBonusStats(uint256 suffix)
    //     internal
    //     pure
    //     returns (Item memory item)
    // {
    //     // hp, armor, attack, agility, dexterity

    //     // <no suffix>          // 0
    //     if (suffix == 0) {
    //         return Item(0, 0, 0, 0, 0);
    //     }
    //     // "of Power", // 1
    //     if (suffix == 1) {
    //         return Item(0, 0, 4, 0, 0);
    //     }
    //     // "of Giants", // 2
    //     if (suffix == 2) {
    //         return Item(2, 0, 1, 0, 0);
    //     }
    //     // "of Titans", // 3
    //     if (suffix == 3) {
    //         return Item(4, 0, 1, 0, 0);
    //     }
    //     // "of Skill", // 4
    //     if (suffix == 4) {
    //         return Item(0, 0, 1, 0, 4);
    //     }
    //     // "of Perfection", // 5
    //     if (suffix == 5) {
    //         return Item(1, 1, 1, 1, 2);
    //     }
    //     // "of Brilliance", // 6
    //     if (suffix == 6) {
    //         return Item(0, 0, 2, 1, 2);
    //     }
    //     // "of Enlightenment", // 7
    //     if (suffix == 7) {
    //         return Item(0, 1, 3, 0, 0);
    //     }
    //     // "of Protection", // 8
    //     if (suffix == 8) {
    //         return Item(5, 1, 0, 0, 0);
    //     }
    //     // "of Anger", // 9
    //     if (suffix == 9) {
    //         return Item(0, 0, 4, 0, 0);
    //     }
    //     // "of Rage", // 10
    //     if (suffix == 10) {
    //         return Item(0, 0, 3, 1, 0);
    //     }
    //     // "of Fury", // 11
    //     if (suffix == 11) {
    //         return Item(0, 0, 2, 2, 0);
    //     }
    //     // "of Vitriol", // 12
    //     if (suffix == 12) {
    //         return Item(0, 0, 0, 0, 5);
    //     }
    //     // "of the Fox", // 13
    //     if (suffix == 13) {
    //         return Item(0, 0, 1, 3, 2);
    //     }
    //     // "of Detection", // 14
    //     if (suffix == 14) {
    //         return Item(0, 0, 0, 0, 6);
    //     }
    //     // "of Reflection", // 15
    //     if (suffix == 15) {
    //         return Item(0, 1, 0, 1, 0);
    //     }
    //     // "of the Twins" // 16
    //     if (suffix == 16) {
    //         return Item(0, 0, 2, 4, 0);
    //     }
    // }

    // function _getChestHpStat(uint256 component)
    //     internal
    //     pure
    //     returns (uint256)
    // {
    //     // "Divine Robe", // 0
    //     if (component == 0) {
    //         return 7;
    //     }
    //     // "Silk Robe", // 1
    //     if (component == 1) {
    //         return 2;
    //     }
    //     // "Linen Robe", // 2
    //     if (component == 2) {
    //         return 2;
    //     }
    //     // "Robe", // 3
    //     if (component == 3) {
    //         return 2;
    //     }
    //     // "Shirt", // 4
    //     if (component == 4) {
    //         return 1;
    //     }
    //     // "Demon Husk", // 5
    //     if (component == 5) {
    //         return 8;
    //     }
    //     // "Dragonskin Armor", // 6
    //     if (component == 6) {
    //         return 9;
    //     }
    //     // "Studded Leather Armor", // 7
    //     if (component == 7) {
    //         return 5;
    //     }
    //     // "Hard Leather Armor", // 8
    //     if (component == 8) {
    //         return 4;
    //     }
    //     // "Leather Armor", // 9
    //     if (component == 9) {
    //         return 3;
    //     }
    //     // "Holy Chestplate", // 10
    //     if (component == 10) {
    //         return 6;
    //     }
    //     // " ", // 11
    //     if (component == 11) {
    //         return 0;
    //     }
    //     // "Plate Mail", // 12
    //     if (component == 12) {
    //         return 7;
    //     }
    //     // "Chain Mail", // 13
    //     if (component == 13) {
    //         return 6;
    //     }
    //     // "Ring Mail" // 14
    //     if (component == 14) {
    //         return 6;
    //     }
    //     return 0;
    // }

    // function _getWeaponStats(uint256 component)
    //     internal
    //     pure
    //     returns (Item memory)
    // {
    //     // hp, armor, attack, agility, dexterity

    //     // "Warhammer", // 0
    //     if (component == 0) {
    //         return Item(0, 0, 4, 0, 0);
    //     }
    //     // "Quarterstaff", // 1
    //     if (component == 1) {
    //         return Item(0, 0, 2, 1, 1);
    //     }
    //     // "Maul", // 2
    //     if (component == 2) {
    //         return Item(0, 0, 3, 0, 1);
    //     }
    //     // "Mace", // 3
    //     if (component == 3) {
    //         return Item(0, 0, 3, 1, 0);
    //     }
    //     // "Club", // 4
    //     if (component == 4) {
    //         return Item(0, 0, 2, 1, 0);
    //     }
    //     // "Katana", // 5
    //     if (component == 5) {
    //         return Item(0, 0, 4, 0, 2);
    //     }
    //     // "Falchion", // 6
    //     if (component == 6) {
    //         return Item(0, 0, 3, 1, 1);
    //     }
    //     // "Scimitar", // 7
    //     if (component == 7) {
    //         return Item(0, 0, 3, 0, 1);
    //     }
    //     // "Long Sword", // 8
    //     if (component == 8) {
    //         return Item(0, 0, 4, 0, 1);
    //     }
    //     // "Short Sword", // 9
    //     if (component == 9) {
    //         return Item(0, 0, 3, 1, 1);
    //     }
    //     // "Ghost Wand", // 10
    //     if (component == 10) {
    //         return Item(0, 0, 3, 0, 3);
    //     }
    //     // "Grave Wand", // 11
    //     if (component == 11) {
    //         return Item(0, 0, 2, 1, 2);
    //     }
    //     // "Bone Wand", // 12
    //     if (component == 12) {
    //         return Item(0, 0, 2, 1, 0);
    //     }
    //     // "Wand", // 13
    //     if (component == 13) {
    //         return Item(0, 0, 2, 0, 1);
    //     }
    //     // "Grimoire", // 14
    //     if (component == 14) {
    //         return Item(0, 0, 3, 0, 3);
    //     }
    //     // "Chronicle", // 15
    //     if (component == 15) {
    //         return Item(0, 0, 3, 0, 1);
    //     }
    //     // "Tome", // 16
    //     if (component == 16) {
    //         return Item(0, 0, 2, 0, 0);
    //     }
    //     // "Book" // 17
    //     if (component == 17) {
    //         return Item(0, 0, 1, 0, 0);
    //     }

    //     return Item(0, 0, 1, 0, 0);
    // }

    // function _getHeadArmorStat(uint256 component)
    //     internal
    //     pure
    //     returns (uint256)
    // {
    //     // "Ancient Helm", // 0
    //     if (component == 0) {
    //         return 2;
    //     }
    //     // "Ornate Helm", // 1
    //     if (component == 1) {
    //         return 1;
    //     }
    //     // "Great Helm", // 2
    //     if (component == 2) {
    //         return 2;
    //     }
    //     // "Full Helm", // 3
    //     if (component == 3) {
    //         return 1;
    //     }
    //     // "Helm", // 4
    //     if (component == 4) {
    //         return 1;
    //     }
    //     // "Demon Crown", // 5
    //     if (component == 5) {
    //         return 2;
    //     }
    //     // "Dragon's Crown", // 6
    //     if (component == 6) {
    //         return 3;
    //     }
    //     // "War Cap", // 7
    //     if (component == 7) {
    //         return 2;
    //     }
    //     // "Leather Cap", // 8
    //     if (component == 8) {
    //         return 1;
    //     }
    //     // "Cap", // 9
    //     if (component == 9) {
    //         return 0;
    //     }
    //     // "Crown", // 10
    //     if (component == 10) {
    //         return 0;
    //     }
    //     // "Divine Hood", // 11
    //     if (component == 11) {
    //         return 2;
    //     }
    //     // "Silk Hood", // 12
    //     if (component == 12) {
    //         return 0;
    //     }
    //     // "Linen Hood", // 13
    //     if (component == 13) {
    //         return 0;
    //     }
    //     // "Hood" // 14
    //     if (component == 14) {
    //         return 0;
    //     }

    //     return 0;
    // }

    // function _getWaistArmorStat(uint256 component)
    //     public
    //     pure
    //     returns (uint256)
    // {
    //     //   "Ornate Belt", // 0
    //     if (component == 0) {
    //         return 0;
    //     }
    //     //   "War Belt", // 1
    //     if (component == 1) {
    //         return 1;
    //     }
    //     //   "Plated Belt", // 2
    //     if (component == 2) {
    //         return 1;
    //     }
    //     //   "Mesh Belt", // 3
    //     if (component == 3) {
    //         return 1;
    //     }
    //     //   "Heavy Belt", // 4
    //     if (component == 4) {
    //         return 1;
    //     }
    //     //   "Demonhide Belt", // 5
    //     if (component == 5) {
    //         return 2;
    //     }
    //     //   "Dragonskin Belt", // 6
    //     if (component == 6) {
    //         return 2;
    //     }
    //     //   "Studded Leather Belt", // 7
    //     if (component == 7) {
    //         return 1;
    //     }
    //     //   "Hard Leather Belt", // 8
    //     if (component == 8) {
    //         return 1;
    //     }
    //     //   "Leather Belt", // 9
    //     if (component == 9) {
    //         return 1;
    //     }
    //     //   "Brightsilk Sash", // 10
    //     if (component == 10) {
    //         return 0;
    //     }
    //     //   "Silk Sash", // 11
    //     if (component == 11) {
    //         return 0;
    //     }
    //     //   "Wool Sash", // 12
    //     if (component == 12) {
    //         return 0;
    //     }
    //     //   "Linen Sash", // 13
    //     if (component == 13) {
    //         return 0;
    //     }
    //     //   "Sash" // 14
    //     if (component == 14) {
    //         return 0;
    //     }

    //     return 0;
    // }

    // function _getFootAgilityStat(uint256 component)
    //     internal
    //     pure
    //     returns (uint256)
    // {
    //     // "Holy Greaves", // 0
    //     if (component == 0) {
    //         return 2;
    //     }
    //     // "Ornate Greaves", // 1
    //     if (component == 1) {
    //         return 1;
    //     }
    //     // "Greaves", // 2
    //     if (component == 2) {
    //         return 1;
    //     }
    //     // "Chain Boots", // 3
    //     if (component == 3) {
    //         return 1;
    //     }
    //     // "Heavy Boots", // 4
    //     if (component == 4) {
    //         return 1;
    //     }
    //     // "Demonhide Boots", // 5
    //     if (component == 5) {
    //         return 2;
    //     }
    //     // "Dragonskin Boots", // 6
    //     if (component == 6) {
    //         return 3;
    //     }
    //     // "Studded Leather Boots", // 7
    //     if (component == 7) {
    //         return 1;
    //     }
    //     // "Hard Leather Boots", // 8
    //     if (component == 8) {
    //         return 1;
    //     }
    //     // "Leather Boots", // 9
    //     if (component == 9) {
    //         return 1;
    //     }
    //     // "Divine Slippers", // 10
    //     if (component == 10) {
    //         return 1;
    //     }
    //     // "Silk Slippers", // 11
    //     if (component == 11) {
    //         return 0;
    //     }
    //     // "Wool Shoes", // 12
    //     if (component == 12) {
    //         return 0;
    //     }
    //     // "Linen Shoes", // 13
    //     if (component == 13) {
    //         return 0;
    //     }
    //     // "Shoes" // 14
    //     if (component == 14) {
    //         return 1;
    //     }
    //     return 0;
    // }

    // function _getHandDexStat(uint256 component)
    //     internal
    //     pure
    //     returns (uint256)
    // {
    //     // "Holy Gauntlets", // 0
    //     if (component == 0) {
    //         return 2;
    //     }
    //     // "Ornate Gauntlets", // 1
    //     if (component == 1) {
    //         return 1;
    //     }
    //     // "Gauntlets", // 2
    //     if (component == 2) {
    //         return 1;
    //     }
    //     // "Chain Gloves", // 3
    //     if (component == 3) {
    //         return 2;
    //     }
    //     // "Heavy Gloves", // 4
    //     if (component == 4) {
    //         return 2;
    //     }
    //     // "Demon's Hands", // 5
    //     if (component == 5) {
    //         return 3;
    //     }
    //     // "Dragonskin Gloves", // 6
    //     if (component == 6) {
    //         return 4;
    //     }
    //     // "Studded Leather Gloves", // 7
    //     if (component == 7) {
    //         return 2;
    //     }
    //     // "Hard Leather Gloves", // 8
    //     if (component == 8) {
    //         return 1;
    //     }
    //     // "Leather Gloves", // 9
    //     if (component == 9) {
    //         return 1;
    //     }
    //     // "Divine Gloves", // 10
    //     if (component == 10) {
    //         return 2;
    //     }
    //     // "Silk Gloves", // 11
    //     if (component == 11) {
    //         return 1;
    //     }
    //     // "Wool Gloves", // 12
    //     if (component == 12) {
    //         return 0;
    //     }
    //     // "Linen Gloves", // 13
    //     if (component == 13) {
    //         return 1;
    //     }
    //     // "Gloves" // 14
    //     if (component == 14) {
    //         return 1;
    //     }

    //     return 0;
    // }
}
