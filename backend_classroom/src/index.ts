// site monitor
import "./config/environment.js";
import AgentAPI from "apminsight";
AgentAPI.config()


import express from "express";
import subjectRouter from "./routes/subjects.js";
import cors from 'cors';
import securityMiddleware from "./middleware/security.js";
import {auth} from "./lib/auth.js";
import {toNodeHandler} from "better-auth/node";

const app = express();

const PORT = Number(process.env.PORT ?? 8000);
// CORS
if (!process.env.FRONTEND_URL){
  throw new Error('FRONTEND_URL environment variable is not set');
}
app.use(
    cors({
      origin: process.env.FRONTEND_URL,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    })
)

app.all('/api/auth/*splat', toNodeHandler(auth));

app.use(express.json());

app.use(securityMiddleware)


app.use('/api/subjects', subjectRouter)

app.get('/', (req, res) => {
  res.send('WELCOME TO THE CLASSROOM API');
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});