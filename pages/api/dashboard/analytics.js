import { PrismaClient } from "@prisma/client";
import Cors from "cors";

const prisma = new PrismaClient();
const cors = Cors({ methods: ["POST"], origin: "*" });

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

export default async function handler(req, res) {
  await runMiddleware(req, res, cors);

  if (req.method === "POST") {
    try {
      const xml = req.body;
      const startDate = xml.split('<StartDate>')[1]?.split('</StartDate>')[0] || '';
      const endDate = xml.split('<EndDate>')[1]?.split('</EndDate>')[0] || '';

      const xmlPayload = `<Request><StartDate>${startDate}</StartDate><EndDate>${endDate}</EndDate></Request>`;
      
      const result = await prisma.$queryRawUnsafe(
        `EXEC [dbo].[SP_GetCalibrationDashboard_XML] @xmlData = '${xmlPayload}'`
      );
      const labsResult = await prisma.$queryRawUnsafe(
        `EXEC [dbo].[SP_GetCalibrationLabReport_XML] @xmlData = '${xmlPayload}'`
      );
      
      const extCalibrationLabs = labsResult.map(row => ({
        LabName: row.LabName,
        CertifiedOn: row.CertifiedOn,
        ValidUntil: row.ValidUntil
      }));
      const safeResult = result.map(row => ({
        Section: row.Section,
        Label: row.Label,
        Val1: typeof row.Val1 === 'bigint' ? Number(row.Val1) : row.Val1,
        Val2: typeof row.Val2 === 'bigint' ? Number(row.Val2) : row.Val2,
        Val3: typeof row.Val3 === 'bigint' ? Number(row.Val3) : row.Val3,
      }));

      const summaryRow = safeResult.find(r => r.Section === 'Summary') || { Val1: 0, Val2: 0, Val3: 0 };
      const summary = { Plan: summaryRow.Val1, Pending: summaryRow.Val2, Completed: summaryRow.Val3 };

      const daily = safeResult.filter(r => r.Section === 'Daily').map(r => ({
        date: r.Label,
        Plan: r.Val1,
        Pending: r.Val2,
        Completed: r.Val3
      }));

      const calibratedBy = safeResult.filter(r => r.Section === 'CalibratedBy').map(r => ({
        name: r.Label,
        count: r.Val1
      }));

      res.status(200).json({ summary, daily, calibratedBy, extCalibrationLabs });

    } catch (error) {
      console.error("Dashboard API Error:", error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}