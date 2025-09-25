import express, { Request, Response } from "express";

const app = express();

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Hello from Express + Vercel + TypeScript!" });
});

export default app;
