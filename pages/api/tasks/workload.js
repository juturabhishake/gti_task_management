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

  if (req.method === "GET") {
    const { action, employeeId, role, sectionIds, teamIds, date, userId } = req.query;

    try {
      if (action === 'teams') {
        const escapedEmployeeId = (employeeId || '').replace(/'/g, "''");
        const results = await prisma.$queryRawUnsafe(`EXEC dbo.SP_Get_Teams_With_Paths @EmployeeId = '${escapedEmployeeId}'`);
        return res.status(200).json({ data: results });
      } 
      else if (action === 'filters') {
        const results = await prisma.$queryRawUnsafe(`EXEC dbo.SP_Get_Assignment_Filters`);
        return res.status(200).json({ data: results });
      }
      else if (action === 'dashboard') {
        const escapedDate = date ? `'${date.replace(/'/g, "''")}'` : 'NULL';
        const escapedTeamIds = (teamIds || '').replace(/'/g, "''");
        const p1 = prisma.$queryRawUnsafe(`EXEC dbo.SP_Get_Workload_Hours_Chart @Date = ${escapedDate}, @TeamIds = '${escapedTeamIds}'`);
        const p2 = prisma.$queryRawUnsafe(`EXEC dbo.SP_Get_Workload_Status_Chart @Date = ${escapedDate}, @TeamIds = '${escapedTeamIds}'`);
        const p3 = prisma.$queryRawUnsafe(`EXEC dbo.SP_Get_Workload_MainTable @Date = ${escapedDate}, @TeamIds = '${escapedTeamIds}'`);
        const [hoursChart, statusChart, mainTable] = await Promise.all([p1, p2, p3]);
        return res.status(200).json({ data: { hoursChart, statusChart, mainTable } });
      }
      else if (action === 'userTasks') {
        const escapedDate = date ? `'${date.replace(/'/g, "''")}'` : 'NULL';
        const parsedUserId = parseInt(userId) || 0;
        const results = await prisma.$queryRawUnsafe(`EXEC dbo.SP_Get_Workload_UserTasks @Date = ${escapedDate}, @UserId = ${parsedUserId}`);
        return res.status(200).json({ data: results });
      }
      else {
        return res.status(400).json({ message: 'Invalid action parameter' });
      }
    } catch (error) {
      return res.status(500).json({ message: 'Execution Failure', error: error.message });
    }
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}