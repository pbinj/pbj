import { ExpressAuth, getSession } from "@auth/express";
import express, { Express } from "express";
import "@pbinj/pbj/scope";
import { context, pbj } from "@pbinj/pbj";
import { sessionPBinJKey } from "./pbj";
import { ExpressAuthConfigClass } from "./auth.config";

const app: Express = express();

const requestScoped = context.scoped(sessionPBinJKey);

// If app is served through a proxy, trust the proxy to allow HTTPS protocol to be detected
// https://expressjs.com/en/guide/behind-proxies.html
app.set("trust proxy", true);

app.use("/auth/*", ExpressAuth(pbj(ExpressAuthConfigClass)));

app.use("/*", async (req, res, next) => {
  const session = await getSession(req, pbj(ExpressAuthConfigClass));
  if (!session?.user) {
    return res.redirect("/auth/signin");
  }

  requestScoped(next, session);
});

export default app;
