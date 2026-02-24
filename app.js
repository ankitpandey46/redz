require("dotenv").config();
require("module-alias/register");

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const flash = require("connect-flash");
const http = require("http");
const path = require("path");
const userRoute = require("./routes/userRoute");
const driverRoute = require("./routes/driverRoute");
const bookingRoute = require("./routes/bookingRoute");
const prisma = require("./Utils/db");

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.JWT_SECRET || "nodedemo",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);

app.use(cookieParser());
app.use(flash());

app.use(express.static(path.join(__dirname, "public")));

app.use("/api", userRoute);
app.use("/api/driver", driverRoute);
app.use("/api/booking", bookingRoute);


app.use((err, req, res, next) => {
  console.error(err.stack || err);

  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message || "Internal Server Error",
  });
});

const server = http.createServer(app);

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
global.io = io;

try {
  const { client: redisClient } = require("./Utils/redis");
  require("./Socket/driverSocket")(io, redisClient);
  require("./Socket/userSocket")(io, redisClient);
} catch (err) {
  console.log("Redis or Socket configuration error:", err.message);
}

const PORT = process.env.PORT || 8086;

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log("Database connected");

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

startServer();