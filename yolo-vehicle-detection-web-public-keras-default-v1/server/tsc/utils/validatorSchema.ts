import { z } from "zod";

// Validator for vehicle_data
export const createVehicleDataSchema = z.object({
	id: z.string().uuid().optional(), // UUID format
	yolo_id: z.number(),
	video_id: z.number(), // Reference to video
	class: z.string().max(50).nullable().optional(), // Optional field with max length
	entry_time: z.coerce.date().optional(), // Convert to Date if possible
	exit_time: z.coerce.date().optional(),
	lane_type: z.string().max(30).nullable().optional(),
	lane_id: z.number().nullable().optional(),
});

export const updateVehicleDataSchema = z
	.object({
		yolo_id: z.number().optional(),
		video_id: z.number().optional(), // Reference to video
		class: z.string().max(50).nullable().optional(), // Optional field with max length
		entry_time: z.coerce.date().optional(), // Convert to Date if possible
		exit_time: z.coerce.date().optional(),
		lane_type: z.string().max(30).nullable().optional(),
		lane_id: z.number().nullable().optional(),
	})
	.refine((data) => Object.keys(data).length > 0, {
		message: "At least one field is required to update",
	});

export const queryVehicleSchema = z.object({
	yolo_id: z.string().regex(/^\d+$/, { message: "yolo_id must be a valid integer" }), // yolo_id should be an integer
	video_id: z.string().regex(/^\d+$/, { message: "video_id must be a valid integer" }), // video_id should be an integer
});

// Validator for video
export const createVideoSchema = z.object({
	id: z.number().optional(),
	title: z.string().max(255), // Assuming title must be unique and max 255 chars
	createdAt: z.coerce.date().optional(), // Defaults to now()
});

// Validator for User
export const createUserSchema = z.object({
	id: z.number().optional(),
	name: z.string().min(1, "Name is required"),
	email: z.string().email("Invalid email format"),
	password: z.string().min(6, "Password must be at least 6 characters"), // Min length for security
	createdAt: z.coerce.date().optional(),
	updatedAt: z.coerce.date().optional(),
});

export const updateUserSchema = z
	.object({
		name: z.string().min(1, "Name is required").optional(),
		email: z.string().email("Invalid email format").optional(),
		password: z.string().min(6, "Password must be at least 6 characters").optional(), // Min length for security
	})
	.refine((data) => Object.keys(data).length > 0, {
		message: "At least one field is required to update",
	});

export const loginUserSchema = z.object({
	email: z
		.string({ required_error: "Email is required" })
		.email({ message: "Invalid email format" }), // Validate email format
	password: z
		.string({ required_error: "Password is required" })
		.min(6, { message: "Password must be at least 6 characters" }), // Validate password length
});
