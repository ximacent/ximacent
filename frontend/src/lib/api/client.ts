import { clearTokens, getAccessToken } from "./auth-storage";
import {
  ApiError,
  type ApiEnvelope,
  type ApiErrorEnvelope,
} from "./types";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  /** Skip Authorization header (public routes). Default: false */
  public?: boolean;
  /** Send body as FormData without JSON Content-Type */
  formData?: FormData;
};

function getBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) {
    throw new Error("NEXT_PUBLIC_API_URL is not set");
  }
  return base.replace(/\/$/, "");
}

type QueryValue = string | number | boolean | undefined | null;
type QueryParams = Record<string, QueryValue>;

function buildUrl(path: string, query?: QueryParams): string {
  const url = new URL(
    path.startsWith("http") ? path : `${getBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`
  );

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      url.searchParams.set(key, String(value));
    });
  }

  return url.toString();
}

async function parseEnvelope<T>(response: Response): Promise<T> {
  let json: ApiEnvelope<T> | null = null;

  try {
    json = (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new ApiError(
      response.statusText || "Unexpected empty response from API",
      response.status
    );
  }

  if (!response.ok || !json.success) {
    const err = json as ApiErrorEnvelope;
    if (response.status === 401) {
      clearTokens();
    }
    throw new ApiError(err.message || "Request failed", response.status, {
      code: err.code,
      label: err.label,
      key: err.key,
    });
  }

  return json.data;
}

export async function apiClient<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, public: isPublic, formData, headers: customHeaders, ...rest } = options;

  const headers = new Headers(customHeaders);

  if (!isPublic) {
    const token = getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  let finalBody: BodyInit | undefined;

  if (formData) {
    finalBody = formData;
    // Let the browser set multipart boundary — do not set Content-Type
  } else if (body !== undefined) {
    headers.set("Content-Type", "application/json");
    finalBody = JSON.stringify(body);
  }

  const response = await fetch(buildUrl(path), {
    ...rest,
    headers,
    body: finalBody,
  });

  return parseEnvelope<T>(response);
}

export async function apiClientWithQuery<T>(
  path: string,
  query?: object,
  options: RequestOptions = {}
): Promise<T> {
  const { body, public: isPublic, formData, headers: customHeaders, ...rest } = options;

  const headers = new Headers(customHeaders);

  if (!isPublic) {
    const token = getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  let finalBody: BodyInit | undefined;

  if (formData) {
    finalBody = formData;
  } else if (body !== undefined) {
    headers.set("Content-Type", "application/json");
    finalBody = JSON.stringify(body);
  }

  const response = await fetch(buildUrl(path, query as QueryParams | undefined), {
    ...rest,
    headers,
    body: finalBody,
  });

  return parseEnvelope<T>(response);
}
