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
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { empId } = req.body;

  console.log("Received empId:", empId);

  if (!empId) {
    return res.status(400).json({ message: 'Employee ID is required in the request body' });
  }

  try {
    const accessList = await prisma.$queryRaw`SELECT * FROM dbo.getRoleAccess(${empId})`;
    // console.log("Access List:", accessList);
    res.status(200).json(accessList); 
  } catch (error) {
    console.error("Error fetching user access:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}