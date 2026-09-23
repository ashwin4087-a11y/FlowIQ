"use client";
import { useState, useEffect } from "react";

export default function ReportBytime({ vehicleTime }) {
  // console.log("🚀 ~ ReportBytime ~ vehicleTime:", vehicleTime);
  const [timeData, setTimeData] = useState({
    morning: { count: 0, avg: 0 },
    midday: { count: 0, avg: 0 },
    evening: { count: 0, avg: 0 },
    night: { count: 0, avg: 0 },
  });

  useEffect(() => {
    // ตรวจสอบว่า vehicleTime มีค่าหรือไม่
    if (!vehicleTime) {
      console.log("No vehicle data provided");
      return;
    }

    // อัปเดต timeData โดยตัดทศนิยมของ avg
    setTimeData({
      morning: {
        count: vehicleTime.night?.count || 0,
        avg: Math.round(vehicleTime.night?.avg || 0),
      },
      midday: {
        count: vehicleTime.morning?.count || 0,
        avg: Math.round(vehicleTime.morning?.avg || 0),
      },
      evening: {
        count: vehicleTime.midday?.count || 0,
        avg: Math.round(vehicleTime.midday?.avg || 0),
      },
      night: {
        count: vehicleTime.evening?.count || 0,
        avg: Math.round(vehicleTime.evening?.avg || 0),
      },
    });
  }, [vehicleTime]);

  const timeStyles = {
    morning: {
      bgGradient: "bg-gradient-to-br from-yellow-100 to-orange-200",
      sunColor: "#FFB74D",
      skyColor: "#87CEEB",
    },
    midday: {
      bgGradient: "bg-gradient-to-br from-blue-100 to-yellow-200",
      sunColor: "#FFD700",
      skyColor: "#87CEFA",
    },
    evening: {
      bgGradient: "bg-gradient-to-br from-orange-200 to-purple-300",
      sunColor: "#FF8C00",
      skyColor: "#FFA07A",
    },
    night: {
      bgGradient: "bg-gradient-to-br from-gray-800 to-indigo-900",
      sunColor: "#FFFFFF",
      skyColor: "#191970",
    },
  };

  const renderSVG = (key) => {
    switch (key) {
      case "morning":
        return (
          <svg
            width="100%"
            height="100"
            viewBox="0 0 64 64"
            className="max-w-[120px]"
          >
            <rect
              x="0"
              y="0"
              width="64"
              height="64"
              rx="10"
              ry="10"
              fill={timeStyles[key].skyColor}
            />
            <path
              d="M0 50 Q16 45 32 50 T64 50 V64 H0 Z"
              fill="#8B4513"
              opacity="1"
            />
            <g className="animate-sunrise">
              <circle cx="16" cy="20" r="6" fill={timeStyles[key].sunColor} />
            </g>
            <g className="animate-clouds">
              <path
                d="M10 40 Q12 36 16 38 Q20 36 22 40 Q24 42 22 44 Q18 46 14 44 Q12 46 10 44 Z"
                fill="#FFFFFF"
                opacity="0.9"
              />
              <path
                d="M28 44 Q30 40 34 42 Q38 40 40 44 Q42 46 40 48 Q36 50 32 48 Q30 50 28 48 Z"
                fill="#FFFFFF"
                opacity="0.9"
              />
            </g>
          </svg>
        );
      case "midday":
        return (
          <svg
            width="100%"
            height="100"
            viewBox="0 0 64 64"
            className="max-w-[120px]"
          >
            <rect
              x="0"
              y="0"
              width="64"
              height="64"
              rx="10"
              ry="10"
              fill={timeStyles[key].skyColor}
            />
            <path
              d="M0 50 Q16 45 32 50 T64 50 V64 H0 Z"
              fill="#6B7280"
              opacity="1"
            />
            <g className="animate-float">
              <circle cx="32" cy="16" r="7" fill={timeStyles[key].sunColor} />
            </g>
            <g className="animate-clouds">
              <path
                d="M14 38 Q16 34 20 36 Q24 34 26 38 Q28 40 26 42 Q22 44 18 42 Q16 44 14 42 Z"
                fill="#FFFFFF"
                opacity="0.9"
              />
              <path
                d="M36 42 Q38 38 42 40 Q46 38 48 42 Q50 44 48 46 Q44 48 40 46 Q38 48 36 46 Z"
                fill="#FFFFFF"
                opacity="0.9"
              />
            </g>
          </svg>
        );
      case "evening":
        return (
          <svg
            width="100%"
            height="100"
            viewBox="0 0 64 64"
            className="max-w-[120px]"
          >
            <rect
              x="0"
              y="0"
              width="64"
              height="64"
              rx="10"
              ry="10"
              fill={timeStyles[key].skyColor}
            />
            <path
              d="M0 50 Q16 45 32 50 T64 50 V64 H0 Z"
              fill="#4B5E40"
              opacity="1"
            />
            <g className="animate-sunset">
              <circle cx="48" cy="24" r="6" fill={timeStyles[key].sunColor} />
            </g>
            <g className="animate-clouds">
              <path
                d="M28 40 Q30 36 34 38 Q38 36 40 40 Q42 42 40 44 Q36 46 32 44 Q30 46 28 44 Z"
                fill="#FFFFFF"
                opacity="0.7"
              />
              <path
                d="M44 44 Q46 40 50 42 Q54 40 56 44 Q58 46 56 48 Q52 50 48 48 Q46 50 44 48 Z"
                fill="#FFFFFF"
                opacity="0.7"
              />
            </g>
          </svg>
        );
      case "night":
        return (
          <svg
            width="100%"
            height="100"
            viewBox="0 0 64 64"
            className="max-w-[120px]"
          >
            <rect
              x="0"
              y="0"
              width="64"
              height="64"
              rx="10"
              ry="10"
              fill={timeStyles[key].skyColor}
            />
            <path
              d="M0 50 Q16 45 32 50 T64 50 V64 H0 Z"
              fill="#1F2937"
              opacity="1"
            />
            <g className="animate-float">
              <path
                d="M48 16 Q52 12 48 8 Q44 12 48 16"
                fill={timeStyles[key].sunColor}
                stroke={timeStyles[key].sunColor}
                strokeWidth="1"
                className="animate-pulse"
              />
            </g>
            <g className="animate-twinkle">
              <circle cx="12" cy="12" r="1.5" fill="#FFFFFF" />
              <circle cx="20" cy="8" r="1" fill="#FFFFFF" />
              <circle cx="40" cy="16" r="1.2" fill="#FFFFFF" />
              <circle cx="32" cy="24" r="1.5" fill="#FFFFFF" />
            </g>
            <g className="animate-clouds">
              <path
                d="M14 40 Q16 36 20 38 Q24 36 26 40 Q28 42 26 44 Q22 46 18 44 Q16 46 14 44 Z"
                fill="#D1D5DB"
                opacity="0.6"
              />
              <path
                d="M36 44 Q38 40 42 42 Q46 40 48 44 Q50 46 48 48 Q44 50 40 48 Q38 50 36 48 Z"
                fill="#D1D5DB"
                opacity="0.6"
              />
            </g>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
      {[
        { label: "ช่วงเช้า (00:00-06:00น.)", key: "morning" },
        { label: "ช่วงกลางวัน (06:00-12:00น.)", key: "midday" },
        { label: "ช่วงเย็น (12:00-18:00น.)", key: "evening" },
        { label: "ช่วงกลางคืน (18:00-00:00น.)", key: "night" },
      ].map(({ label, key }) => (
        <div
          key={key}
          className={`relative ${timeStyles[key].bgGradient} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 h-[220px] flex items-center`}
        >
          <div className="flex-shrink-0 w-1/3 mr-4">{renderSVG(key)}</div>
          <div className="flex-1">
            <h2
              className={`text-lg font-semibold mb-2 ${
                key === "night" ? "text-white" : "text-gray-800"
              }`}
            >
              {label}
            </h2>
            <div
              className={`space-y-1 ${
                key === "night" ? "text-gray-200" : "text-gray-700"
              }`}
            >
              <p>
                จำนวนรถ:{" "}
                <span className="font-medium">{timeData[key].count} คัน</span>
              </p>
              <p>
                ความเร็วเฉลี่ย:{" "}
                <span className="font-medium">{timeData[key].avg} km/h</span>
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
