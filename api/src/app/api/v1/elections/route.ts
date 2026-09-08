import { NextRequest } from "next/server";
import { ElectionController } from "@/modules/election/election.controller";
import { customResponse } from "@/lib/http/response";
import { SuccessCodes } from "@/lib/http/successCodes";
import { handleError } from "@/lib/errors/globalError";
import { withAuth, AuthedHandler } from "@/middleware/withAuth";
import { FilterElectionDTO } from "@/types/election.type";
import { PaginationQuery } from "@/types/pagination.type";
import { UserRole } from "@/database/entities/User";

// Get list of elections with optional filters
const getHandler: AuthedHandler = async (req, _ctx) => {
    try {
        const params = req.nextUrl.searchParams;
        const filters: FilterElectionDTO & PaginationQuery = {
            title: params.get("title") ?? undefined,
            status: (params.get("status") as FilterElectionDTO["status"]) ?? undefined,
            createdById: params.get("createdById") ?? undefined,
            page: params.get("page") ? Number(params.get("page")) : undefined,
            limit: params.get("limit") ? Number(params.get("limit")) : undefined,
        };

        const elections = await ElectionController.getElections(filters);
        return customResponse(SuccessCodes.RECORD_FETCHED.code, SuccessCodes.RECORD_FETCHED.message, 200, elections);

    } catch (error) {
        return handleError(error)
    }
}

// Create a new election
const postHandler: AuthedHandler = async (req, _ctx) => {
    try {
        const data = await req.json();
        const election = await ElectionController.createElection(data, req.user.sub);
        return customResponse(SuccessCodes.RECORD_CREATED.code, SuccessCodes.RECORD_CREATED.message, 201, election);
    } catch (error) {
        return handleError(error)
    }
}

// Delete elections by IDs — admin only
const deleteHandler: AuthedHandler = async (req, _ctx) => {
    try {
        const data = await req.json();
        await ElectionController.deleteElections(data.ids);
        return customResponse(SuccessCodes.RECORD_DELETED.code, SuccessCodes.RECORD_DELETED.message, 200);
    } catch (error) {
        return handleError(error)
    }
}

export const GET    = withAuth(getHandler)
export const POST   = withAuth(postHandler)
export const DELETE = withAuth(deleteHandler, { requireRole: UserRole.ADMIN })