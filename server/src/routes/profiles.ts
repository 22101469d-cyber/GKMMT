import { Router } from "express";
import { asyncRoute } from "../lib/asyncRoute.js";
import { repository } from "../lib/repository.js";
import { profileInputSchema } from "../schemas/profileSchema.js";

export const profilesRoutes = Router();

profilesRoutes.post(
  "/",
  asyncRoute(async (request, response) => {
    const input = profileInputSchema.parse(request.body);
    const profile = await repository.createProfile(input);
    response.status(201).json({ profileId: profile.id });
  }),
);
