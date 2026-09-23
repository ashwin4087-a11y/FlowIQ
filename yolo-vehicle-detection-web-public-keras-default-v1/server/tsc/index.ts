import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import vehicleRoutes from "./router/vehicleRoutes";
import testRoutes from "./router/testRoutes";
import errorHandler from "./middlewares/errorHandler";
import db2 from "./config/db2";
import usersRoutes from "./router/usersRoutes";
import { setupSocket } from "./config/socketSetup";
import videoRoutes from "./router/videoRoutes";

dotenv.config();
const PORT = process.env.PORT || 3001;
const URL = process.env.URL || "localhost";

const app = express();
const server = http.createServer(app);
export const io = setupSocket(server);

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
	res.send("Welcome to the server");
});
app.use(testRoutes);
app.use(vehicleRoutes);
app.use(videoRoutes);
app.use(usersRoutes);

app.use(errorHandler);

(async () => {
	try {
		await db2.$connect();
		console.log("[server] Connected to MySQL with Prisma");
	} catch (error) {
		console.error("[server] MySQL connection error with Prisma\n", error);
	}
})();

// Start Server
server.listen(PORT, () => {
	console.log(`[server] Server is running on http://${URL}:${PORT}`);
});
