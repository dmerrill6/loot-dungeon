export interface Monster {
  name: string
  description: string
  id: number
  stats: number[]
  initialCount: number
}

const monsters: { [key: string]: Monster } = {
  rat: {
    id: 1,
    name: 'Sewer Rat',
    description:
      'Most common monster found in the dungeon. Every warrior should be able to defeat them easily.',
    stats: [10, 0, 5, 4, 3],
    initialCount: 2000,
  },
  skeleton: {
    id: 2,
    name: 'Skeleton Warrior',
    description:
      'Dead soldiers that continued fighting after they died. They are not as strong as they were though...',
    stats: [12, 1, 7, 4, 2],
    initialCount: 1000,
  },
  minotaur: {
    id: 3,
    name: 'Minotaur Archer',
    description:
      'Sturdy mythical creatures. Balanced stats, formidable opponents. Their horns are very sought after.',
    stats: [16, 2, 10, 7, 7],
    initialCount: 700,
  },
  succubus: {
    id: 4,
    name: 'Succubus',
    description:
      "Charming creatures. Somehow they manage to convince their opponents to miss on purpose. Their attacks can hit really hard, and if attacked they don't survive too many hits.",
    stats: [10, 2, 20, 12, 5],
    initialCount: 350,
  },
  demon: {
    id: 5,
    name: 'Demon',
    description:
      'Hard to find creatures that are very strong and scary. Although their attacks are weaker than a Succubus hit, Demons almost never miss a hit.',
    stats: [15, 4, 15, 5, 20],
    initialCount: 100,
  },
  dragon: {
    id: 6,
    name: 'Fire Dragon',
    description:
      'The rarest of the monsters. These dragons throw fireballs that can kill some warriors in one hit. They are also the most sturdy of the monsters in the dungeon. Oracles say a lucky warrior will defeat a Fire Dragon one day by dodging all of their fireballs.',
    stats: [30, 5, 25, 0, 0],
    initialCount: 50,
  },
}

export default monsters
