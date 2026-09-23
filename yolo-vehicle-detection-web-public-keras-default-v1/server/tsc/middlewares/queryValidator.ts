import { ZodSchema } from "zod";
import { Request, Response, NextFunction } from "express";
import ValidationError from "../utils/ValidationError";

const queryValidator = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
	try {
		const parsed = schema.safeParse(req.query);

		if (!parsed.success) {
			const formattedErrors = parsed.error.issues.map((issue) => ({
				query: issue.path.join("."),
				message: issue.message,
			}));
			res.status(400).json({ errors: formattedErrors });
			// throw new ValidationError("Validation failed", formattedErrors);
		}
		next();
	} catch (error) {
		next(error);
	}
};
export default queryValidator;
