import { VercelRequest, VercelResponse } from "@vercel/node";
import app from "../app";
import serverless from "serverless-http";

// Convert Express to a serverless handler
const handler = serverless(app);

export default (req: VercelRequest, res: VercelResponse) => {
  return handler(req, res);
};
