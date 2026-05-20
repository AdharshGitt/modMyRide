import express from "express";
import cors from "cors";
import morgan from "morgan";
import routes from "./routes/index.js";

const app = express();

app.use(
  cors({
    origin: function (origin, callback) {
      callback(null, true);
    },
    credentials: true
  })
);
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (_req, res) => {
  res.json({ message: "Welcome to the ModMyRide API" });
});

app.use("/api", routes);

export default app;
