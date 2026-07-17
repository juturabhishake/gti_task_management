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
    // const { type, targetId, name, parentId, hours } = req.body;
    const { type, targetId, name, parentId, hours, project, maxHours, mediumHours, minHours } = req.body;
    try {
      const targetIdVal = parseInt(targetId) || 0;
      const parentIdVal = parseInt(parentId) || 0;
      const hoursVal = parseFloat(hours) || 0;
      // const escapedName = (name || '').replace(/'/g, "''");
      const maxHoursVal = parseFloat(maxHours) || 0;
      const mediumHoursVal = parseFloat(mediumHours) || 0;
      const minHoursVal = parseFloat(minHours) || 0;
      const escapedName = (name || '').replace(/'/g, "''");
      const escapedProject = (project || '').replace(/'/g, "''");

      // const rawResult = await prisma.$queryRawUnsafe(
      //   `EXEC dbo.SP_Update_Category_Subcategory 
      //     @Type = '${type}', 
      //     @TargetId = ${targetIdVal}, 
      //     @Name = N'${escapedName}', 
      //     @ParentId = ${parentIdVal}, 
      //     @Hours = ${hoursVal}`
      // );
      const rawResult = await prisma.$queryRawUnsafe(
        `EXEC dbo.SP_Update_Category_Subcategory 
          @Type = '${type}', 
          @TargetId = ${targetIdVal}, 
          @Name = N'${escapedName}', 
          @ParentId = ${parentIdVal}, 
          @Hours = ${hoursVal},
          @Project = N'${escapedProject}',
          @MaxHours = ${maxHoursVal},
          @MediumHours = ${mediumHoursVal},
          @MinHours = ${minHoursVal}`
      );

      const resultStatus = rawResult?.[0]?.Status;
      if (resultStatus === 'Success') {
        return res.status(200).json({ message: 'Success' });
      } else {
        return res.status(400).json({ message: rawResult?.[0]?.Message || 'Action rejected.' });
      }
    } catch (error) {
      return res.status(500).json({ message: 'Internal Execution Failure', error: error.message });
    }
  } else if (req.method === "GET") {
    const { type, page = 1, size = 100, search = '' } = req.query;
    const parsedPage = parseInt(page) || 1;
    const parsedSize = parseInt(size) || 100;
    const escapedSearch = search.replace(/'/g, "''");

    try {
      if (type === "Category") {
        const results = await prisma.$queryRawUnsafe(
          `EXEC dbo.SP_Get_Categories_Paged 
            @PageNumber = ${parsedPage}, 
            @PageSize = ${parsedSize}, 
            @SearchTerm = N'${escapedSearch}'`
        );
        return res.status(200).json({ data: results });
      } else if (type === "Subcategory") {
        const results = await prisma.$queryRawUnsafe(
          `EXEC dbo.SP_Get_Subcategories_Paged 
            @PageNumber = ${parsedPage}, 
            @PageSize = ${parsedSize}, 
            @SearchTerm = N'${escapedSearch}'`
        );
        return res.status(200).json({ data: results });
      } else if (type === "CategoryCatalog") {
        const results = await prisma.$queryRawUnsafe(
          `EXEC dbo.SP_Get_Categories_Catalog`
        );
        return res.status(200).json({ data: results });
      } else {
        return res.status(400).json({ message: 'Invalid parameter' });
      }
    } catch (error) {
      return res.status(500).json({ message: 'Execution Failure', error: error.message });
    }
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}