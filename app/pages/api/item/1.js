// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export default function handler(req, res) {
  res.status(200).json({
    name: 'Escape Card',
    description:
      '"He who fights and runs away, lives to fight another day.". Hey, there is no shame in surviving for another battle! This card was given away to a warrior who escaped from a battle.',
    image: 'https://lootdungeon.app/items/1',
  })
}
