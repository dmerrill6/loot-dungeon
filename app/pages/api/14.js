// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export default function handler(req, res) {
  res.status(200).json({
    name: 'Dragon card',
    description:
      'Extremely rare drop given to someone who defeated a Fire Dragon.',
    image: 'https://lootdungeon.app/items/14',
  })
}
