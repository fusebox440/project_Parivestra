const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const brand = await prisma.brand.create({
    data: {
      name: 'GlowUp Cosmetics',
      website: 'glowup.in',
      competitors: ['Nykaa', 'Mamaearth', 'Plum'],
    },
  });

  const campaign = await prisma.campaign.create({
    data: {
      brandId: brand.id,
      name: 'GlowUp Monsoon Campaign',
      briefText: 'Create a 30-60 second reel showcasing GlowUp moisturizer. Must mention \'GlowUp\' and \'monsoon glow\'. No competitor mentions.',
      platforms: ['INSTAGRAM'],
      startDate: new Date(),
      endDate: new Date(new Date().setDate(new Date().getDate() + 30)),
      status: 'ACTIVE',
      keywordsMustMention: ['GlowUp', 'monsoon glow'],
      keywordsForbidden: ['Nykaa', 'Mamaearth', 'Plum'],
      requiredAspectRatio: '9:16',
      minDurationSecs: 30,
      maxDurationSecs: 60,
    },
  });

  const creator1 = await prisma.creator.create({
    data: {
      name: 'Priya Sharma',
      phone: '+919876543210',
      instagramHandle: 'priya.creates',
    },
  });

  const creator2 = await prisma.creator.create({
    data: {
      name: 'Rohan Verma',
      phone: '+919812345678',
      instagramHandle: 'rohan.vibes',
    },
  });

  await prisma.deliverable.create({
    data: {
      campaignId: campaign.id,
      creatorId: creator1.id,
      platform: 'INSTAGRAM',
      format: 'REEL',
      status: 'PENDING',
      dueDate: new Date(new Date().setDate(new Date().getDate() + 7)),
    },
  });

  await prisma.deliverable.create({
    data: {
      campaignId: campaign.id,
      creatorId: creator2.id,
      platform: 'INSTAGRAM',
      format: 'REEL',
      status: 'PENDING',
      dueDate: new Date(new Date().setDate(new Date().getDate() + 7)),
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
