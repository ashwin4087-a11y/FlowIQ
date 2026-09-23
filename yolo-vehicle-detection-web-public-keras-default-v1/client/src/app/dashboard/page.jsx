"use client";
import Link from "next/link";
import Navbar from "../components/Navbar";
import ReportBytime from "../components/ReportByTime";
import Picture from "../components/Picture";
import { useSocketContext } from "@/context/context";

const Dashboard = () => {
  const { vehicles, vehicleCount, vehicleTime } = useSocketContext();
  // console.log(
  //   "🚀 ~ Dashboard ~ vehicleCount:",
  //   vehicleCount,
  //   "vehicleTime:",
  //   vehicleTime
  // );

  const calculateSpeed = (vehicle) => {
    if (!vehicle?.entry_time || !vehicle?.exit_time) {
      return { speed_kmph: "N/A" };
    }

    const startTime = new Date(vehicle.entry_time);
    const endTime = new Date(vehicle.exit_time);
    const distance = 200; // ระยะทางเป็นเมตร (อาจปรับเป็น props ได้)
    const timeDiff = (endTime - startTime) / 1000; // วินาที

    if (isNaN(timeDiff) || timeDiff <= 0) {
      return { speed_kmph: "N/A" };
    }

    const speed_mps = distance / timeDiff;
    const speed_kmph = speed_mps * 3.6;

    return {
      speed_kmph: speed_kmph.toFixed(2),
    };
  };

  return (
    <div className="bg-rose-200 min-h-screen">
      <Navbar />
      <div className="py-12 px-4 sm:px-10 bg-white rounded-b-3xl drop-shadow-xl">
        <div className="mt-8 mb-4 flex flex-col w-full">
          <h1 className="text-3xl text-black font-bold text-center sm:text-left">
            ระบบตรวจจับพาหนะ
          </h1>
        </div>
        <ReportBytime vehicleTime={vehicleTime} />
      </div>

      <div className="bg-gradient-to-b from-rose-200 to-gray-100 min-h-[calc(100vh-200px)]">
        <div className="w-full px-4 sm:px-6 lg:px-12 py-6">
          {/* Picture Section */}
          <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6 xl:p-8 mb-6 w-full">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-4">
              <div className="flex-shrink-0 text-center">
                <h3 className="text-base font-normal text-gray-500">
                  จำนวนรถที่ตรวจจับได้ทั้งหมดในวันนี้{" "}
                  {vehicleCount !== undefined ? vehicleCount : 0} คัน
                </h3>
              </div>
            </div>
            <div id="diagram" className="w-full">
              <Picture />
            </div>
          </div>

          {/* Table Section */}
          <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6 xl:p-8 w-full">
            <div className="mb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  รถที่ตรวจจับได้ล่าสุด
                </h3>
                <span className="text-base font-normal text-gray-500">
                  รายการแสดงรถที่ตรวจจับเรียงตามลำดับเวลา
                </span>
              </div>
              <Link
                href="/vehiclehistory"
                className="text-sm font-medium text-cyan-600 hover:bg-gray-100 rounded-lg px-4 py-2 transition duration-200"
              >
                ดูทั้งหมด
              </Link>
            </div>
            <div className="relative max-h-[500px] overflow-x-auto overflow-y-auto rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    {[
                      "ID",
                      "ประเภทของรถ",
                      "วันที่",
                      "เวลา",
                      "ความเร็ว",
                      "เลนเดินรถ",
                      "เลนที่",
                    ].map((header) => (
                      <th
                        key={header}
                        className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vehicles && vehicles.length > 0 ? (
                    vehicles
                      .slice()
                      .sort(
                        (a, b) =>
                          new Date(b.entry_time) - new Date(a.entry_time)
                      )
                      .map((vehicle, index) => {
                        if (!vehicle?.entry_time) return null;

                        const [datePart, timePartWithZ] =
                          vehicle.entry_time.split("T");
                        const timePart = timePartWithZ
                          ? timePartWithZ.split(".")[0]
                          : "N/A";

                        return (
                          <tr
                            key={vehicle.id || index}
                            className={index % 2 === 1 ? "bg-gray-50" : ""}
                          >
                            <td className="p-4 whitespace-nowrap text-sm text-gray-500">
                              {vehicle.yolo_id || "N/A"}
                            </td>
                            <td className="p-4 whitespace-nowrap text-sm font-semibold">
                              <span
                                className={`${
                                  vehicle.class === "car"
                                    ? "text-[#3b8f88]"
                                    : "text-[#b3b44b]"
                                }`}
                              >
                                {vehicle.class === "car"
                                  ? "รถยนต์"
                                  : vehicle.class === "truck"
                                  ? "รถบรรทุก"
                                  : "ไม่ระบุ"}
                              </span>
                            </td>
                            <td className="p-4 whitespace-nowrap text-sm text-gray-500">
                              {datePart || "N/A"}
                            </td>
                            <td className="p-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                              {timePart}
                            </td>
                            <td className="p-4 whitespace-nowrap text-sm font-semibold">
                              <span
                                className={
                                  calculateSpeed(vehicle).speed_kmph === "N/A"
                                    ? "text-gray-500"
                                    : calculateSpeed(vehicle).speed_kmph > 100
                                    ? "text-red-500"
                                    : "text-gray-900"
                                }
                              >
                                {calculateSpeed(vehicle).speed_kmph ===
                                "ตรวจจับไม่ได้"
                                  ? "N/A"
                                  : `${
                                      calculateSpeed(vehicle).speed_kmph
                                    } km/h`}
                              </span>
                            </td>
                            <td className="p-4 whitespace-nowrap text-sm font-semibold">
                              <span
                                className={
                                  vehicle.lane_type === "forward"
                                    ? "text-blue-500"
                                    : "text-orange-500"
                                }
                              >
                                {vehicle.lane_type === "forward"
                                  ? "ขาเข้า"
                                  : vehicle.lane_type === "backward"
                                  ? "ขาออก"
                                  : "N/A"}
                              </span>
                            </td>
                            <td className="p-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                              {vehicle.lane_id || "N/A"}
                            </td>
                          </tr>
                        );
                      })
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-gray-500">
                        ไม่มีข้อมูลรถในขณะนี้
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 py-10">
          © 2025{" "}
          <Link href="#" className="hover:underline">
            CarTally
          </Link>
          . All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
