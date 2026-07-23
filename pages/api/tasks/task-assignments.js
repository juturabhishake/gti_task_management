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
    // const { subcategoryId, assignedUserId, actualHours, statusId, reason } = req.body;
    const { subcategoryId, assignedUserId, actualHours, statusId, reason, taskDetails, workDate, dueDate, severity, targetStandardHours, progressPct } = req.body;
    try {
      const parsedSubcategoryId = parseInt(subcategoryId) || 0;
      const parsedAssignedUserId = parseInt(assignedUserId) || 0;
      const parsedActualHours = parseFloat(actualHours) || 0;
      const parsedStatusId = parseInt(statusId) || 0;
      const parsedTargetStandardHours = parseFloat(targetStandardHours) || 0;
      const escapedReason = (reason || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const escapedDetails = (taskDetails || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const escapedSeverity = (severity || '').replace(/'/g, "''");
      const escapedWorkDate = workDate ? workDate : '';
      const escapedDueDate = dueDate ? dueDate : '';
      const parsedProgressPct = parseInt(progressPct) || 0;
      // let xmlBuilder = `<TaskAssignment>`;
      // xmlBuilder += `<SubcategoryId>${parsedSubcategoryId}</SubcategoryId>`;
      // xmlBuilder += `<AssignedUserId>${parsedAssignedUserId}</AssignedUserId>`;
      // xmlBuilder += `<ActualHours>${parsedActualHours}</ActualHours>`;
      // xmlBuilder += `<StatusId>${parsedStatusId}</StatusId>`;
      // xmlBuilder += `<Reason>${escapedReason}</Reason>`;
      // xmlBuilder += `</TaskAssignment>`;
      let xmlBuilder = `<TaskAssignment>`;
      xmlBuilder += `<SubcategoryId>${parsedSubcategoryId}</SubcategoryId>`;
      xmlBuilder += `<AssignedUserId>${parsedAssignedUserId}</AssignedUserId>`;
      xmlBuilder += `<ActualHours>${parsedActualHours}</ActualHours>`;
      xmlBuilder += `<StatusId>${parsedStatusId}</StatusId>`;
      xmlBuilder += `<Reason>${escapedReason}</Reason>`;
      xmlBuilder += `<TaskDetails>${escapedDetails}</TaskDetails>`;
      xmlBuilder += `<WorkDate>${escapedWorkDate}</WorkDate>`;
      xmlBuilder += `<DueDate>${escapedDueDate}</DueDate>`;
      xmlBuilder += `<Severity>${escapedSeverity}</Severity>`;
      xmlBuilder += `<TargetStandardHours>${parsedTargetStandardHours}</TargetStandardHours>`;
      xmlBuilder += `<ProgressPct>${parsedProgressPct}</ProgressPct>`;
      xmlBuilder += `</TaskAssignment>`;

      const escapedXml = xmlBuilder.replace(/'/g, "''");
      const rawResult = await prisma.$queryRawUnsafe(
        `EXEC dbo.SP_Save_Task_Assignment_XML @xmlData = N'${escapedXml}'`
      );

      const resultStatus = rawResult?.[0]?.Status;
      if (resultStatus === 'Success') {
        return res.status(200).json({ message: 'Success' });
      } else {
        return res.status(400).json({ message: rawResult?.[0]?.Message || 'Failed to process assignment' });
      }
    } catch (error) {
      return res.status(500).json({ message: 'Internal Execution Failure', error: error.message });
    }
  } else if (req.method === "GET") {
    // const { action, page = 1, size = 100, search = '', subcategoryId, teamId, employeeId } = req.query;
    const { action, page = 1, size = 100, search = '', subcategoryId, teamId, employeeId, startDate, endDate } = req.query;
    try {
      if (action === 'list') {
        const parsedPage = parseInt(page) || 1;
        const parsedSize = parseInt(size) || 100;
        const escapedSearch = search.replace(/'/g, "''");
        const escapedEmployeeId = (req.query.employeeId || '').replace(/'/g, "''");
        const escapedStartDate = startDate ? `'${startDate.replace(/'/g, "''")}'` : 'NULL';
        const escapedEndDate = endDate ? `'${endDate.replace(/'/g, "''")}'` : 'NULL';
        const isUnassignedViewVal = parseInt(req.query.isUnassignedView) || 0;
        const escapedLoggedInEmployeeId = (req.query.loggedInEmployeeId || '').replace(/'/g, "''");
        const escapedTeamIds = (req.query.teamIds || '').replace(/'/g, "''");
        const results = await prisma.$queryRawUnsafe(
          `EXEC dbo.SP_Get_Task_Assignments_Paged 
            @PageNumber = ${parsedPage}, 
            @PageSize = ${parsedSize}, 
            @SearchTerm = N'${escapedSearch}',
            @EmployeeId = '${escapedEmployeeId}',
            @StartDate = ${escapedStartDate},
            @EndDate = ${escapedEndDate},
            @IsUnassignedView = ${isUnassignedViewVal},
            @TeamIds = '${escapedTeamIds}',
            @LoggedInEmployeeId = '${escapedLoggedInEmployeeId}'`
        );
        return res.status(200).json({ data: results });
      } else if (action === 'single') {
        const parsedSubcategoryId = parseInt(subcategoryId) || 0;
        const results = await prisma.$queryRawUnsafe(
          `EXEC dbo.SP_Get_Single_Task_Assignment @SubcategoryId = ${parsedSubcategoryId}`
        );
        return res.status(200).json({ data: results?.[0] || null });
      } else if (action === 'usersByTeam') {
        const parsedTeamId = parseInt(teamId) || 0;
        const results = await prisma.$queryRawUnsafe(
          `EXEC dbo.SP_Get_Users_By_Team @TeamId = ${parsedTeamId}`
        );
        return res.status(200).json({ data: results });
      } else if (action === 'verifyUser') {
        const parsedTeamId = parseInt(teamId) || 0;
        const escapedEmployeeId = (employeeId || '').replace(/'/g, "''");
        const results = await prisma.$queryRawUnsafe(
          `EXEC dbo.SP_Verify_User_Team_Mapping 
            @EmployeeId = '${escapedEmployeeId}', 
            @TeamId = ${parsedTeamId}`
        );
        return res.status(200).json({ isMapped: results?.[0]?.IsMapped === 1 });
      } else if (action === 'statuses') {
        const results = await prisma.$queryRawUnsafe(
          `EXEC dbo.SP_Get_Task_Statuses`
        );
        return res.status(200).json({ data: results });
      } else {
        return res.status(400).json({ message: 'Invalid action parameter' });
      }
    } catch (error) {
      return res.status(500).json({ message: 'Execution Failure', error: error.message });
    }
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}