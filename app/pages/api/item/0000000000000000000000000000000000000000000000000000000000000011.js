// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export default function handler(req, res) {
  res.status(200).json({
    name: 'Demon head',
    description:
      'When the Demon died, all of its body evaporated into thin air, leaving only its head behind. A bit disgusted and scared, the warrior took the head out of the dungeon, so as to warn the elders about this strange being. This item was given to someone who defeated a Demon.',
    image: 'https://lootdungeon.app/items/11',
  })
}
