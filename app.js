require("module-alias/register");
const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path");
const userRoute = require("./routes/userRoute");
const driverRoute = require("./routes/driverRoute");
// const Cronroute = require("./Cron/CronRoutes/CronRoute")

const expressLayouts = require("express-ejs-layouts");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const connectDB = require("./Utils/db");
connectDB();

const flash = require("connect-flash");

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

app.use(
  session({
    secret: "nodedemo",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.use(cookieParser());

app.use(flash());

app.use(express.static(__dirname + "/public"));

app.use("/Api", userRoute);
app.use("/Api/driver", driverRoute);
// app.use("/Cron", Cronroute);
app.use((err, req, res, next) => {

  if (err.stack) {
    console.error(err.stack);
  } else {
    console.error(err);
  }

  let error = { ...err };
  if (error.name === "JsonWebTokenError") {
    err.message = "please login again";
    err.statusCode = 401;
    return res.status(401).redirect("view/login");
  }
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "errors";

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
});

const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const { client: redisClient } = require("./Utils/redis");
require("./Socket/driverSocket")(io, redisClient);

http.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);
