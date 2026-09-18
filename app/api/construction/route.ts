import { auth } from "@/lib/auth";
import {
  ConstructionError,
  createConstructionForUser,
  listConstructionForUser,
} from "@/lib/construction";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session)
    return Response.json(
      { error: { message: "Sign in required." } },
      { status: 401 },
    );
  try {
    const url = new URL(request.url);
    return Response.json(
      {
        data: await listConstructionForUser(
          session.user.id,
          url.searchParams.get("propertyId") || undefined,
          url.searchParams.get("archived") === "true",
        ),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    if (e instanceof ConstructionError)
      return Response.json(
        { error: { code: e.code, message: e.message } },
        { status: e.status },
      );
    throw e;
  }
}
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session)
    return Response.json(
      { error: { message: "Sign in required." } },
      { status: 401 },
    );
  try {
    return Response.json(
      {
        data: await createConstructionForUser(
          session.user.id,
          await request.json(),
        ),
      },
      { status: 201 },
    );
  } catch (e) {
    if (e instanceof SyntaxError)
      return Response.json(
        { error: { message: "Invalid request." } },
        { status: 400 },
      );
    if (e instanceof ConstructionError)
      return Response.json(
        { error: { code: e.code, message: e.message } },
        { status: e.status },
      );
    throw e;
  }
}
