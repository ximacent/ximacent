import { NextRequest } from "next/server";
import { CategoryController } from "@/modules/category/category.controller";
import { customResponse } from "@/lib/http/response";
import { SuccessCodes } from "@/lib/http/successCodes";
import { handleError } from "@/lib/errors/globalError";
import { withAuth, AuthedHandler } from "@/middleware/withAuth";
import { FilterCategoryDTO } from "@/types/category.type";
import { UserRole } from "@/database/entities/User";
import { PaginationQuery } from "@/types/pagination.type";

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

// Create a new category — admin only
const postHandler: AuthedHandler = async (req: NextRequest) => {
    try {
        const data = await req.json();
        const category = await CategoryController.createCategory(data);
        return customResponse(SuccessCodes.RECORD_CREATED.code, SuccessCodes.RECORD_CREATED.message, 201, category);
    } catch (error) {
        return handleError(error)
    }
}

// Delete categories by IDs — admin only
const deleteHandler: AuthedHandler = async (req: NextRequest) => {
    try {
        const data = await req.json();
        await CategoryController.deleteCategories(data.ids);
        return customResponse(SuccessCodes.RECORD_DELETED.code, SuccessCodes.RECORD_DELETED.message, 200);
    } catch (error) {
        return handleError(error)
    }
}

export const GET    = withAuth(getHandler)
export const POST   = withAuth(postHandler, { requireRole: UserRole.ADMIN })
export const DELETE = withAuth(deleteHandler, { requireRole: UserRole.ADMIN })