import express from "express";
import subjectRouter from "./routes/subjects";

const app = express();

const PORT = 8000;

app.use(express.json());

app.use('/api/subjects', subjectRouter)

app.get('/', (req, res) => {
  res.send('WELCOME TO THE CLASSROOM API');
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});