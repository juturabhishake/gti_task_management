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
    const { action, teamId, employeeId, role, sectionIds, teamIds } = req.query;

    try {
      if (action === 'unassigned') {
        const escapedRole = (role || '').replace(/'/g, "''");
        const escapedEmployeeId = (employeeId || '').replace(/'/g, "''");
        const escapedSectionIds = (sectionIds || '').replace(/'/g, "''");
        const escapedTeamIds = (teamIds || '').replace(/'/g, "''");

        const results = await prisma.$queryRawUnsafe(`
          EXEC dbo.SP_Get_Unassigned_Tasks_For_Assignment 
            @EmployeeId = '${escapedEmployeeId}',
            @Role = '${escapedRole}',
            @SectionIds = '${escapedSectionIds}',
            @TeamIds = '${escapedTeamIds}'
        `);
        return res.status(200).json({ data: results });
      } else if (action === 'filters') {
        const results = await prisma.$queryRawUnsafe(`
          EXEC dbo.SP_Get_Assignment_Filters
        `);
        return res.status(200).json({ data: results });
      } else if (action === 'usersByTeam') {
        const parsedTeamId = parseInt(teamId) || 0;
        const results = await prisma.$queryRawUnsafe(`
          EXEC dbo.SP_Get_Users_By_Team @TeamId = ${parsedTeamId}
        `);
        return res.status(200).json({ data: results });
      } else {
        return res.status(400).json({ message: 'Invalid action parameter' });
      }
    } catch (error) {
      return res.status(500).json({ message: 'Execution Failure', error: error.message });
    }
  } else if (req.method === "POST") {
    const { action, subcategoryId, assignedUserId, severity, project, workDate, dueDate, taskDetails } = req.body;
    
    try {
      if (action === 'assign') {
        const parsedSubcategoryId = parseInt(subcategoryId) || 0;
        const parsedAssignedUserId = parseInt(assignedUserId) || 0;
        const escapedSeverity = (severity || '').replace(/'/g, "''");
        const escapedProject = (project || '').replace(/'/g, "''");
        const escapedWorkDate = workDate ? `'${workDate.replace(/'/g, "''")}'` : 'NULL';
        const escapedDueDate = dueDate ? `'${dueDate.replace(/'/g, "''")}'` : 'NULL';
        const escapedDetails = (taskDetails || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, "''");

        const rawResult = await prisma.$queryRawUnsafe(`
          EXEC dbo.SP_Assign_Task_To_User 
            @SubcategoryId = ${parsedSubcategoryId},
            @AssignedUserId = ${parsedAssignedUserId},
            @Severity = N'${escapedSeverity}',
            @Project = N'${escapedProject}',
            @WorkDate = ${escapedWorkDate},
            @DueDate = ${escapedDueDate},
            @TaskDetails = N'${escapedDetails}'
        `);

        if (rawResult && rawResult[0] && rawResult[0].Status === 'Success') {
          return res.status(200).json({ message: 'Success' });
        } else {
          return res.status(400).json({ message: rawResult?.[0]?.Message || 'Failed to process assignment' });
        }
      } else {
        return res.status(400).json({ message: 'Invalid action parameter' });
      }
    } catch (error) {
      return res.status(500).json({ message: 'Internal Execution Failure', error: error.message });
    }
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}