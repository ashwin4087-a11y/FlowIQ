"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ax, { axData } from "../../../config/ax";
import Link from "next/link";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // ฟังก์ชันดึง JWT จาก cookie
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
  };

  // โหลดข้อมูลจาก localStorage และตรวจสอบ JWT
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    const savedPassword = localStorage.getItem("rememberedPassword");
    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }

    const jwt = getCookie("jwt");
    if (jwt) {
      router.push("/dashboard");
      router.refresh(); // อัปเดตสถานะเพื่อให้ middleware ทำงาน
    }
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await ax.post("/api/user/login", {
        data: { email, password },
      });

      if (res.status === 200) {
        const token = res.data.Token;
        const userEmail = res.data.email || email;

        // เก็บ JWT ใน sessionStorage
        sessionStorage.setItem("jwt", token);

        // เก็บ JWT และ email ใน cookie
        document.cookie = `jwt=${token}; path=/; SameSite=Strict; Secure`;
        document.cookie = `email=${encodeURIComponent(
          userEmail
        )}; path=/; SameSite=Strict; Secure`;

        // ถ้ากด "จดจำฉัน" เก็บข้อมูลใน localStorage
        if (rememberMe) {
          localStorage.setItem("rememberedEmail", userEmail);
          localStorage.setItem("rememberedPassword", password);
        } else {
          localStorage.removeItem("rememberedEmail");
          localStorage.removeItem("rememberedPassword");
        }

        // อัปเดต axData ด้วย JWT
        axData.jwt = token;

        // เปลี่ยนเส้นทางไปหน้า dashboard และ refresh
        router.push("/dashboard");
        router.refresh(); // บังคับให้ Next.js อัปเดตสถานะและ trigger middleware
      }
    } catch (error) {
      if (error.response && error.response.data) {
        const errorMessage = error.response.data.message;
        if (error.response.status === 401) {
          setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
        } else if (error.response.status === 400) {
          setError("กรุณากรอกข้อมูลให้ครบถ้วน");
        } else {
          setError(errorMessage || "เกิดข้อผิดพลาดในการล็อกอิน");
        }
      } else if (error.request) {
        setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่");
      } else {
        setError("เกิดข้อผิดพลาดที่ไม่คาดคิด: " + error.message);
      }
    }
  };

  return (
    <div className="font-sans text-gray-900 antialiased">
      <div className="min-h-screen flex flex-col sm:justify-center items-center pt-6 sm:pt-0 bg-[#f8f4f3] relative overflow-hidden">
        {/* รถเคลื่อนที่อยู่ติดขอบจอด้านล่าง */}
        <div className="absolute bottom-0 left-0 transform animate-carMove z-0">
          <img
            src="https://img.lovepik.com/element/40153/6500.png_1200.png"
            alt="Car"
            className="h-36"
          />
        </div>

        {/* Header */}
        <div className="z-10">
          <Link href="/">
            <h2 className="font-bold text-3xl">
              CAR{" "}
              <span className="bg-[#FF8295] text-white px-2 rounded-md">
                TALLY
              </span>
            </h2>
          </Link>
        </div>

        {/* Login Form */}
        <div className="w-full sm:max-w-md mt-6 px-6 py-4 bg-white shadow-md overflow-hidden sm:rounded-lg animate-slideIn z-10">
          {error && (
            <p className="text-red-500 text-sm text-center mb-4">{error}</p>
          )}

          <form onSubmit={handleLogin}>
            <div className="py-8 text-center">
              <span className="text-2xl font-semibold">ลงชื่อเข้าใช้</span>
            </div>

            {/* Email */}
            <div>
              <label className="block font-medium text-sm text-gray-700">
                อีเมล
              </label>
              <input
                type="email"
                name="email"
                placeholder="อีเมล"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md py-2.5 px-4 border text-sm outline-[#FF8295]"
                required
              />
            </div>

            {/* Password */}
            <div className="mt-4">
              <label className="block font-medium text-sm text-gray-700">
                รหัสผ่าน
              </label>
              <div className="relative">
                <input
                  type={passwordVisible ? "text" : "password"}
                  name="password"
                  placeholder="รหัสผ่าน"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-md py-2.5 px-4 border text-sm outline-[#FF8295]"
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-500 hover:text-gray-600"
                >
                  {passwordVisible ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="block mt-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-600">จดจำฉันไว้</span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-4">
              <Link
                className="text-sm text-gray-600 hover:text-gray-900"
                href="/password-reset"
              >
                ลืมรหัสผ่าน?
              </Link>
              <button
                type="submit"
                className="ml-4 px-4 py-2 bg-[#FF8295] rounded-md text-white font-semibold"
              >
                ลงชื่อเข้าใช้
              </button>
            </div>

            {/* Register Link */}
            <div className="mt-6 text-center">
              <span className="text-sm">ไม่มีบัญชีหรอ? </span>
              <Link className="text-[#FF8295] hover:underline" href="/register">
                สมัครสมาชิกที่นี่
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
