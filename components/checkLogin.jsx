import SecureLS from "secure-ls";
const ls = new SecureLS({ encodingType: "aes" });

export const checkLogin = async (employeeId, password) => {
  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId, password }),
    });

    const data = await res.json();

    if (res.ok && data.message === "Login Success") {
      ls.set("employee_id", data.data.EmployeeId);
      ls.set("full_name", data.data.Username);
      ls.set("password", password);

      console.log("Employee ID:", data.data.EmployeeId);
      console.log("Full Name:", data.data.Username);
    } else {
      console.error("Login failed:", data.message);
      window.location.href = "/";
      throw new Error();
    }
  } catch {
    console.error("Login failed");
  }
};
