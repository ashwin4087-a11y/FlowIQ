import { Request, Response, NextFunction, Router } from "express";
import AppError from "../utils/appError";
import db2 from "../config/db2";
import isRecordExists from "../middlewares/isRecordExists";
import * as argon2 from "argon2";
import Service from "../service/BaseService";
import authenticateJWT from "../middlewares/authenticateJWT";
import reqValidator from "../middlewares/reqValidator";
import { loginUserSchema, createUserSchema, updateUserSchema } from "../utils/validatorSchema";
const router = Router();
router.post("/api/user/login", [
	reqValidator(loginUserSchema),
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { email, password } = req.body.data;

			const user = await db2.user.findUnique({ where: { email: email } });
			if (!user) {
				throw new AppError("Account not found. Please sign up.", 404);
			}
			const hashpassword = user.password;
			const passwordWithPepper = password + (process.env.SECRET_KEY as string);
			const isValid = await argon2.verify(hashpassword, passwordWithPepper);
			if (!isValid) {
				throw new AppError("Invalid password. Please try again.", 401);
			}
			//JWT
			const JWT = await Service.generateJWT(user.id);
			res.send({
				Token: JWT,
				user: { ...user, password: undefined, updatedAt: undefined, createdAt: undefined },
			});
		} catch (error) {
			next(error);
		}
	},
]);
router.post("/api/user", [
	reqValidator(createUserSchema),
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { name, email, password } = req.body.data;

			const alreadyExists = await db2.user.findUnique({ where: { email: email } });
			if (alreadyExists) {
				throw new AppError("Email already in use", 400);
			}
			const user = await db2.user.create({
				data: {
					name: name,
					email: email,
					password: await Service.hash(password),
				},
				select: {
					id: true,
					name: true,
					email: true,
					createdAt: true,
					updatedAt: true,
				},
			});
			res.status(201).json({ data: user });
		} catch (error) {
			next(error);
		}
	},
]);
router.get("/api/user/me", authenticateJWT, async (req, res, next) => {
	try {
		const { userID } = req.body;
		const user = await db2.user.findUnique({
			where: { id: userID },
			select: {
				id: true,
				name: true,
				email: true,
				createdAt: true,
				updatedAt: true,
			},
		});
		res.send({ data: user });
	} catch (error) {
		next(error);
	}
});
router.get("/api/user/all", async (req, res, next) => {
	try {
		const user = await db2.user.findMany({
			select: {
				id: true,
				name: true,
				email: true,
				createdAt: true,
				updatedAt: true,
			},
		});
		res.send({ data: user });
	} catch (error) {
		next(error);
	}
});
router.get("/api/user/:id", async (req, res, next) => {
	try {
		const { id } = req.params;
		const user = await db2.user.findUnique({
			where: { id: Number(id) },
			select: {
				id: true,
				name: true,
				email: true,
				createdAt: true,
				updatedAt: true,
			},
		});
		if (!user) {
			throw new AppError("Not Found", 404);
		}
		res.send({ data: user });
	} catch (error) {
		next(error);
	}
});
router.put("/api/user/:id", [
	reqValidator(updateUserSchema),
	isRecordExists(db2.user),
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { id } = req.params;
			const { name, email, password } = req.body.data;

			if (email) {
				const alreadyExists = await db2.user.findUnique({ where: { email: email } });
				if (alreadyExists) {
					throw new AppError("Email already in use", 400);
				}
			}
			const user = await db2.user.update({
				where: { id: Number(id) },
				data: {
					name: name ?? undefined,
					email: email ?? undefined,
					password: password ? await Service.hash(password) : undefined,
				},
				select: {
					id: true,
					name: true,
					email: true,
					updatedAt: true,
				},
			});
			res.send({ status: "200", message: "Resource updated successfully.", data: user });
		} catch (error) {
			next(error);
		}
	},
]);
router.delete("/api/user/:id", [
	isRecordExists(db2.user),
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { id } = req.params;
			const user = await db2.user.delete({
				where: { id: Number(id) },
				select: {
					id: true,
					name: true,
					email: true,
					createdAt: true,
					updatedAt: true,
				},
			});
			res.send({ status: "200", message: "Resource deleted successfully.", data: user });
		} catch (error) {
			next(error);
		}
	},
]);

export default router;
