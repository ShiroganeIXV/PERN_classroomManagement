import express, { Request, Response } from 'express';

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());

app.get('/', (_req: Request, res: Response) => {
  res.send('Server is running');
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
