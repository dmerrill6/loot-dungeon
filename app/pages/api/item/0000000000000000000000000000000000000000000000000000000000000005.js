// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export default function handler(req, res) {
  res.status(200).json({
    name: 'Skeleton bones',
    description:
      'Make sure you bury these bones so that the dead soldier can finally rest in peace. This item was given to someone who defeated a Skeleton Warrior.',
    image: 'https://lootdungeon.app/items/5.png',
  })
}
