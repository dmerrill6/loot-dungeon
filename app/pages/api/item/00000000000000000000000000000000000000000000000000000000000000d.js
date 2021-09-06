// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export default function handler(req, res) {
  res.status(200).json({
    name: 'Dragon eye',
    description:
      'Dragon eyes are one of the most valuable items in existence. Not only they are beautiful to look at, but they have unrivalled healing properties and are extremely scarce. This item was given to someone who defeated a Fire Dragon.',
    image: 'https://lootdungeon.app/items/13.png',
  })
}
