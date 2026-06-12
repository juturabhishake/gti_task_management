import { PrismaClient } from "@prisma/client";
import Cors from 'cors';

const prisma = new PrismaClient();

const cors = Cors({
    methods: ['POST'],
    origin: "*",
    allowedHeaders: ['Content-Type'], 
    credentials: true, 
});

function runMiddleware(req, res, fn) {
    return new Promise((resolve, reject) => {
        fn(req, res, (result) => {
            if (result instanceof Error) return reject(result);
            return resolve(result);
        });
    });
}

function encodePasswordToBase64(password) {
    const encDataByte = new TextEncoder().encode(password);
    return btoa(String.fromCharCode(...encDataByte));
}

export default async function handler(req, res) {
    await runMiddleware(req, res, cors);

    if (req.method === "POST") {
        const { employeeId, fullName, password, confirmPassword } = req.body;

        if (!employeeId || !fullName || !password || !confirmPassword) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match" });
        }

        try {
            const encryptedPassword = encodePasswordToBase64(password);

            const result = await prisma.$queryRaw`
                DECLARE @message NVARCHAR(100);
                EXEC SP_Signup 
                    @employee_id = ${employeeId}, 
                    @full_name = ${fullName}, 
                    @password = ${encryptedPassword}, 
                    @message = @message OUTPUT;
                SELECT @message AS Message;
            `;

            const message = result[0]?.Message;
            if (message === "Signup Success") {
                return res.status(200).json({ message });
            } else {
                return res.status(400).json({ message });
            }
        } catch (error) {
            return res.status(500).json({ message: "Internal Server Error", error: error.message });
        }
    } else {
        return res.status(405).json({ message: "Method not allowed" });
    }
}
