import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { employeeId, password, DB } = req.body;

  console.log("Login API called with:", { employeeId, DB, password });

  if (!employeeId || !password) {
    return res.status(400).json({
      message: "EmployeeId and Password are required",
    });
  }

  try {
    console.log("STEP 1: Starting external login");

    let externalLoginSuccess = false;
    let externalData = null;

    try {
      const response = await fetch(
        "http://10.40.20.93:108/api/Login/Login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ employeeId, password, DB }),
        }
      );

      console.log("External API status:", response.status);

      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        externalData = await response.json();
      } else {
        const text = await response.text();
        console.warn("External API non-JSON response:", text);
        externalData = { message: text };
      }
     console.log(externalData);
      externalLoginSuccess = response.ok;
    } catch (err) {
      console.error("External API unreachable:", err);
    }


    if (externalLoginSuccess === true) {
      console.log("External login SUCCESS");     

      try {
       const result = await prisma.$queryRaw`  
             EXEC SP_Check_Employee_Login_EXT 
                    @employee_id = ${employeeId}, 
                    @password = ${password}, 
                    @message = NULL;
        `;
          if (result.length > 0 && !result[0]?.Message) {
                return res.status(200).json({ message: "Login Success", data: result[0] });
            } else {
                return res.status(401).json({ message: "Invalid Credentials" });
            }
        } catch (error) {
            return res.status(500).json({ message: "Internal Server Error", error: error.message });
        }    } 
        else
        {  return res.status(401).json({ message: "Invalid Credentials" }); }

      
  

  } catch (error) {
    console.error("Login API Error:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
}
