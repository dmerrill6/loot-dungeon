const rollDice = (maxValue) => {
  const result = Math.floor(Math.random() * maxValue) + 1;
  return result;
};

const playerStats = {
  hp: 11,
  arm: 4,
  atk: 11,
  agi: 1,
  dex: 6,
};

const rat = {
  hp: 10,
  arm: 0,
  atk: 5,
  agi: 4,
  dex: 3,
};

const skeleton = {
  hp: 12,
  arm: 1,
  atk: 7,
  agi: 4,
  dex: 2,
};

const minotaur = {
  hp: 16,
  arm: 2,
  atk: 10,
  agi: 7,
  dex: 7,
};

const succubus = {
  hp: 10,
  arm: 2,
  atk: 20,
  agi: 12,
  dex: 5,
};

const demon = {
  hp: 15,
  arm: 4,
  atk: 13,
  agi: 5,
  dex: 20,
};

const dragon = {
  hp: 30,
  arm: 5,
  atk: 25,
  agi: 0,
  dex: 0,
};

const runRound = (monsterStats) => {
  const playerRoll = rollDice(20);
  const monsterRoll = rollDice(20);

  const playerHit = playerRoll + playerStats.dex >= monsterStats.agi;
  const monsterHit = monsterRoll + monsterStats.dex >= playerStats.agi;

  let monsterDmg = 0;
  if (playerHit) {
    const atkRoll = rollDice(playerStats.atk);
    const dmg = atkRoll - monsterStats.arm;
    if (dmg > 0) monsterDmg = dmg;
  }

  let playerDmg = 0;
  if (monsterHit) {
    const atkRoll = rollDice(monsterStats.atk);
    const dmg = atkRoll - playerStats.arm;
    if (dmg > 0) playerDmg = dmg;
  }

  return { playerDmg, monsterDmg };
};

const battle = (monsterStats) => {
  let round = 0;
  let battleFinish = false;
  let currPlayerHp = playerStats.hp;
  let currMonsterHp = monsterStats.hp;
  let won = false;

  while (!battleFinish) {
    const { playerDmg, monsterDmg } = runRound(monsterStats);
    currPlayerHp -= playerDmg;
    currMonsterHp -= monsterDmg;
    round++;
    if (currPlayerHp <= 0) {
      battleFinish = true;
    } else if (currMonsterHp <= 0) {
      battleFinish = true;
      won = true;
    }

    if (round > 6) {
      battleFinish = true;
      won = true;
    }
  }

  return { won, round };
};

// Simulate a battle 100 times and record the winner
const simulate = (monster) => {
  let wins = 0;
  let losses = 0;
  let draws = 0;

  for (let i = 0; i < 100; i++) {
    const { won, round } = battle(monster);
    if (round > 6) draws++;
    if (won) wins++;
    else losses++;
  }
  console.log(`(${wins}, ${losses}, ${draws})`);
};

simulate(rat);
simulate(skeleton);
simulate(minotaur);
simulate(succubus);
simulate(demon);
simulate(dragon);
