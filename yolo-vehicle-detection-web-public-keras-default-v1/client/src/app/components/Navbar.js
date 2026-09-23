"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ax from "../../../config/ax";

const Navbar = () => {
  const router = useRouter();
  const [jwt, setJwt] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // ฟังก์ชันดึง JWT จาก cookie
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
  };

  useEffect(() => {
    // ตรวจสอบ JWT จาก cookie
    const token = getCookie("jwt");
    setJwt(token);

    // อัปเดต jwt เมื่อ cookie เปลี่ยน (เช่น หลัง login/logout)
    const checkCookie = () => {
      const newToken = getCookie("jwt");
      if (newToken !== jwt) {
        setJwt(newToken);
      }
    };
    const interval = setInterval(checkCookie, 1000); // ตรวจทุก 1 วินาที
    return () => clearInterval(interval);
  }, [jwt]);

  const handleLogout = () => {
    // ลบ JWT ออกจาก sessionStorage (ถ้ามี)
    sessionStorage.removeItem("jwt");

    // ลบ JWT และ email ออกจาก cookie
    document.cookie =
      "jwt=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Strict; Secure";
    document.cookie =
      "email=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Strict; Secure";

    // ล้าง header Authorization ใน axios instance
    delete ax.defaults.headers.common["Authorization"];

    // อัปเดต state
    setJwt(null);

    // เปลี่ยนเส้นทางไปหน้า Login โดย force reload เพื่อให้ middleware ทำงาน
    window.location.href = "/"; // ใช้ window.location เพื่อบังคับ reload
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-30 mx-auto w-full bg-white py-4 shadow-md md:shadow-none">
      <div className="px-4 md:px-10">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex shrink-0">
            <Link href="/dashboard" className="flex items-center">
              <h2 className="font-bold text-2xl md:text-3xl text-gray-700">
                CAR{" "}
                <span className="bg-[#FF8295] text-white px-2 rounded-md">
                  TALLY
                </span>
              </h2>
            </Link>
          </div>

          {/* Hamburger Menu Button (Mobile Only) */}
          <button
            className="md:hidden text-gray-700 focus:outline-none"
            onClick={toggleMenu}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>

          {/* Navigation Links (Desktop) */}
          <div className="hidden md:flex items-center justify-end gap-3">
            <Link
              href="/vehiclehistory"
              className="text-lg font-medium text-gray-900 hover:bg-gray-100 px-2 py-1 rounded-lg"
            >
              วิดีโอย้อนหลัง
            </Link>
            <Link
              href="/analyze"
              className="text-lg font-medium text-gray-900 hover:bg-gray-100 px-2 py-1 rounded-lg"
            >
              การวิเคราะห์
            </Link>
            {jwt ? (
              <button
                className="inline-flex items-center justify-center rounded-xl bg-red-500 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-red-400"
                onClick={handleLogout}
              >
                ลงชื่อออก
              </button>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl bg-blue-500 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-blue-400"
              >
                ลงชื่อเข้าใช้
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Menu (แสดงเมื่อคลิก Hamburger) */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 flex flex-col items-start gap-3 px-4 pb-4 bg-white border-t border-gray-200">
            <Link
              href="/vehiclehistory"
              className="text-lg font-medium text-gray-900 hover:bg-gray-100 w-full px-2 py-1 rounded-lg"
              onClick={() => setIsMenuOpen(false)}
            >
              วิดีโอย้อนหลัง
            </Link>
            <Link
              href="/analyze"
              className="text-lg font-medium text-gray-900 hover:bg-gray-100 w-full px-2 py-1 rounded-lg"
              onClick={() => setIsMenuOpen(false)}
            >
              การวิเคราะห์
            </Link>
            {jwt ? (
              <button
                className="inline-flex items-center justify-center rounded-xl bg-red-500 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-red-400 w-full"
                onClick={handleLogout}
              >
                ลงชื่อออก
              </button>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl bg-blue-500 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-blue-400 w-full"
                onClick={() => setIsMenuOpen(false)}
              >
                ลงชื่อเข้าใช้
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
