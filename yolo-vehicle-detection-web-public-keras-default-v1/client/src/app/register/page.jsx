"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ax from "../../../config/ax";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      // ส่ง request ด้วย axios โดยส่ง formData โดยตรง
      const res = await ax.post("/api/user", {
        data: formData, // ส่ง object { data: { name, email, password } } โดยไม่ต้อง JSON.stringify
      });

      // axios จะ return data ใน res.data โดยอัตโนมัติ ไม่ต้องใช้ .json()
      const data = res.data;

      // ตรวจสอบ status code (axios throw error อัตโนมัติถ้า !ok แต่เราจะเช็คเพิ่ม)
      if (res.status >= 400) {
        throw new Error(
          data.message || "การสมัครเข้าใช้งานเกิดข้อผิดพลบางอย่าง"
        );
      }

      setSuccess("สมัครเข้าใช้งานสำเร็จ...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      // จัดการ error จาก axios
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "An error occurred during registration";
      setError(errorMessage);
      console.error("Registration error:", err);
    }
  };

  return (
    <div className="font-sans text-gray-900 antialiased">
      <div className="min-h-screen flex flex-col sm:justify-center items-center pt-6 sm:pt-0 bg-[#f8f4f3] relative overflow-hidden">
        <div className="z-10">
          <a href="/">
            <h2 className="font-bold text-3xl">
              CAR{" "}
              <span className="bg-[#FF8295] text-white px-2 rounded-md">
                TALLY
              </span>
            </h2>
          </a>
        </div>

        <div className="w-full sm:max-w-md mt-6 px-6 py-4 bg-white shadow-md overflow-hidden sm:rounded-lg animate-slideIn z-10">
          <form onSubmit={handleRegister}>
            <div className="py-8 text-center">
              <span className="text-2xl font-semibold">สมัครเข้าใช้งาน</span>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}
            {success && <p className="text-green-500 text-sm">{success}</p>}

            <div>
              <label className="block font-medium text-sm text-gray-700">
                ชื่อ
              </label>
              <input
                type="text"
                name="name"
                placeholder="ชื่อ"
                value={formData.name}
                onChange={handleChange}
                className="w-full rounded-md py-2.5 px-4 border text-sm outline-[#FF8295]"
                required
              />
            </div>

            <div className="mt-4">
              <label className="block font-medium text-sm text-gray-700">
                อีเมล
              </label>
              <input
                type="email"
                name="email"
                placeholder="อีเมล"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-md py-2.5 px-4 border text-sm outline-[#FF8295]"
                required
              />
            </div>

            <div className="mt-4">
              <label className="block font-medium text-sm text-gray-700">
                รหัสผ่าน
              </label>
              <input
                type="password"
                name="password"
                placeholder="รหัสผ่าน"
                value={formData.password}
                onChange={handleChange}
                className="w-full rounded-md py-2.5 px-4 border text-sm outline-[#FF8295]"
                required
              />
            </div>

            <div className="flex items-center justify-end mt-4">
              <button
                type="submit"
                className="ml-4 px-4 py-2 bg-[#FF8295] border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-[#FF6A7F] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150"
              >
                สมัครเข้าใช้งาน
              </button>
            </div>

            <div className="mt-6 text-center">
              <span className="text-sm">มีบัญชีอยู่แล้ว? </span>
              <a className="text-[#FF8295] hover:underline" href="/login">
                ลงชื่อเข้าใช้ที่นี่
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
