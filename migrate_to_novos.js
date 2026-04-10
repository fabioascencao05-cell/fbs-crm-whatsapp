const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando migração de todos os leads para a etapa "Novos"...');
  const result = await prisma.conversa.updateMany({
    data: {
      status_kanban: 'Novos',
      status_bot: true
    }
  });
  console.log(`✅ Sucesso! ${result.count} leads foram movidos para "Novos" e a IA foi ativada.`);
}

main()
  .catch(e => {
    console.error('❌ Erro na migração:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
