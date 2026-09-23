import * as argon2 from "argon2";
import dotenv from "dotenv";
import AppError from "../utils/appError";
import { sign } from "jsonwebtoken";
dotenv.config();

class Service {
	static async hash(password: string) {
		try {
			const passwordWithPepper: string = password + (process.env.SECRET_KEY as string);
			const hashpassword = await argon2.hash(passwordWithPepper, {
				type: argon2.argon2id,
				memoryCost: 2 ** 16,
				timeCost: 3,
			});
			return hashpassword;
		} catch (error) {
			throw new AppError();
		}
	}
	static async generateJWT(userId: number) {
		try {
			// 10 minute == 60*10
			return sign({ userId }, process.env.SECRET_KEY as string, { expiresIn: 60 * 60 * 2 });
		} catch (error) {
			throw new AppError();
		}
	}
}
export default Service;
