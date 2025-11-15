const DATA_PATH = "dataThamKhao/json";
const FULL_DATA_URL = `${DATA_PATH}/data.json`;

let provinces = [];
let wards = [];

let provinceByCode = new Map();

let isDataLoaded = false;

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const statusMessage = document.getElementById("statusMessage");

  loadData()
    .then(() => {
      isDataLoaded = true;
      statusMessage.textContent =
        "Nhập từ khóa để bắt đầu tra cứu (không phân biệt hoa/thường, dấu).";
    })
    .catch((error) => {
      console.error("Lỗi tải dữ liệu:", error);
      statusMessage.textContent =
        "Không thể tải dữ liệu. Vui lòng kiểm tra lại thư mục dataThamKhao/json.";
    });

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const query = searchInput.value.trim();

      if (!isDataLoaded) {
        statusMessage.textContent = "Đang tải dữ liệu, vui lòng chờ...";
        return;
      }

      if (query.length === 0) {
        clearResults();
        statusMessage.textContent =
          "Nhập từ khóa để bắt đầu tra cứu (ví dụ: Ha Noi, Quan 1, Phuong Ben Nghe...).";
        return;
      }

      const results = searchAll(query);
      renderResults(results);
    });
  }
});

async function loadData() {
  const res = await fetch(FULL_DATA_URL);
  if (!res.ok) {
    throw new Error("Không thể tải file data.json đầy đủ.");
  }

  const raw = await res.json();
  buildFromFullData(raw);
}

function buildFromFullData(raw) {
  provinces = [];
  wards = [];
  provinceByCode.clear();

  if (!Array.isArray(raw)) return;

  raw.forEach((p) => {
    const provinceCode = p.province_code;
    const province = {
      code: provinceCode,
      name: p.name,
      short_name: p.short_name || p.name,
      type: p.place_type || "Tỉnh / Thành phố",
    };

    provinces.push(province);
    if (provinceCode) {
      provinceByCode.set(provinceCode, province);
    }

    if (Array.isArray(p.wards)) {
      p.wards.forEach((w) => {
        wards.push({
          code: w.ward_code,
          name: w.name,
          short_name: w.name,
          province_code: w.province_code || provinceCode,
        });
      });
    }
  });
}

function normalizeText(str) {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function searchCollection(items, rawQuery) {
  const query = normalizeText(rawQuery);
  if (!query) return [];

  return items.filter((item) => {
    const combined = `${item.name || ""} ${item.short_name || ""}`;
    const normalized = normalizeText(combined);
    return normalized.includes(query);
  });
}

function searchAll(query) {
  const provinceResults = searchCollection(provinces, query);
  const wardResults = searchCollection(wards, query);

  return { provinceResults, wardResults };
}

function clearResults() {
  const provinceList = document.getElementById("provinceResults");
  const wardList = document.getElementById("wardResults");

  if (provinceList) provinceList.innerHTML = "";
  if (wardList) wardList.innerHTML = "";
}

function renderResults({ provinceResults, wardResults }) {
  clearResults();

  const provinceList = document.getElementById("provinceResults");
  const wardList = document.getElementById("wardResults");
  const statusMessage = document.getElementById("statusMessage");

  if (!provinceList || !wardList || !statusMessage) {
    return;
  }

  if (provinceResults.length === 0 && wardResults.length === 0) {
    statusMessage.textContent = "Không tìm thấy kết quả phù hợp.";
  } else {
    statusMessage.textContent = `Tìm thấy ${provinceResults.length} tỉnh/thành và ${wardResults.length} xã/phường.`;
  }

  provinceResults.forEach((p) => {
    const label = p.short_name || p.name;
    const hierarchy = p.type || "Tỉnh / Thành phố";

    provinceList.appendChild(createResultItem(label, hierarchy));
  });

  wardResults.forEach((w) => {
    const province = w.province_code
      ? provinceByCode.get(w.province_code)
      : null;

    const provinceName = province
      ? province.short_name || province.name
      : "";

    const label = w.short_name || w.name;

    const hierarchy = provinceName
      ? `Xã/Phường - ${provinceName}`
      : "Xã/Phường";

    wardList.appendChild(createResultItem(label, hierarchy));
  });
}

function createResultItem(label, hierarchy) {
  const li = document.createElement("li");
  li.className = "result-item";

  const main = document.createElement("div");
  main.className = "result-main";
  main.textContent = label;
  li.appendChild(main);

  if (hierarchy) {
    const sub = document.createElement("div");
    sub.className = "result-sub";
    sub.textContent = hierarchy;
    li.appendChild(sub);
  }

  return li;
}

