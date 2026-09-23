"use client";
import React from "react";
import Link from "next/link";
import Navbar from "./components/Navbar";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-rose-200  flex flex-col pt-10">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-12 py-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
          ยินดีต้อนรับสู่ CarTally
        </h1>
        <p className="text-lg sm:text-xl text-gray-700 max-w-2xl mb-8">
          ระบบตรวจจับพาหนะอัจฉริยะที่ช่วยคุณติดตามและวิเคราะห์การจราจรแบบเรียลไทม์
          ด้วยเทคโนโลยีล้ำสมัยและการออกแบบที่ใช้งานง่าย
        </p>

        {/* Call to Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/dashboard"
            className="bg-rose-500 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-rose-600 transition duration-300"
          >
            ไปที่ Dashboard
          </Link>
          <Link
            href="/vehiclehistory"
            className="bg-white text-rose-500 font-semibold py-3 px-6 rounded-lg shadow-md border border-rose-500 hover:bg-rose-50 transition duration-300"
          >
            ดูประวัติการตรวจจับ
          </Link>
        </div>

        {/* Features Section */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-5xl">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              การตรวจจับแบบเรียลไทม์
            </h3>
            <p className="text-gray-600">
              ติดตามข้อมูลพาหนะทุกวินาทีด้วยข้อมูลที่แม่นยำและทันสมัย
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              รายงานตามช่วงเวลา
            </h3>
            <p className="text-gray-600">
              วิเคราะห์ข้อมูลการจราจรแยกตามช่วงเช้า กลางวัน เย็น และกลางคืน
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              ความเร็วและเลน
            </h3>
            <p className="text-gray-600">
              คำนวณความเร็วและระบุเลนการเดินรถของพาหนะทุกคัน
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-sm text-gray-500 py-6">
        © 2025{" "}
        <Link href="#" className="hover:underline">
          CarTally
        </Link>
        . All rights reserved.
      </footer>

      {/* External Scripts */}
      <script async defer src="https://buttons.github.io/buttons.js"></script>
      <script src="https://demo.themesberg.com/windster/app.bundle.js"></script>
    </div>
  );
};

export default LandingPage;
