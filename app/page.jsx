"use client";
import React, { useState } from "react";
import SecureLS from "secure-ls";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const employeeId = e.target.employeeId.value.trim();
    const password = e.target.password.value.trim();
    const DB = "GTI_PM";
    setLoading(true);
    setStatus("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, password ,DB}),
      });

      const data = await res.json();

      if (res.ok && data.message === "Login Success") {
          try {
            const ls = new SecureLS({ encodingType: "aes" });
            ls.set("employee_id", data.data.EmployeeId);
            ls.set("full_name", data.data.Username);
            ls.set("password", password);
            ls.set("role", data.data.Position);
            ls.set("department", data.data.department);
          } catch (err) {
            console.error("Error in SecureLS:", err);
          }
          // alert("Login Successful! Redirecting...",ls.get("employee_id"), ls.get("full_name"), ls.get("role"), ls.get("department"));
          setStatus("success");

          setTimeout(() => {
              window.location.href = "/dashboard";
          }, 3000);
      }
      else {
        throw new Error();
      }
    } catch {
      setStatus("error");
      setTimeout(() => {
        setStatus("");
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden"
      style={{
        backgroundImage: "url('/loginbgR.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute inset-0 bg-white/70 backdrop-blur-sm"></div>

      <div className="relative z-10 max-w-md w-full p-8 bg-white/90 rounded-lg shadow-2xl border border-gray-200">
        <h1 className="text-3xl font-extrabold text-center text-green-600 mb-2">
          GTI
        </h1>
        <p className="text-center text-gray-600 mb-8 text-lg tracking-wide">
          Internal Audit System Login
        </p>

        <form
          className={`space-y-5 ${
            status === "error" ? "animate-shake" : ""
          }`}
          onSubmit={handleSubmit}
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Employee ID
            </label>
            <input
              name="employeeId"
              type="text"
              placeholder="Enter your Employee ID"
              className="text-black w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-green-600 focus:border-green-600 outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              name="password"
              type="password"
              placeholder="Enter your Password"
              className="text-black w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-green-600 focus:border-green-600 outline-none transition"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 flex items-center justify-center gap-2 font-semibold rounded-lg shadow-md transition text-lg cursor-pointer ${
              status === "success"
                ? "bg-green-600 text-white"
                : status === "error"
                ? "bg-red-600 text-white"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {loading && status === "" && (
              <Loader2 className="h-5 w-5 animate-spin" />
            )}
            {status === "success" && <CheckCircle2 className="h-6 w-6" />}
            {status === "error" && <XCircle className="h-6 w-6" />}
            {status === ""
              ? loading
                ? "Logging in..."
                : "Login"
              : status === "success"
              ? "Success"
              : "Invalid Credentials"}
          </button>
        </form>
      </div>

      <style jsx global>{`
        @keyframes shake {
          0% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-5px);
          }
          50% {
            transform: translateX(5px);
          }
          75% {
            transform: translateX(-5px);
          }
          100% {
            transform: translateX(0);
          }
        }
        .animate-shake {
          animation: shake 0.5s;
        }
      `}</style>
    </div>
  );
}
