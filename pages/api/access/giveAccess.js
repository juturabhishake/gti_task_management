import { PrismaClient } from "@prisma/client";
import Cors from "cors";

const prisma = new PrismaClient();

const cors = Cors({
  methods: ["POST"],
  origin: "*",
});

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

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ message: "Invalid or missing request body" });
  }
  
  const { empId, username, modifiedBy, page_id, access } = req.body;

  console.log("Received payload:", req.body);

  if (!empId || !username || !modifiedBy || page_id === undefined || access === undefined) {
    return res.status(400).json({ message: "Missing required fields in payload" });
  }

  try {
    await prisma.$executeRaw`
      EXEC dbo.giveRoleAccess ${empId}, ${username}, ${modifiedBy}, ${page_id}, ${access}
    `;
    res.status(200).json({ message: "Role access managed successfully" });
  } catch (error) {
    console.error("Error granting access:", error);
    const errorMessage = error.message.includes("truncated")
      ? "Data size exceeds column capacity. Please check input length."
      : "An internal server error occurred.";
    res.status(500).json({ message: "Internal Server Error", error: errorMessage });
  }
}