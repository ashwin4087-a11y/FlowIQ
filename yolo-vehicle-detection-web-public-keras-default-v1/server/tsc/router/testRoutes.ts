import { createUserSchema, queryVehicleSchema } from "./../utils/validatorSchema";
import dotenv from "dotenv";
import { Request, Response, NextFunction, Router } from "express";
import AppError from "../utils/appError";
import * as argon2 from "argon2";
import Service from "../service/BaseService";
import db2 from "../config/db2";
import authenticateJWT from "../middlewares/authenticateJWT";
import reqValidator from "../middlewares/reqValidator";
import queryValidator from "../middlewares/queryValidator";
dotenv.config();
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
			return sum + 3.6 * (200 / (diffInMilliseconds / 1000));
		}
		return sum;
	}, 0);

	return {
		count: vehicles.length,
		avg: filteredVehicles.length > 0 ? totalValue / filteredVehicles.length : 0,
	};
};
const router = Router();
router.get("/api/test", [
	// queryValidator(queryVehicleSchema),
	// authenticateJWT,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			let vehicleTime: any = {
				night: [],
				morning: [],
				midday: [],
				evening: [],
			};

			const now = new Date();
			const current = new Date(now.getTime() + 7 * 60 * 60 * 1000);
			current.setUTCHours(0, 0, 0, 0);
			const next = new Date(current);
			next.setUTCHours(23, 59, 59, 0);
			const vehicleData = await db2.vehicle_data.findMany({
				where: {
					entry_time: {
						gte: current,
						lt: next,
					},
				},
			});
			// Categorize data in-memory
			for (const vehicle of vehicleData) {
				const entryTime = vehicle.entry_time ? new Date(vehicle.entry_time) : null;
				const exitTime = vehicle.exit_time ? new Date(vehicle.exit_time) : null;

				const referenceTime = entryTime ?? exitTime; // Use exit_time if available, otherwise entry_time

				if (!referenceTime) continue; // Skip if both are null

				const hours = referenceTime.getUTCHours();

				if (hours >= 0 && hours < 6) {
					vehicleTime["night"].push(vehicle);
				} else if (hours >= 6 && hours < 12) {
					vehicleTime["morning"].push(vehicle);
				} else if (hours >= 10 && hours < 18) {
					vehicleTime["midday"].push(vehicle);
				} else {
					vehicleTime["evening"].push(vehicle);
				}
			}

			// Apply the calculation function
			vehicleTime["night"] = cal(vehicleTime["night"]);
			vehicleTime["morning"] = cal(vehicleTime["morning"]);
			vehicleTime["midday"] = cal(vehicleTime["midday"]);
			vehicleTime["evening"] = cal(vehicleTime["evening"]);
			res.json(vehicleTime);
		} catch (error) {
			next(error);
		}
		// try {
		// 	// console.log("query\n", req.query);
		// 	// console.log("Body\n", req.body.data);
		// 	console.log("success");
		// 	res.send("success");
		// } catch (error) {
		// 	next(error);
		// }
	},
]);
router.get("/api/error", async (req, res, next) => {
	try {
		throw new AppError();
	} catch (error) {
		next(error);
	}
});

export default router;
