const express = require("express");
const morgan = require("morgan");
const path = require("path");
const fileupload = require("express-fileupload");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
const xss = require("xss-clean");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const cors = require("cors");

// Load ENV vars  => should be at top, since it should be imported in all files
dotenv.config({ path: "./config/config.env" });

// Misc files
const errorHandler = require("./middleware/error");
const connectDB = require("./config/db");

// Route files
const bootcamps = require("./routes/bootcamps");
const courses = require("./routes/courses");
const auth = require("./routes/auth");
const users = require("./routes/users");
const reviews = require("./routes/reviews");

// Connect to database
connectDB();

const app = express();

// Body Parser
app.use(express.json());

// Cookie Parser
app.use(cookieParser());

// Dev logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// File Uploading
app.use(fileupload());

// Sanitize input data
app.use(mongoSanitize());

// Set security headers using HELMET
app.use(helmet());

// Prevent cross-site scripting attacks
app.use(xss());

// Rate limiting
// Limit no. of requests to 500 request per 10 min
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10min
  max: 500,
});

app.use(limiter);

// Prevent HTTP param pollution
app.use(hpp());

// Enable CORS
app.use(cors());

// Set static folder
app.use(express.static(path.join(__dirname, "public")));

// Mount routers
app.use("/api/v1/bootcamps", bootcamps);
app.use("/api/v1/courses", courses);
app.use("/api/v1/auth", auth);
app.use("/api/v1/users", users);
app.use("/api/v1/reviews", reviews);

// Error Handling
app.use(errorHandler);

// Home Page or Doc page
app.get("/", (req, res, next) => {
  res.status(200).sendFile(`${__dirname}/index.html`);
});

////
// Server Setup
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () =>
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`);

  // Close the server & exit process
  server.close(() => process.exit(1));
});
