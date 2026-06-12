import { createClient } from "@supabase/supabase-js";
import { config } from "./config.js";

export const supabase = config.USE_MOCK_DATABASE
  ? null
  : createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
