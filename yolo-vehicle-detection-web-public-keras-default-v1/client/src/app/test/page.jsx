// "use client";
// import { useEffect, useState } from "react";
// import {
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
// } from "recharts";
// import ax from "../../../config/ax";



// export default function Dashboard() {
//   const [data, setData] = useState([]);
//   console.log("🚀 ~ Dashboard ~ data:", data)
//   useEffect(() => {
   
//     const fetchData = async () => {
//       try {
//         const res = await ax.get("/api/vehicle/all");
//         setData(res.data); // สมมติว่า API ส่งข้อมูลเป็น JSON
//       } catch (error) {
//         console.error("Error fetching data:", error);
//       }
//     };
    
//     fetchData();
//   }, []);

 

//   return (
//     <div className="p-4 grid grid-cols-2 gap-4 h-screen">
     
//     </div>
//   );
// }
