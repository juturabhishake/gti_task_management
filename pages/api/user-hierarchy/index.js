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
    const { command, type, targetId, parentId, name, hours, userId, shiftId, groupId, deptId, sectionId, teamId } = req.body;
    
    if (command === "UPDATE" && type === "User") {
      try {
        const mapIdVal = parseInt(targetId) || 0;
        const shiftIdVal = parseInt(shiftId) || 0;
        const teamIdVal = parseInt(teamId) || 0;
        const sectionIdVal = parseInt(sectionId) || 0;
        const deptIdVal = parseInt(deptId) || 0;
        const groupIdVal = parseInt(groupId) || 0;

        const rawResult = await prisma.$queryRawUnsafe(
          `EXEC dbo.SP_Update_User_Hierarchy 
            @MapId = ${mapIdVal}, 
            @ShiftId = ${shiftIdVal}, 
            @TeamId = ${teamIdVal}, 
            @SectionId = ${sectionIdVal}, 
            @DeptId = ${deptIdVal}, 
            @GroupId = ${groupIdVal}`
        );
        
        const resultStatus = rawResult?.[0]?.Status;
        if (resultStatus === 'Success') {
          return res.status(200).json({ message: 'Success', id: mapIdVal });
        } else {
          return res.status(400).json({ message: rawResult?.[0]?.Message || 'Update validation rejected.' });
        }
      } catch (error) {
        return res.status(500).json({ message: 'Internal Execution Failure during Update', error: error.message });
      }
    }

    let xmlBuilder = `<ActionRequest>`;
    xmlBuilder += `<Command>${command || ''}</Command>`;
    xmlBuilder += `<Type>${type || ''}</Type>`;
    xmlBuilder += `<TargetId>${targetId || 0}</TargetId>`;
    xmlBuilder += `<ParentId>${parentId || 0}</ParentId>`;
    xmlBuilder += `<Name>${(name || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Name>`;
    xmlBuilder += `<Hours>${hours || 0}</Hours>`;
    xmlBuilder += `<UserId>${userId || 0}</UserId>`;
    xmlBuilder += `<ShiftId>${shiftId || 0}</ShiftId>`;
    xmlBuilder += `<GroupId>${groupId || 0}</GroupId>`;
    xmlBuilder += `<DeptId>${deptId || 0}</DeptId>`;
    xmlBuilder += `<SectionId>${sectionId || 0}</SectionId>`;
    xmlBuilder += `<TeamId>${teamId || 0}</TeamId>`;
    xmlBuilder += `</ActionRequest>`;

    try {
      const escapedXml = xmlBuilder.replace(/'/g, "''");
      const rawResult = await prisma.$queryRawUnsafe(
        `EXEC dbo.SP_Manage_Hierarchy_XML @xmlData = N'${escapedXml}'`
      );
      
      const resultStatus = rawResult?.[0]?.Status;
      if (resultStatus === 'Success') {
        return res.status(200).json({ message: 'Success', id: rawResult[0].NewId });
      } else {
        return res.status(400).json({ message: rawResult?.[0]?.Message || 'Action rejected by validation procedure' });
      }
    } catch (error) {
      return res.status(500).json({ message: 'Internal Execution Failure', error: error.message });
    }
  } else if (req.method === "GET") {
    const { action, page = 1, size = 100, search = '' } = req.query;
    try {
      if (action === 'list') {
        const escapedSearch = search.replace(/'/g, "''");
        const results = await prisma.$queryRawUnsafe(
          `EXEC dbo.SP_Get_User_Hierarchy_Paged @PageNumber=${parseInt(page)}, @PageSize=${parseInt(size)}, @SearchTerm=N'${escapedSearch}'`
        );
        return res.status(200).json({ data: results });
      } else if (action === 'options') {
        const options = await prisma.$queryRaw`EXEC SP_Get_Dropdown_Options;`;
        return res.status(200).json({ data: options });
      } else if (action === 'users') {
        const usersList = await prisma.$queryRaw`
          SELECT UserID AS id, EmployeeId AS employeeId, Username AS username, Position AS designation 
          FROM dbo.UserMaster 
          WHERE IsActive = 1
        `;
        return res.status(200).json({ data: usersList });
      } else if (action === 'shifts') {
        const shiftsList = await prisma.$queryRaw`
          SELECT Id AS id, Name AS name FROM dbo.Shifts
        `;
        return res.status(200).json({ data: shiftsList });
      } else {
        return res.status(400).json({ message: 'Invalid API action' });
      }
    } catch (error) {
      return res.status(500).json({ message: 'Execution Failure', error: error.message });
    }
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}