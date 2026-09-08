// POST /api/auth/login
// Body: { email, password }
// Returns: { accessToken, refreshToken, user }

import { NextRequest } from "next/server";
import { AuthController } from "@/modules/auth/auth.controller";
import { ok, handleError } from "@/lib/errors/globalError";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    const result = await AuthController.login(data);

    return ok(result);
  } catch (err) {
    return handleError(err);
  }
}