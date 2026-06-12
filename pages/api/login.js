import { PrismaClient } from "@prisma/client";
import Cors from 'cors';

const prisma = new PrismaClient();

const cors = Cors({
    methods: ['POST', 'GET', 'HEAD'], 
    origin: "*",
    allowedHeaders: ['Content-Type'], 
    credentials: true, 
});

function runMiddleware(req, res, fn) {
    return new Promise((resolve, reject) => {
        fn(req, res, (result) => {
            if (result instanceof Error) {
                return reject(result);
            }
            return resolve(result);
        });
    });
}

function encodePasswordToBase64(password) {
    try {
        const encDataByte = new TextEncoder().encode(password);
        const encodedData = btoa(String.fromCharCode(...encDataByte));
        return encodedData;
    } catch (ex) {
        throw new Error("Error in base64Encode: " + ex.message);
    }
}
// function decodeFrom64(encodedData) {
//     const decodedData = atob(encodedData);
//     const byteNumbers = new Uint8Array(decodedData.length);
//     for (let i = 0; i < decodedData.length; i++) {
//         byteNumbers[i] = decodedData.charCodeAt(i);
//     }
//     const decodedString = new TextDecoder("utf-8").decode(byteNumbers);  
//     return decodedString;
// }
export default async function handler(req, res) {
    await runMiddleware(req, res, cors);

    if (req.method === "POST") {
        const { employeeId, password } = req.body;
        console.log("Request Body:", req.body);

        if (!employeeId || !password) {
            return res.status(400).json({ message: "Employee ID and password are required" });
        }

        try {
            const encryptedPassword = encodePasswordToBase64(password);
            console.log("Encrypted Password:", encryptedPassword);
            console.log("Employee ID:", employeeId);

            const result = await prisma.$queryRaw`
                EXEC SP_Check_Employee_Login 
                    @employee_id = ${employeeId}, 
                    @password = ${encryptedPassword}, 
                    @message = NULL;
            `;
            console.log("Query Result:", result);
            if (result.length > 0 && !result[0]?.Message) {
                return res.status(200).json({ message: "Login Success", data: result[0] });
            } else {
                return res.status(401).json({ message: "Invalid Credentials" });
            }
        } catch (error) {
            return res.status(500).json({ message: "Internal Server Error", error: error.message });
        }
    } else {
        return res.status(405).json({ message: "Method not allowed" });
    }
}

