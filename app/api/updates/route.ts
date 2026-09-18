import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUpdatesForUser, getUpdatesHistoryForUser } from "@/lib/updates";

export const runtime = "nodejs";
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: { code: "AUTHENTICATION_REQUIRED", message: "Sign in required." } }, { status: 401 });
  const params = new URL(request.url).searchParams;
  if(params.get("view")==="history") {
    const page=Number(params.get("page")||0);
    if(!Number.isSafeInteger(page)||page<0||page>10000)return NextResponse.json({error:{message:"Invalid history page."}},{status:400});
    return NextResponse.json({data:await getUpdatesHistoryForUser(session.user.id,page)},{headers:{"Cache-Control":"no-store"}});
  }
  return NextResponse.json({ data: await getUpdatesForUser(session.user.id) }, { headers: { "Cache-Control": "no-store" } });
}
