// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export default function handler(req, res) {
  res.status(200).json({
    name: 'Minotaur horns',
    description:
      'A minotaur most sacred possession. Beautiful to watch and solid as diamonds. Wonder how much they go for in the secondary market. This item was given to someone who defeated a minotaur.',
    image: 'https://lootdungeon.app/items/7',
  })
}
