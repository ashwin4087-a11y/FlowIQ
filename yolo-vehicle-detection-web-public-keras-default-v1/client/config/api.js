// import { io } from "socket.io-client";
// import conf from "./conf";

// const socket = io(conf.apiBaseUrl, {
//   transports: ["websocket"],
//   withCredentials: true,
// });

// export const getVehicles = (callback) => {
//   socket.connect(); // เริ่มเชื่อมต่อ WebSocket

//   socket.on("connect", () => {
//     console.log("✅ Connected to WebSocket Server", socket.id);
//   });

//   socket.on("vehicles", (data) => {
//     console.log("🚗 Received vehicles:", data); // ✅ เช็คว่าข้อมูลมาถึง client หรือไม่
//     callback(data);
//   });

//   socket.on("disconnect", () => {
//     console.log("❌ Disconnected from WebSocket Server");
//   });
// };

// export const checkAuth = async () => {
//   try {
//     const res = await ax.get("/api/user/me");
//     return res.data; // ✅ คืนค่าข้อมูล User
//   } catch (error) {
//     return null; // ❌ ถ้าไม่มี User ให้คืนค่า null
//   }
// };
