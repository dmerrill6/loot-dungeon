// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export default function handler(req, res) {
  res.status(200).json({
    name: 'Demon card',
    description: 'Rare drop given to someone who defeated a Demon.',
    image: 'https://lootdungeon.app/items/12',
  })
}
