import { NextRequest } from "next/server";
import { CategoryController } from "@/modules/category/category.controller";
import { customResponse } from "@/lib/http/response";
import { SuccessCodes } from "@/lib/http/successCodes";
import { handleError } from "@/lib/errors/globalError";
import { withAuth, AuthedHandler } from "@/middleware/withAuth";
import { FilterCategoryDTO } from "@/types/category.type";
import { UserRole } from "@/database/entities/User";
import { PaginationQuery } from "@/types/pagination.type";
import { CustomAppError } from "@/lib/errors/customAppError";
import { ErrorCodes } from "@/lib/errors/errorCodes";
import { assertCanManageElection, assertCanManageCategories } from "@/lib/authz/electionResourceGuard";

// Get list of categories with optional filters
const getHandler: AuthedHandler = async (req, _ctx) => {
    try {
        const params = req.nextUrl.searchParams;
        const filters: FilterCategoryDTO & PaginationQuery = {
            name: params.get("name") ?? undefined,
            electionId: params.get("electionId") ?? undefined,
            page: params.get("page") ? Number(params.get("page")) : undefined,
            limit: params.get("limit") ? Number(params.get("limit")) : undefined,
        };

        const categories = await CategoryController.getCategories(filters);
        return customResponse(SuccessCodes.RECORD_FETCHED.code, SuccessCodes.RECORD_FETCHED.message, 200, categories);

    } catch (error) {
        return handleError(error)
    }
}

// Create a new category — admin/super_admin, or the owning APPROVED
// organizer. electionId comes from the body; ownership is checked
// against that election before the category is created.
const postHandler: AuthedHandler = async (req, _ctx) => {
    try {
        const data = await req.json();
        const actor = { id: req.user.sub, role: req.user.role };

        if (!data?.electionId) {
            throw new CustomAppError("electionId is required", 400, ErrorCodes.VALIDATION_FAILED.code, ErrorCodes.VALIDATION_FAILED.label, "validation_failed");
        }
        await assertCanManageElection(actor, data.electionId);

        const category = await CategoryController.createCategory(data);
        return customResponse(SuccessCodes.RECORD_CREATED.code, SuccessCodes.RECORD_CREATED.message, 201, category);
    } catch (error) {
        return handleError(error)
    }
}

// Delete categories by IDs — admin/super_admin, or the owning APPROVED
// organizer. All-or-nothing: if any id in the batch isn't the actor's
// own, the whole request is denied.
const deleteHandler: AuthedHandler = async (req, _ctx) => {
    try {
        const data = await req.json();
        const actor = { id: req.user.sub, role: req.user.role };

        await assertCanManageCategories(actor, data.ids ?? []);

        await CategoryController.deleteCategories(data.ids);
        return customResponse(SuccessCodes.RECORD_DELETED.code, SuccessCodes.RECORD_DELETED.message, 200);
    } catch (error) {
        return handleError(error)
    }
}

export const GET    = withAuth(getHandler)
export const POST   = withAuth(postHandler, { requireRole: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.ORGANIZER] })
export const DELETE = withAuth(deleteHandler, { requireRole: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.ORGANIZER] })