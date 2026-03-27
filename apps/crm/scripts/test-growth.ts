async function main() {
  const now = new Date().toISOString();
  console.log(`test:growth: OK (${now})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
