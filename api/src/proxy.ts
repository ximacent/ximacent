// import { NextRequest, NextResponse } from "next/server";

// const allowedOrigins = [
//   "http://localhost:3001",
//   "https://sjnm15x5-3001.uks1.devtunnels.ms/",
// ];

// export function proxy(request: NextRequest) {
//   const origin = request.headers.get("origin");

//   const isAllowedOrigin =
//     origin && allowedOrigins.includes(origin);

//   // Handle preflight requests
//   if (request.method === "OPTIONS") {
//     return new NextResponse(null, {
//       status: 204,
//       headers: {
//         ...(isAllowedOrigin
//           ? { "Access-Control-Allow-Origin": origin }
//           : {}),
//         "Access-Control-Allow-Methods":
//           "GET, POST, PUT, PATCH, DELETE, OPTIONS",
//         "Access-Control-Allow-Headers":
//           "Content-Type, Authorization",
//       },
//     });
//   }

//   const response = NextResponse.next();

//   if (isAllowedOrigin) {
//     response.headers.set(
//       "Access-Control-Allow-Origin",
//       origin
//     );
//   }

//   response.headers.set(
//     "Access-Control-Allow-Methods",
//     "GET, POST, PUT, PATCH, DELETE, OPTIONS"
//   );

//   response.headers.set(
//     "Access-Control-Allow-Headers",
//     "Content-Type, Authorization"
//   );

//   return response;
// }

// export const config = {
//   matcher: "/api/:path*",
// };




import { NextRequest, NextResponse } from "next/server";

const allowedOrigins = new Set([
  "http://localhost:3001",
  "https://sjnm15x5-3001.uks1.devtunnels.ms",
]);

export function proxy(request: NextRequest) {
  const origin = request.headers.get("origin");

  const response = NextResponse.next();

  if (origin && allowedOrigins.has(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Vary", "Origin");
  }

  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );

  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: response.headers,
    });
  }

  return response;
}

export const config = {
  matcher: "/api/:path*",
};