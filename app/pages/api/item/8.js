// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export default function handler(req, res) {
  res.status(200).json({
    name: 'Minotaur card',
    description: 'Rare drop given to someone who defeated a Minotaur Archer.',
    image: 'https://lootdungeon.app/items/8',
  })
}
