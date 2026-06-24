import express,  { NextFunction, Request, Response } from 'express';
import 'dotenv/config'
import createHttpError from 'http-errors';
import bodyParser from 'body-parser';


import "./messaging/kafka/user-events.consumer";
import postsRouter from './routes/posts.routes';
import adminRouter from './routes/admin.routes';


const app = express();


app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use("/", postsRouter );
app.use("/admin", adminRouter );
app.use("/test", (_req: Request, res: Response) => {
  res.send({ message: "Post service up and running." });
});

//handle endpoints not found: 404
app.use(async (_req: Request, _res: Response, next: NextFunction) => {

  next(createHttpError.NotFound("Route not found"))
})

//errors from controllers send via next(error) is catched by this.
app.use((err: any, _req:Request, res:Response, _next: NextFunction) => {
  res.status(err.status || 500)
  res.send({
    error: {
      status: err.status || 500,
      message: err.message,
    },
  })
})

app.listen(process.env.PORT, () => console.log("server running at " + process.env.PORT))