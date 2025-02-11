import express, { NextFunction, Request, Response, urlencoded } from "express";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();

// Middlewares
app.use(cors({
    origin: "http://localhost:5173",
    optionsSuccessStatus: 200
}))

app.use(express.json({ limit: "500kb" }));
app.use(urlencoded({ extended: true, limit: "500kb" }));
app.use(express.raw());

app.post("/stream", (req: Request, res: Response, next: NextFunction) => {

    const arrayBuff = req.body;

    res.send(arrayBuff);
})

app.listen(5000, () => {
    console.log("App is listening on port: ", 5000);
})

// We will be sending the blobs the the server in a time stamps of 100ms and the server will return it back to the client
// In what format we will send the blobs to the backend?