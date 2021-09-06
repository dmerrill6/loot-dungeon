// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export default function handler(req, res) {
  res.status(200).json({
    name: 'Ferryman Card',
    description:
      'Bribing the ferryman is an expensive task! At least you have this NFT to show for it. This card was given to someone who died in battle and was brought back to life.',
    image: 'https://lootdungeon.app/items/2.png',
  })
}
