import { PrismaClient } from "@prisma/client";
import Cors from "cors";

const prisma = new PrismaClient();
const cors = Cors({ methods: ["GET"], origin: "*" });

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

  if (req.method === "GET") {
    const { Dept, Sect, Pos } = req.query; 
    try {
      const users = await prisma.$queryRaw`EXEC dbo.GET_Users_Sec_Position @Dept = ${Dept} , @Sect = ${Sect}, @Pos = ${Pos}`;
      const userList = Array.isArray(users) ? users : [];
      res.status(200).json(userList);
    } catch (error) {
      console.error("User By Dept API GET  Error:", error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}