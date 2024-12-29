import app from "./auth.route.js";
import * as ejs from "ejs";
import { pbj } from "@pbinj/pbj";
import { sessionPBinJKey } from "./pbj.js";
import { env } from "@pbinj/pbj/env";

const port = app.get("port") ?? 3000;
const __dirname = new URL(".", import.meta.url).pathname;

app.set("view engine", "ejs");
app.engine("ejs", (ejs as any).__express);
app.set("views", __dirname + "/../views");
app.get("/", function (req, res) {
  res.render("index", { pbj: pbj(sessionPBinJKey) });
});

// about page
app.listen(port, () => {
  console.log(
    `Server is running on port ${port}\n http://localhost:${port} using db ${env(
      "DATABASE_URL",
    )}`,
  );
});
