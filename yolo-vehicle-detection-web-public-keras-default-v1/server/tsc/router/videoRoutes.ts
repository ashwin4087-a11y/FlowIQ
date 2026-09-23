import { Request, Response, NextFunction, Router } from "express";
import AppError from "../utils/appError";
import db2 from "../config/db2";
import { io } from "../index";
import { VehiclesSocket } from "../sockets/VehiclesSocket";
import reqValidator from "../middlewares/reqValidator";
import { createVideoSchema } from "../utils/validatorSchema";
const router = Router();
router.get("/api/video/all", [
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const video = await db2.video.findMany({ include: { vehicle_data: true } });
			res.send({ data: video });
		} catch (error) {
			next(error);
		}
	},
]);
router.get("/api/video/:id", [
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { id } = req.params;
			const video = await db2.video.findUnique({
				where: { id: Number(id) },
				include: { vehicle_data: true },
			});

			if (!video) {
				throw new AppError("Not Found", 404);
			}
			res.send({ data: video });
		} catch (error) {
			next(error);
		}
	},
]);
router.post("/api/video", [
	reqValidator(createVideoSchema),
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { title } = req.body.data;
			const vehicle = await db2.video.create({
				data: { title: title },
				include: { vehicle_data: true },
			});
			res.status(201).json({ data: vehicle });
		} catch (error) {
			next(error);
		}
	},
]);
export default router;
