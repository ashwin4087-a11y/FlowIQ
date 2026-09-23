"use client";
import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import TrafficChart from "../components/TraffigChart";
import LaneTrafficChart from "../components/LaneTrafficChart";
import ax from "../../../config/ax";

function Analye() {
  const [vehicles, setVehicles] = useState([]);
  const fetchData = async () => {
    try {
      const res = await ax.get("/api/vehicle/all");
      // เรียงข้อมูลจากล่าสุดไปเก่าสุดตาม createdAt
      setVehicles(res.data.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      setVehicles([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  // console.log("🚀 ~ Analye ~ vehicles:", vehicles);
  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-rose-200 to-gray-100">
      <Navbar />
      <div className="mt-16 overflow-hidden h-full w-[90%] mx-auto">
        <div className="bg-white shadow rounded-lg p-4 sm:p-6 xl:p-8 mt-4 w-full">
          <TrafficChart vehicleData={vehicles} />
        </div>
        <div className="bg-white shadow rounded-lg p-4 sm:p-6 xl:p-8 mt-4 w-full">
          <LaneTrafficChart vehicleData={vehicles} />
        </div>
      </div>
    </div>
  );
}

export default Analye;
