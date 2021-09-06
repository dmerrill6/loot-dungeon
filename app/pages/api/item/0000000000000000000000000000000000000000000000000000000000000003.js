// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export default function handler(req, res) {
  res.status(200).json({
    name: 'Rat meat',
    description:
      'Not very tasty, not easy to chew. It can get you through the day though. This item was given to someone who defeated a Sewer Rat.',
    image: 'https://lootdungeon.app/items/3.png',
  })
}
