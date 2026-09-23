import { Server, Socket } from "socket.io";
import db2 from "../config/db2";
import { limits } from "argon2";
import AppError from "../utils/appError";
type Vehicle = {
	id: string;
	yolo_id: number;
	video_id: number;
	class: string | null;
	entry_time: Date | null;
	exit_time: Date | null;
	lane_type: string | null;
	lane_id: number | null;
};

const getVehicleTime = async (): Promise<Record<string, any>> => {
	try {
		let vehicleTime: Record<string, any> = {
			night: [],
			morning: [],
			midday: [],
			evening: [],
		};

		const now = new Date();
		const current = new Date(now.getTime() + 7 * 60 * 60 * 1000);
		current.setUTCHours(0, 0, 0, 0);
		const next = new Date(current);
		next.setUTCHours(23, 59, 59, 999);

		// Fetch vehicles for the entire day using entry_time OR exit_time
		const vehicleData = await db2.vehicle_data.findMany({
			where: {
				OR: [{ entry_time: { gte: current, lt: next } }, { exit_time: { gte: current, lt: next } }],
			},
		});

		// console.log("🚀 Fetched vehicles count:", vehicleData.length);

		// Categorize data in-memory
		for (const vehicle of vehicleData) {
			const entryTime = vehicle.entry_time ? new Date(vehicle.entry_time) : null;
			const exitTime = vehicle.exit_time ? new Date(vehicle.exit_time) : null;
			const referenceTime = entryTime ?? exitTime;
			if (!referenceTime) continue;

			const hours = referenceTime.getUTCHours();
			if (hours >= 0 && hours < 6) vehicleTime["night"].push(vehicle);
			else if (hours >= 6 && hours < 12) vehicleTime["morning"].push(vehicle);
			else if (hours >= 10 && hours < 18) vehicleTime["midday"].push(vehicle);
			else vehicleTime["evening"].push(vehicle);
		}

		// Apply calculations
		vehicleTime["night"] = cal(vehicleTime["night"]);
		vehicleTime["morning"] = cal(vehicleTime["morning"]);
		vehicleTime["midday"] = cal(vehicleTime["midday"]);
		vehicleTime["evening"] = cal(vehicleTime["evening"]);

		// console.log("🚀 Processed vehicleTime:", vehicleTime);

		return vehicleTime;
	} catch (error) {
		console.error("🚨 Error fetching vehicleTime:", error);
		throw new AppError("Failed to fetch vehicle time", 500);
	}
};

const cal = (vehicles: Vehicle[]) => {
	const filteredVehicles = vehicles.filter(
		(vehicle: Vehicle) => vehicle.entry_time && vehicle.exit_time
	);

	const totalValue = filteredVehicles.reduce((sum: number, vehicle: Vehicle) => {
		if (!vehicle.entry_time || !vehicle.exit_time) return sum;
		const entry = new Date(vehicle.entry_time).getTime();
		const exit = new Date(vehicle.exit_time).getTime();
		if (exit >= entry) {
			const diffInMilliseconds = exit - entry;
			if (diffInMilliseconds === 0) return sum;
			return sum + 3.6 * (200 / (diffInMilliseconds / 1000));
		}
		return sum;
	}, 0);

	return {
		count: vehicles.length,
		avg: filteredVehicles.length > 0 ? totalValue / filteredVehicles.length : 0,
	};
};

export const VehiclesSocket = async (io?: Server, socket?: Socket) => {
	try {
		const vehicle = await db2.vehicle_data.findMany({ orderBy: { entry_time: "desc" }, take: 20 });
		const vehicleCount = await db2.vehicle_data.count();
		const vehicleTime = await getVehicleTime();
		// let vehicleTime: any = {
		// 	night: [],
		// 	morning: [],
		// 	midday: [],
		// 	evening: [],
		// };

		// const now = new Date();
		// const current = new Date(now.getTime() + 7 * 60 * 60 * 1000);
		// current.setUTCHours(0, 0, 0, 0);
		// const next = new Date(current);
		// next.setUTCHours(23, 59, 59, 0);
		// const vehicleData = await db2.vehicle_data.findMany({
		// 	where: {
		// 		entry_time: {
		// 			gte: current,
		// 			lt: next,
		// 		},
		// 	},
		// });
		// // Categorize data in-memory
		// for (const vehicle of vehicleData) {
		// 	const entryTime = vehicle.entry_time ? new Date(vehicle.entry_time) : null;
		// 	const exitTime = vehicle.exit_time ? new Date(vehicle.exit_time) : null;

		// 	const referenceTime = entryTime ?? exitTime; // Use exit_time if available, otherwise entry_time

		// 	if (!referenceTime) continue; // Skip if both are null

		// 	const hours = referenceTime.getUTCHours();

		// 	if (hours >= 0 && hours < 6) {
		// 		vehicleTime["night"].push(vehicle);
		// 	} else if (hours >= 6 && hours < 12) {
		// 		vehicleTime["morning"].push(vehicle);
		// 	} else if (hours >= 10 && hours < 18) {
		// 		vehicleTime["midday"].push(vehicle);
		// 	} else {
		// 		vehicleTime["evening"].push(vehicle);
		// 	}
		// }

		// // Apply the calculation function
		// vehicleTime["night"] = cal(vehicleTime["night"]);
		// vehicleTime["morning"] = cal(vehicleTime["morning"]);
		// vehicleTime["midday"] = cal(vehicleTime["midday"]);
		// vehicleTime["evening"] = cal(vehicleTime["evening"]);
		// // console.log("🚀 Sending vehicles data:", rows); // ✅ ตรวจสอบว่าข้อมูลถูกดึงมาแล้ว
		if (socket) {
			socket.emit("vehicles", vehicle); // ✅ ส่งข้อมูลไปยัง client
			socket.emit("vehicleCount", vehicleCount);
			socket.emit("vehicleTime", vehicleTime);
		} else {
			if (io) {
				io.emit("vehicles", vehicle);
				io.emit("vehicleCount", vehicleCount);
				io.emit("vehicleTime", vehicleTime);
			}
		}
	} catch (error) {
		console.error("🚨 Error fetching vehicles:", error);
	}
};
