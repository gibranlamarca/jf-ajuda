import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

const SEED_DATA = [
  {
    title: 'Família sem água potável há 3 dias',
    description:
      'Somos 5 pessoas, incluindo 2 crianças pequenas e uma idosa. Estamos sem água potável desde a quinta-feira. Precisamos urgentemente de galões de água ou orientação de como acessar o caminhão pipa.',
    helpTypes: JSON.stringify(['Água']),
    urgency: 5,
    neighborhood: 'Cascatinha',
    lat: -21.7741,
    lng: -43.336,
    addressLabel: 'Rua dos Ipês, 120 — Cascatinha, Juiz de Fora, MG',
    contactName: 'Maria',
    contactPhone: '(32) 98765-4321',
    status: 'OPEN',
    resolutionTokenHash: hashToken('demo-token-001'),
  },
  {
    title: 'Abrigo improvisado precisa de voluntários e mantimentos',
    description:
      'Estamos acolhendo cerca de 40 famílias desabrigadas na Escola Municipal Santos Dumont. Precisamos de voluntários para organização, alimentos não-perecíveis, roupas e colchões. Aceitamos qualquer ajuda.',
    helpTypes: JSON.stringify(['Abrigo', 'Voluntários', 'Alimentos', 'Roupas']),
    urgency: 5,
    neighborhood: 'São Mateus',
    lat: -21.748,
    lng: -43.385,
    addressLabel: 'Rua Pedro II, 450 — São Mateus, Juiz de Fora, MG',
    contactName: 'Carlos Coordenador',
    contactPhone: '(32) 99001-1234',
    status: 'OPEN',
    resolutionTokenHash: hashToken('demo-token-002'),
  },
  {
    title: 'Idosa de 78 anos sozinha precisa de alimentos e remédios',
    description:
      'Minha vizinha, Dona Conceição, está sozinha e não consegue sair de casa. Ela usa remédios para pressão e diabetes que estão acabando. Precisa de alimentos básicos e dos remédios Losartana e Metformina.',
    helpTypes: JSON.stringify(['Alimentos', 'Remédios']),
    urgency: 4,
    neighborhood: 'Centro',
    lat: -21.762,
    lng: -43.3505,
    addressLabel: 'Rua Halfeld, 800 — Centro, Juiz de Fora, MG',
    contactName: 'João (vizinho)',
    contactPhone: '(32) 98888-0001',
    status: 'OPEN',
    resolutionTokenHash: hashToken('demo-token-003'),
  },
  {
    title: 'Cão ferido na via pública precisa de resgate',
    description:
      'Um cão de porte médio está ferido na calçada em frente ao mercado. Aparenta ter levado uma pancada. Está deitado e não consegue se mover. Alguém com condições de levá-lo a um veterinário?',
    helpTypes: JSON.stringify(['Resgate', 'Ração para animais']),
    urgency: 3,
    neighborhood: 'Santa Luzia',
    lat: -21.7535,
    lng: -43.3715,
    addressLabel: 'Av. Brasil, 1200 — Santa Luzia, Juiz de Fora, MG',
    contactName: null,
    contactPhone: null,
    status: 'OPEN',
    resolutionTokenHash: hashToken('demo-token-004'),
  },
  {
    title: 'Família de 6 pessoas precisa de roupas e higiene',
    description:
      'Perdemos tudo no alagamento. Precisamos de roupas (adultos tam. M e GG, crianças 4 e 7 anos), calçados e produtos de higiene básica (sabonete, pasta de dente, fraldas tamanho G).',
    helpTypes: JSON.stringify(['Roupas', 'Higiene']),
    urgency: 2,
    neighborhood: 'Benfica',
    lat: -21.7812,
    lng: -43.369,
    addressLabel: 'Rua Floriano Peixoto, 320 — Benfica, Juiz de Fora, MG',
    contactName: 'Ana Paula',
    contactPhone: '(32) 97777-5555',
    status: 'OPEN',
    resolutionTokenHash: hashToken('demo-token-005'),
  },
  {
    title: 'Voluntários necessários para limpeza pós-enchente',
    description:
      'Precisamos de voluntários para ajudar na limpeza de casas afetadas pela enchente no bairro. Traga luvas, botas e materiais de limpeza se puder. Trabalho a partir das 7h. Coordenação no ponto de encontro na praça central.',
    helpTypes: JSON.stringify(['Voluntários']),
    urgency: 3,
    neighborhood: 'Floresta',
    lat: -21.7722,
    lng: -43.359,
    addressLabel: 'Praça da Floresta — Floresta, Juiz de Fora, MG',
    contactName: 'Defesa Civil JF',
    contactPhone: '(32) 3690-7000',
    status: 'OPEN',
    resolutionTokenHash: hashToken('demo-token-006'),
  },
  {
    title: 'Ponto de distribuição de remédios e higiene montado',
    description:
      'Montamos um ponto de distribuição de medicamentos básicos e kits de higiene para famílias afetadas. Precisamos de mais doações de remédios para dor/febre (paracetamol, dipirona) e álcool em gel.',
    helpTypes: JSON.stringify(['Remédios', 'Higiene']),
    urgency: 4,
    neighborhood: 'Mariano Procópio',
    lat: -21.785,
    lng: -43.383,
    addressLabel: 'Rua Mariano Procópio, 50 — Mariano Procópio, Juiz de Fora, MG',
    contactName: 'Grupo Voluntários JF',
    contactPhone: '(32) 99123-4567',
    status: 'OPEN',
    resolutionTokenHash: hashToken('demo-token-007'),
  },
  {
    title: 'Casa alagada — família resgatada com sucesso!',
    description:
      'A família foi resgatada pela Defesa Civil na manhã de hoje. Todos estão bem e foram encaminhados ao abrigo na Escola Santos Dumont. Muito obrigado a todos que ajudaram!',
    helpTypes: JSON.stringify(['Resgate', 'Abrigo']),
    urgency: 5,
    neighborhood: 'Grama',
    lat: -21.7462,
    lng: -43.36,
    addressLabel: 'Rua do Grama, 88 — Grama, Juiz de Fora, MG',
    contactName: null,
    contactPhone: null,
    status: 'RESOLVED',
    resolutionTokenHash: hashToken('demo-token-008'),
    resolvedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    resolvedByMethod: 'TOKEN',
    resolvedReason: 'Família resgatada pela Defesa Civil.',
  },
]

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data
  await prisma.report.deleteMany()
  await prisma.confirmation.deleteMany()
  await prisma.request.deleteMany()

  for (const item of SEED_DATA) {
    const created = await prisma.request.create({ data: item })
    console.log(`  ✓ Created: "${created.title.slice(0, 50)}..."`)
  }

  console.log(`\n✅ Seeded ${SEED_DATA.length} requests.`)
  console.log('\nDemo resolution tokens (for testing):')
  SEED_DATA.slice(0, 7).forEach((item, i) => {
    console.log(`  Request ${i + 1}: demo-token-00${i + 1}`)
  })
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
