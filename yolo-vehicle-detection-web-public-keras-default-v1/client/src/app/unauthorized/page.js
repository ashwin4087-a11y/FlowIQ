// app/unauthorized/page.jsx
"use client";
import Link from "next/link";

const Unauthorized = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center p-6 bg-white shadow-lg rounded-lg">
        <h1 className="text-3xl font-bold text-red-600 mb-4">ไม่มีสิทธิ์เข้าถึง</h1>
        <p className="text-gray-600 mb-6">
          คุณไม่มีสิทธิ์เข้าถึงหน้านี้ เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถเข้าถึงได้
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition duration-200"
        >
          กลับไปที่หน้า Dashboard
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;