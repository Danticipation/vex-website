import { access } from "node:fs/promises";

async function main() {
  await access("src/app/(staff)/appraisals/offline/page.tsx");
  await access("public/manifest.webmanifest");
  console.log("mobile test: offline route + manifest present");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
