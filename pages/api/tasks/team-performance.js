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

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { action, startDate, endDate, userIds, shiftId, teamId } = req.query;

  try {
    if (action === "shifts") {
      const results = await prisma.$queryRawUnsafe(
        `EXEC dbo.SP_Get_Shifts`
      );
      return res.status(200).json({ data: results });
    }

    if (action === "users") {
      const parsedTeamId = teamId ? parseInt(teamId) : null;
      const teamParam = parsedTeamId ? parsedTeamId : "NULL";
      const results = await prisma.$queryRawUnsafe(
        `EXEC dbo.SP_Get_Users_By_Team_Filter @TeamId = ${teamParam}`
      );
      return res.status(200).json({ data: results });
    }

    if (action === "teams") {
      const results = await prisma.$queryRawUnsafe(
        `EXEC dbo.SP_Get_Teams`
      );
      return res.status(200).json({ data: results });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Missing date range parameters" });
    }

    const escapedStartDate = startDate.replace(/'/g, "''");
    const escapedEndDate = endDate.replace(/'/g, "''");
    const userIdsParam = userIds ? `'${userIds.replace(/'/g, "''")}'` : "NULL";
    const shiftParam = shiftId ? parseInt(shiftId) : "NULL";
    const teamParam = teamId ? parseInt(teamId) : "NULL";

    const results = await prisma.$queryRawUnsafe(
      `EXEC dbo.SP_Get_Team_Performance_Summary 
        @StartDate = '${escapedStartDate}', 
        @EndDate = '${escapedEndDate}', 
        @UserIds = ${userIdsParam}, 
        @ShiftId = ${shiftParam}, 
        @TeamId = ${teamParam}`
    );

    return res.status(200).json({ data: results });
  } catch (error) {
    return res.status(500).json({ message: "Internal Execution Failure", error: error.message });
  }
}