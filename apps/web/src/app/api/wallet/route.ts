import { requireUser } from "@/lib/auth";
import { json, route } from "@/lib/http";
import { PRODUCTS, walletOf } from "@/lib/quota";

export const GET = route(async () => {
  const u = await requireUser();
  return json({ ...(await walletOf(u.id)), products: PRODUCTS });
});
