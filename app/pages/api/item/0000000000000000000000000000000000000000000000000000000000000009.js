// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export default function handler(req, res) {
  res.status(200).json({
    name: 'Succubus wings',
    description:
      'When the Succubus dropped dead on the floor, and the warrior saw her bat-like wings, he was finally broken out of her charm. This item was given to someone who defeated a Succubus.',
    image: 'https://lootdungeon.app/items/9.png',
  })
}
