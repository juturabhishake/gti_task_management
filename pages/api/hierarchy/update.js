import { PrismaClient } from "@prisma/client";
import Cors from 'cors';

const prisma = new PrismaClient();
const cors = Cors({ methods: ['POST', 'GET', 'HEAD'], origin: "*", credentials: true });

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => result instanceof Error ? reject(result) : resolve(result));
  });
}

export default async function handler(req, res) {
  await runMiddleware(req, res, cors);

  if (req.method === "POST") {
    const { action, type, id, name } = req.body;
    try {
      const parsedId = parseInt(id) || 0;
      const escapedName = name ? name.replace(/'/g, "''") : '';
      
      const rawResult = await prisma.$queryRawUnsafe(`
        EXEC dbo.SP_Update_Delete_Hierarchy 
          @Action = '${action}', 
          @Type = '${type}', 
          @Id = ${parsedId}, 
          @Name = N'${escapedName}'
      `);

      if (rawResult && rawResult[0] && rawResult[0].Status === 'Success') {
        return res.status(200).json({ message: 'Success' });
      } else {
        return res.status(400).json({ message: rawResult?.[0]?.Message || 'Failed to process' });
      }
    } catch (error) {
      return res.status(500).json({ message: 'Internal Execution Failure', error: error.message });
    }
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}