// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export default function handler(req, res) {
  res.status(200).json({
    name: 'Rat card',
    description: 'Rare drop given to someone who defeated a Sewer Rat.',
    image: 'https://lootdungeon.app/items/4',
  })
}
