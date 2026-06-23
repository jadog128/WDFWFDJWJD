const https = require("https");
const fs = require("fs");
const path = require("path");

const files = [
  { url: "https://github.com/naptha/tessdata/raw/gh-pages/4.0.0/eng.traineddata", name: "eng.traineddata" },
  { url: "https://github.com/naptha/tessdata/raw/gh-pages/4.0.0/osd.traineddata", name: "osd.traineddata" },
];

const dest = path.join(__dirname, "..", "public", "tessdata");
if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

let done = 0;
let failed = 0;
const total = files.length;

function checkDone() {
  if (done + failed === total) {
    if (failed > 0) console.error(`${failed}/${total} downloads failed`);
    else console.log("All tessdata files ready");
    process.exit(failed > 0 ? 0 : 0); // non-fatal
  }
}

files.forEach((f) => {
  const filePath = path.join(dest, f.name);
  if (fs.existsSync(filePath)) {
    console.log(`Already exists: ${f.name}`);
    done++;
    checkDone();
    return;
  }

  const file = fs.createWriteStream(filePath);
  const req = https.get(f.url, (res) => {
    if (res.statusCode !== 200) {
      console.error(`Failed to download ${f.name}: HTTP ${res.statusCode}`);
      fs.unlink(filePath, () => {});
      failed++;
      checkDone();
      return;
    }
    res.pipe(file);
    file.on("finish", () => {
      file.close();
      console.log(`Downloaded: ${f.name}`);
      done++;
      checkDone();
    });
  });

  req.on("error", (err) => {
    console.error(`Failed to download ${f.name}: ${err.message}`);
    fs.unlink(filePath, () => {});
    failed++;
    checkDone();
  });

  req.setTimeout(15000, () => {
    req.destroy();
    fs.unlink(filePath, () => {});
    failed++;
    checkDone();
  });
});
