import { Router } from "express";

import { roadmapRouter } from "./roadmap/roadmap.router";

const globalRouter = Router();

globalRouter.use(roadmapRouter);

export default globalRouter;
