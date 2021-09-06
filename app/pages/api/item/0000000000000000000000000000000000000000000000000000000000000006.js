// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export default function handler(req, res) {
  res.status(200).json({
    name: 'Skeleton card',
    description: 'Rare drop given to someone who defeated a Skeleton Warrior.',
    image: 'https://lootdungeon.app/items/6.png',
  })
}
