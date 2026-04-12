const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    try {
        console.log("Checking conversas...");
        const conversas = await prisma.conversa.findMany({ 
            include: { mensagens: true, etiquetas: true },
            take: 1
        });
        if (conversas.length > 0) {
            console.log("Found:", conversas[0].id);
        } else {
            console.log("No conversas.");
        }
    } catch(e) {
        console.error(e);
    }
}
run();
