import React from "react";

function VideoDetail({ video }) {
  // ฟังก์ชันคำนวณความเร็ว (นำมาจากตัวอย่างก่อนหน้า)
  const calculateSpeed = (vehicle) => {
    const startTime = new Date(vehicle.entry_time);
    const endTime = new Date(vehicle.exit_time);
    const distance = 200; // ระยะทางเป็นเมตร
    const timeDiff = (endTime - startTime) / 1000;

    if (timeDiff <= 0) return { speed_kmph: "ไม่สามารถคำนวณได้" };

    const speed_mps = distance / timeDiff;
    const speed_kmph = speed_mps * 3.6;

    return { speed_kmph: speed_kmph.toFixed(2) };
  };

  // ตรวจสอบว่ามีข้อมูล vehicles ใน video หรือไม่
  const vehicles = video?.vehicle_data || [];

  return (
    <div className="overflow-y-auto max-h-[500px]">
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
          {vehicles.length > 0 ? (
            vehicles
              .slice()
              .sort((a, b) => new Date(b.entry_time) - new Date(a.entry_time))
              .map((vehicle, index) => {
                if (!vehicle.class) return null;
                const [datePart, timePartWithZ] = vehicle.entry_time.split("T");
                const timePart = timePartWithZ.split(".")[0];

                return (
                  <tr
                    key={vehicle.id}
                    className={index % 2 === 1 ? "bg-gray-50" : ""}
                  >
                    <td className="p-4 whitespace-nowrap text-sm text-gray-500">
                      {vehicle.yolo_id}
                    </td>
                    <td className="p-4 whitespace-nowrap text-sm font-semibold">
                      <span
                        className={`${
                          vehicle.class === "car"
                            ? "text-[#3b8f88]"
                            : "text-[#b3b44b]"
                        }`}
                      >
                        {vehicle.class === "car" ? "รถยนต์" : "รถบรรทุก"}
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap text-sm text-gray-500">
                      {datePart}
                    </td>
                    <td className="p-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {timePart}
                    </td>
                    <td className="p-4 whitespace-nowrap text-sm font-semibold">
                      <span
                        className={
                          calculateSpeed(vehicle).speed_kmph > 100
                            ? "text-red-500"
                            : "text-gray-900"
                        }
                      >
                        {calculateSpeed(vehicle).speed_kmph
                          ? `${calculateSpeed(vehicle).speed_kmph} km/h`
                          : "ไม่สามารถคำนวณได้"}
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
                        {vehicle.lane_type === "forward" ? "ขาเข้า" : "ขาออก"}
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {vehicle.lane_id}
                    </td>
                  </tr>
                );
              })
          ) : (
            <tr>
              <td colSpan="7" className="p-4 text-center text-gray-500">
                ไม่มีข้อมูลรถในวิดีโอนี้
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default VideoDetail;
