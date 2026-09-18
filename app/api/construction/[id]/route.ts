import { auth } from "@/lib/auth";
import {
  ConstructionError,
  getConstructionForUser,
  mutateConstructionForUser,
} from "@/lib/construction";
export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, context: Context) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session)
    return Response.json(
      { error: { message: "Sign in required." } },
      { status: 401 },
    );
  try {
    return Response.json(
      {
        data: await getConstructionForUser(
          session.user.id,
          (await context.params).id,
          true,
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
export async function POST(request: Request, context: Context) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session)
    return Response.json(
      { error: { message: "Sign in required." } },
      { status: 401 },
    );
  try {
    return Response.json(
      {
        data: await mutateConstructionForUser(
          session.user.id,
          (await context.params).id,
          await request.json(),
        ),
      },
      { headers: { "Cache-Control": "no-store" } },
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
