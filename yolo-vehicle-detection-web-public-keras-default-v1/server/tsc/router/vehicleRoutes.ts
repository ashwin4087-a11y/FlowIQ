import { Request, Response, NextFunction, Router } from "express";
import AppError from "../utils/appError";
import db2 from "../config/db2";
import isRecordExists from "../middlewares/isRecordExists";
import { io } from "../index";
import { VehiclesSocket } from "../sockets/VehiclesSocket";
import reqValidator from "../middlewares/reqValidator";
import {
	createVehicleDataSchema,
	queryVehicleSchema,
	updateVehicleDataSchema,
} from "../utils/validatorSchema";
import queryValidator from "../middlewares/queryValidator";

const router = Router();
router.post("/api/vehicle", [
	reqValidator(createVehicleDataSchema),
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const {
				class: vehicleClass,
				entry_time,
				exit_time,
				lane_type,
				lane_id,
				yolo_id,
				video_id,
			} = req.body.data;

			const alreadyExists = await db2.vehicle_data.findUnique({
				where: {
					yolo_id_video_id: {
						yolo_id: Number(yolo_id),
						video_id: Number(video_id),
					},
				},
			});
			if (alreadyExists) {
				throw new AppError("not unique yolo_id and video_id Request", 400);
			}
			const video = await db2.video.findUnique({
				where: { id: video_id },
			});
			if (!video) {
				throw new AppError("not found video", 400);
			}
			const vehicle = await db2.vehicle_data.create({
				data: {
					yolo_id: Number(yolo_id),
					video: { connect: { id: Number(video_id) } },
					class: vehicleClass ?? undefined,
					entry_time: entry_time ? new Date(entry_time) : undefined,
					exit_time: exit_time ? new Date(exit_time) : undefined,
					lane_type: lane_type ?? undefined,
					lane_id: lane_id ? Number(lane_id) : undefined,
				},
				include: { video: true },
			});
			VehiclesSocket(io);
			res.status(201).json({ data: vehicle });
		} catch (error) {
			next(error);
		}
	},
]);
router.get("/api/vehicle", [
	queryValidator(queryVehicleSchema),
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { yolo_id, video_id } = req.query;
			const vehicle = await db2.vehicle_data.findUnique({
				where: {
					yolo_id_video_id: {
						yolo_id: Number(yolo_id),
						video_id: Number(video_id),
					},
				},
				include: { video: true },
			});
			if (!vehicle) {
				throw new AppError("Not Found", 404);
			}
			res.send({ data: vehicle });
		} catch (error) {
			next(error);
		}
	},
]);
router.put("/api/vehicle", [
	queryValidator(queryVehicleSchema),
	reqValidator(updateVehicleDataSchema),
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { yolo_id: yolo_id_query, video_id: video_id_query } = req.query;

			const Found = await db2.vehicle_data.findUnique({
				where: {
					yolo_id_video_id: {
						yolo_id: Number(yolo_id_query),
						video_id: Number(video_id_query),
					},
				},
			});

			if (!Found) {
				throw new AppError("Not Found", 404);
			}
			//console.log(Found);

			const {
				class: vehicleClass,
				entry_time,
				exit_time,
				lane_type,
				lane_id,
				yolo_id,
				video_id,
			} = req.body.data;
			if (yolo_id || video_id) {
				const alreadyExists = await db2.vehicle_data.findFirst({
					where: {
						yolo_id: yolo_id ? Number(yolo_id) : Found.yolo_id,
						video_id: video_id ? Number(video_id) : Found.video_id,

						NOT: { id: Found.id },
					},
				});
				//console.log("-----------------------------------------alkda;sldka;ldkad");

				if (alreadyExists) {
					throw new AppError("not unique yolo_id and video_id Request", 400);
				}
			}
			if (video_id) {
				const video = await db2.video.findUnique({
					where: { id: Number(video_id) },
				});
				if (!video) {
					throw new AppError("not found video", 400);
				}
			}

			const vehicle = await db2.vehicle_data.update({
				where: {
					yolo_id_video_id: {
						yolo_id: Number(yolo_id_query),
						video_id: Number(video_id_query),
					},
				},
				data: {
					yolo_id: yolo_id ? Number(yolo_id) : undefined,
					video: video_id ? { connect: { id: video_id } } : undefined,
					class: vehicleClass ? vehicleClass : undefined,
					entry_time: entry_time ? new Date(entry_time) : undefined,
					exit_time: exit_time ? new Date(exit_time) : undefined,
					lane_type: lane_type ? lane_type : undefined,
					lane_id: lane_id ? Number(lane_id) : undefined,
				},
				include: { video: true },
			});
			VehiclesSocket(io);
			res.send({ status: "200", message: "Resource updated successfully.", data: vehicle });
		} catch (error) {
			next(error);
		}
	},
]);
router.delete("/api/vehicle", [
	queryValidator(queryVehicleSchema),
	// isRecordExists(db2.vehicle_data),
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { yolo_id, video_id } = req.query;

			const vehicle = await db2.vehicle_data.delete({
				where: {
					yolo_id_video_id: {
						yolo_id: Number(yolo_id),
						video_id: Number(video_id),
					},
				},
			});
			VehiclesSocket(io);

			res.send({ status: "200", message: "Resource deleted successfully.", data: vehicle });
		} catch (error) {
			next(error);
		}
	},
]);
router.get("/api/vehicle/all", async (req, res, next) => {
	try {
		const vehicle = await db2.vehicle_data.findMany({ include: { video: true } });
		res.send({ data: vehicle });
	} catch (error) {
		next(error);
	}
});
router.get("/api/vehicle/today", [
	// queryValidator(queryVehicleSchema),
	// authenticateJWT,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { GMT } = req.query;
			const TIMEZONE = GMT ? Number(GMT) : 0;
			const now = new Date();
			// console.log("NOW :", now);
			const today = new Date(now.getTime() + TIMEZONE * 60 * 60 * 1000);
			// console.log(today, "-----------------");
			today.setUTCHours(0, 0, 0, 0);
			// console.log(today, "************");
			const tomorrow = new Date(today);
			tomorrow.setDate(tomorrow.getDate() + 1);
			const vehicle = await db2.vehicle_data.findMany({
				where: {
					entry_time: {
						gte: today,
						lt: tomorrow,
					},
				},
				select: {
					class: true,
					entry_time: true,
					exit_time: true,
					lane_type: true,
					lane_id: true,
					yolo_id: true,
					// video_id: true,
					video: true,
				},
			});
			if (!vehicle) {
				throw new AppError("Not Found", 404);
			}
			const vehiclesWithVideoTitle = vehicle.map((vehicle) => ({
				...vehicle,
				video_title: vehicle.video.title,
				video: undefined,
			}));
			res.send({ data: vehiclesWithVideoTitle });
		} catch (error) {
			next(error);
		}
	},
]);
router.get("/api/vehicle/:id", async (req, res, next) => {
	try {
		const { id } = req.params;
		const vehicle = await db2.vehicle_data.findUnique({
			where: { id: id },
			include: { video: true },
		});

		if (!vehicle) {
			throw new AppError("Not Found", 404);
		}
		res.send({ data: vehicle });
	} catch (error) {
		next(error);
	}
});
router.put("/api/vehicle/:id", [
	reqValidator(updateVehicleDataSchema),
	isRecordExists(db2.vehicle_data),
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { id } = req.params;
			const {
				class: vehicleClass,
				entry_time,
				exit_time,
				lane_type,
				lane_id,
				yolo_id,
				video_id,
			} = req.body.data;
			const alreadyExists = await db2.vehicle_data.findUnique({
				where: {
					yolo_id_video_id: {
						yolo_id: Number(yolo_id),
						video_id: Number(video_id),
					},
					NOT: { id: id },
				},
			});
			if (alreadyExists) {
				throw new AppError("not unique yolo_id and video_id Request", 400);
			}
			const video = await db2.video.findUnique({
				where: { id: video_id },
			});
			if (!video) {
				throw new AppError("not found video", 400);
			}
			const vehicle = await db2.vehicle_data.update({
				where: { id: id },
				data: {
					yolo_id: yolo_id ? Number(yolo_id) : undefined,
					video: video_id ? { connect: { id: video_id } } : undefined,
					class: vehicleClass ? vehicleClass : undefined,
					entry_time: entry_time ? new Date(entry_time) : undefined,
					exit_time: exit_time ? new Date(exit_time) : undefined,
					lane_type: lane_type ? lane_type : undefined,
					lane_id: lane_id ? Number(lane_id) : undefined,
				},
				include: { video: true },
			});
			VehiclesSocket(io);
			res.send({ status: "200", message: "Resource updated successfully.", data: vehicle });
		} catch (error) {
			next(error);
		}
	},
]);
router.delete("/api/vehicle/:id", [
	isRecordExists(db2.vehicle_data),
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { id } = req.params;
			const vehicle = await db2.vehicle_data.delete({ where: { id: id } });
			VehiclesSocket(io);

			res.send({ status: "200", message: "Resource deleted successfully.", data: vehicle });
		} catch (error) {
			next(error);
		}
	},
]);

export default router;
