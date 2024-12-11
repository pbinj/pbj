import type { User, Session } from "@auth/express";
import { context, pathOf, pbjKey } from "@pbinj/pbj";

export const userPBinJKey = pbjKey<User | null>("user");
export const sessionPBinJKey = pbjKey<Session | null>("session");

context.register(userPBinJKey, pathOf(sessionPBinJKey, "user"));
