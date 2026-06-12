import OpenAI from "openai";
import { config } from "./config.js";

export const openai = config.AI_PROVIDER !== "openai"
  ? null
  : new OpenAI({
      apiKey: config.OPENAI_API_KEY,
    });
