import { NextRequest } from "next/server";
import { OrganizerController } from "@/modules/organizer/organizer.controller";
import { customResponse } from "@/lib/http/response";
import { SuccessCodes } from "@/lib/http/successCodes";
import { handleError } from "@/lib/errors/globalError";
import { withAuth, AuthedHandler } from "@/middleware/withAuth";
import { UserRole } from "@/database/entities/User";
import type { ImageFileInput } from "@/lib/storage/createWithImages";

// Get the authenticated organizer's own profile. Ownership comes from
// req.user.sub (the JWT) — no id is ever accepted from the client.
const getHandler: AuthedHandler = async (req, _ctx) => {
  try {
    const profile = await OrganizerController.getMyProfile(req.user.sub);
    return customResponse(SuccessCodes.RECORD_FETCHED.code, SuccessCodes.RECORD_FETCHED.message, 200, profile);
  } catch (error) {
    return handleError(error);
  }
};

// Update the authenticated organizer's own profile. Accepts either:
// - application/json — text fields only, e.g. { "organizationName": "..." }
// - multipart/form-data — text fields as form entries, PLUS an optional
//   "ghCardImage" file, so an organizer can submit their whole profile
//   including the Ghana Card photo in one request instead of two calls.
// The dedicated PATCH /organizers/me/gh-card-image endpoint still exists
// for updating just the image on its own.
const patchHandler: AuthedHandler = async (req, _ctx) => {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    let data: unknown = {};
    let image: ImageFileInput | undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const fields: Record<string, unknown> = {};

      for (const [key, value] of formData.entries()) {
        if (key === "ghCardImage") continue; // handled separately below
        if (typeof value === "string") fields[key] = value;
      }
      data = fields;

      const file = formData.get("ghCardImage");
      if (file instanceof File) {
        const buffer = Buffer.from(await file.arrayBuffer());
        image = { fieldName: "ghCardImageUrl", buffer, originalName: file.name };
      }
    } else {
      data = await req.json();
    }

    const profile = await OrganizerController.updateMyProfile(req.user.sub, data, image);
    return customResponse(SuccessCodes.RECORD_UPDATED.code, SuccessCodes.RECORD_UPDATED.message, 200, profile);
  } catch (error) {
    return handleError(error);
  }
};

export const GET = withAuth(getHandler, { requireRole: UserRole.ORGANIZER });
export const PATCH = withAuth(patchHandler, { requireRole: UserRole.ORGANIZER });
