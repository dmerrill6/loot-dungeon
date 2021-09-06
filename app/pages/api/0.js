// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export default function handler(req, res) {
  res.status(200).json({
    name: 'Genesis Card',
    description:
      'Rare commemorative card generated during the creation of Loot Dungeon. Only five were created.',
    image: 'https://lootdungeon.app/items/0',
  })
}
