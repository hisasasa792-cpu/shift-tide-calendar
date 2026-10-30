import { test, eq } from "./harness.js";
import { esc } from "../src/ui/esc.js";

test("esc neutralises HTML in user text", () => {
  eq(esc(`<b>"x"&'y'</b>`), "&#60;b&#62;&#34;x&#34;&#38;&#39;y&#39;&#60;/b&#62;");
});
