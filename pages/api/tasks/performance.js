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

  const { action, employeeId, startDate, endDate, shiftId } = req.query;

  try {
    if (action === "shifts") {
      const results = await prisma.$queryRawUnsafe(
        `SELECT Id AS id, Name AS name FROM dbo.Shifts ORDER BY Name ASC`
      );
      return res.status(200).json({ data: results });
    }

    if (!employeeId || !startDate || !endDate) {
      return res.status(400).json({ message: "Missing required parameters" });
    }

    const escapedEmployeeId = employeeId.replace(/'/g, "''");
    const escapedStartDate = startDate.replace(/'/g, "''");
    const escapedEndDate = endDate.replace(/'/g, "''");
    const parsedShiftId = shiftId ? parseInt(shiftId) : null;
    const shiftParam = parsedShiftId ? parsedShiftId : "NULL";
    console.log("Parameters:", { escapedEmployeeId, escapedStartDate, escapedEndDate, shiftParam });
    const results = await prisma.$queryRawUnsafe(
      `EXEC dbo.SP_Get_User_Performance_Summary 
        @EmployeeId = '${escapedEmployeeId}', 
        @StartDate = '${escapedStartDate}', 
        @EndDate = '${escapedEndDate}', 
        @ShiftId = ${shiftParam}`
    );

    return res.status(200).json({ data: results });
  } catch (error) {
    return res.status(500).json({ message: "Internal Execution Failure", error: error.message });
  }
}