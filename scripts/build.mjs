import { buildSite } from "./lib/site.mjs";

await buildSite();
console.log("Built site into dist/");
