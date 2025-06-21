import fs from "fs";
import path from "path";
import { google } from "googleapis";
import archiver from "archiver";

// 🔑 서비스 계정 key 파일 경로
const keyFile = path.resolve("./google-service-key.json");

// 🧾 스프레드시트 ID
const ssId = "1lYCzgstw4dZ3Wb_TwVVUvgJUr_iAoTkjpWzA7uP_Lyg";

// 시트별 구조 설정
const sheetConfigs = {
  "Regional totals": { headerRow: 14, dataStartCol: 1, dataEndCol: "AL" },
  "Local currency financial years": {
    headerRow: 8,
    dataStartCol: 1,
    dataEndCol: "CB",
  },
  "Local currency calendar years": {
    headerRow: 7,
    dataStartCol: 1,
    dataEndCol: "CA",
  },
  "Constant (2023) US$": { headerRow: 6, dataStartCol: 1, dataEndCol: "CA" },
  "Current US$": { headerRow: 6, dataStartCol: 1, dataEndCol: "BZ" },
  "Share of GDP": { headerRow: 6, dataStartCol: 1, dataEndCol: "BZ" },
  "Per capita": { headerRow: 7, dataStartCol: 1, dataEndCol: "AM" },
  "Share of Govt. spending": {
    headerRow: 8,
    dataStartCol: 1,
    dataEndCol: "AN",
  },
};

// 인증 클라이언트 생성
const auth = new google.auth.GoogleAuth({
  keyFile,
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});
const sheets = google.sheets({ version: "v4", auth });

async function exportSheets() {
  const { data } = await sheets.spreadsheets.get({ spreadsheetId: ssId });
  const titles = data.sheets.map((s) => s.properties.title);

  const zipPath = path.resolve("./sipri-data.zip");
  const output = fs.createWriteStream(zipPath);
  const archive = archiver("zip", { zlib: { level: 9 } });

  archive.pipe(output);

  for (const title of titles) {
    const config = sheetConfigs[title];
    if (!config) continue;

    const { headerRow, dataStartCol } = config;
    const range = `'${title}'!A1:${config.dataEndCol}`;

    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: ssId,
      range,
    });

    const rows = resp.data.values || [];
    if (rows.length < headerRow) continue;

    const headers = rows[headerRow - 1].slice(dataStartCol);
    const dataRows = rows.slice(headerRow);

    const json = dataRows
      .filter((r) => r.length > dataStartCol && r[0]?.trim())
      .map((row) => {
        const entry = { country: row[0]?.trim() };
        headers.forEach((year, i) => {
          const val = row[dataStartCol + i];
          entry[year] = val ? parseFloat(val.replace(/,/g, "")) || null : null;
        });
        return entry;
      });

    const outputDir = path.resolve("./sipri-data");
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    const jsonPath = path.join(
      outputDir,
      `${title.replace(/[^\w\d\s-]/g, "").replace(/\s+/g, "_")}.json`
    );
    fs.writeFileSync(jsonPath, JSON.stringify(json, null, 2));

    archive.append(fs.createReadStream(jsonPath), {
      name: path.basename(jsonPath),
    });
  }

  await archive.finalize();
  console.log(`✅ JSON 파일이 zip으로 저장되었습니다: ${zipPath}`);
}

exportSheets().catch((err) => console.error("❌ 오류 발생:", err));
