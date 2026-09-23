import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import db2 from "./db2";
import { VehiclesSocket } from "../sockets/VehiclesSocket";
import { createAdapter } from "@socket.io/redis-adapter";
import { Redis } from "ioredis";

dotenv.config();
const FRONT_PORT = process.env.FRONT_PORT || "8000";
const FRONT_URL = process.env.FRONT_URL || "localhost";
const redisHost = process.env.REDIS_HOST || "redis";
const redisPort = Number(process.env.REDIS_PORT) || 6379;
const pubClient = new Redis({ host: redisHost, port: redisPort });
const subClient = pubClient.duplicate();

// Promise.all([pubClient.connect(), subClient.connect()]);

pubClient.on("error", (err) => {
	console.error("Redis pubClient error:", err);
});
subClient.on("error", (err) => {
	console.error("Redis subClient error:", err);
});

export const setupSocket = (server: http.Server) => {
	const io = new Server(server, {
		cors: {
			origin: `*`,
			methods: ["GET", "POST"],
		},
		adapter: createAdapter(pubClient, subClient),
	});
	// WebSocket: ส่งข้อมูล vehicles
	io.on("connection", async (socket) => {
		// console.log(
		// 	"✅ Connected to WebSocket Server\n",
		// 	socket.handshake.headers["user-agent"],
		// 	"\n✅ end of details"
		// );

		VehiclesSocket(io, socket); // ดึงข้อมูลเมื่อ Client เชื่อมต่อ
		socket.on("frame", (data) => {
			io.emit("frame", data); // Broadcast frame to all clients
		});
		socket.on("disconnect", () => {
			console.log("❌ Disconnected from WebSocket Server");
		});
	});

	return io;
};
