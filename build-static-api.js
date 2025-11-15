const fs = require("fs");
const path = require("path");

const SRC_PATH = path.join(
  __dirname,
  "dataThamKhao",
  "json",
  "vietnam-address.json"
);
const OUT_DIR = path.join(__dirname, "api");
const OUT_FILE = path.join(OUT_DIR, "province-admin-info.json");

function loadSource() {
  const rawText = fs.readFileSync(SRC_PATH, "utf8");
  const rawJson = JSON.parse(rawText);

  if (Array.isArray(rawJson.result)) return rawJson.result;
  if (Array.isArray(rawJson)) return rawJson;
  return [];
}

function buildProvinceAdminInfo(list) {
  const result = [];

  list.forEach((item) => {
    const level = Number(item.CAP_DIACHINH || 0);
    if (level !== 1) return;

    const code = String(item.MA_DIACHINH || item.MA_SO || "").trim();
    const name = item.TEN_DIACHINH || "";
    if (!code || !name) return;

    const provinceInfo = {
      code,
      name,
      officeAddress: item.TRU_SO || "",
      centerName: item.TEN_TRUNGTAM_HANHCHINH || "",
      scale: item.QUY_MO || "",
      totalUnits:
        typeof item.SOLUONG_XA === "number"
          ? item.SOLUONG_XA
          : typeof item.SOLUONG_DVHC_CAPXA === "number"
          ? item.SOLUONG_DVHC_CAPXA
          : null,
      area: typeof item.DIEN_TICH === "number" ? item.DIEN_TICH : null,
      postalCode: item.MA_BUUDIEN || "",
      vehicleCode: item.MA_BIENSOXE || "",
      phoneCode: item.MA_DIENTHOAI || "",
      lat:
        typeof item.LAT_TRUNGDIEM === "string" ||
        typeof item.LAT_TRUNGDIEM === "number"
          ? Number(item.LAT_TRUNGDIEM)
          : null,
      lng:
        typeof item.LONG_TRUNGDIEM === "string" ||
        typeof item.LONG_TRUNGDIEM === "number"
          ? Number(item.LONG_TRUNGDIEM)
          : null,
    };

    result.push(provinceInfo);
  });

  return result;
}

function main() {
  const list = loadSource();
  const provinces = buildProvinceAdminInfo(list);

  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    source: "dataThamKhao/json/vietnam-address.json",
    provinces,
  };

  fs.writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2), "utf8");
  console.log(
    `Static province admin API written to ${path.relative(
      __dirname,
      OUT_FILE
    )} with ${provinces.length} provinces.`
  );
}

main();

