import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import apiRoutes from "./routes/apiRoutes.js"
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend
// app.use(cors({
//   origin: ['http://localhost:3001', 'http://localhost:3000'],
//   credentials: true
// }));
app.use(cors({
  origin: true,
  credentials: true
}));


// Initialize Socket.IO with CORS
// const io = new Server(httpServer, {
//   cors: {
//     origin: ['http://localhost:3001', 'http://localhost:3000'],
//     credentials: true
//   }
// });

const io = new Server(httpServer, {
  cors: {
    origin: true,
    credentials: true
  }
});


// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  // Handle authentication
  socket.on('authenticate', (data) => {
    console.log('Client authenticated:', data);
  });
});

app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

app.use("/api", apiRoutes);
app.use("/api_core", apiRoutes); // Additional mounting for user management endpoints

app.get("/", (req, res) => {
  res.json({ message: "Welcome to my Firebase-connected Node.js API!" });
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on http://IP:${PORT}`);
  console.log(`✅ Socket.IO server ready`);
});