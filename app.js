const MAIN_DATA_URL = "dataThamKhao/json/data.json";
const MERGER_DATA_URL = "dataThamKhao/json/data-new.json";
const ADMIN_PROVINCE_URL = "data/tinh.json";
const ADMIN_DISTRICT_URL = "data/huyen.json";
const ADMIN_WARD_URL = "data/xa.json";

let provinces = [];
let wards = [];
let provinceByCode = new Map();
let wardsByProvince = new Map();
let wardByCode = new Map();

let currentProvinceCode = "";
let isMainDataLoaded = false;
let mergerByWardCode = new Map();
let isMergerDataLoaded = false;

let adminProvinces = [];
let adminDistricts = [];
let adminWards = [];
let adminProvinceByCode = new Map();
let adminDistrictsByProvince = new Map();
let adminWardsByDistrict = new Map();
let adminWardByCode = new Map();
let isAdminDataLoaded = false;
let currentProvinceIntroName = "";

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const statusMessage = document.getElementById("statusMessage");
  const clearBtn = document.getElementById("clearBtn");
  const suggestionList = document.getElementById("suggestionList");
  const provinceSelect = document.getElementById("provinceSelect");
  const districtSelect = document.getElementById("districtSelect");
  const wardSelect = document.getElementById("wardSelect");
  const convertProvinceSelect = document.getElementById(
    "convertProvinceSelect"
  );
  const convertDistrictSelect = document.getElementById(
    "convertDistrictSelect"
  );
  const convertWardSelect = document.getElementById("convertWardSelect");
  const convertFromOldBtn = document.getElementById("convertFromOldBtn");
  const copyAddressBtn = document.getElementById("copyAddressBtn");
  const openSpecialtyBtn = document.getElementById("openSpecialtyBtn");
  const themeToggle = document.getElementById("themeToggle");
  const themeIcon = document.getElementById("themeIcon");

  initTheme(themeToggle, themeIcon);

  loadMainData()
    .then(() => {
      isMainDataLoaded = true;

      updateStatsForAll();
      populateProvinceSelect(provinceSelect);
      populateWardSelectForProvince("", wardSelect);
      updateStatsForProvince("");
      updateSelectedInfo("", "", "");

      if (statusMessage) {
        statusMessage.textContent =
          "Nhập từ khóa để bắt đầu tra cứu (không phân biệt hoa/thường, dấu).";
      }
    })
    .catch((error) => {
      console.error("Lỗi tải dữ liệu chính:", error);
      if (statusMessage) {
        statusMessage.textContent =
          "Không thể tải dữ liệu. Vui lòng kiểm tra lại thư mục dataThamKhao/json.";
      }
    });

  loadAdminData()
    .then(() => {
      isAdminDataLoaded = true;
      populateConvertProvinceSelect(convertProvinceSelect);
      if (provinceSelect) {
        populateProvinceSelect(provinceSelect);
      }
    })
    .catch((error) => {
      console.error("Lỗi tải dữ liệu 3 cấp:", error);
    });

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const query = searchInput.value.trim();

      if (clearBtn) {
        clearBtn.style.display = query ? "inline-flex" : "none";
      }

      if (!isMainDataLoaded) {
        if (statusMessage) {
          statusMessage.textContent = "Đang tải dữ liệu, vui lòng chờ...";
        }
        return;
      }

      if (!query) {
        clearResults();
        hideSuggestions(suggestionList);
        if (statusMessage) {
          statusMessage.textContent =
            "Nhập từ khóa để bắt đầu tra cứu (ví dụ: Ha Noi, Quan 1, Phuong Ben Nghe...).";
        }
        return;
      }

      const results = searchAll(query);
      renderResults(results);
      buildSuggestions(results, suggestionList);
    });

    searchInput.addEventListener("blur", () => {
      setTimeout(() => hideSuggestions(suggestionList), 150);
    });
  }

  if (openSpecialtyBtn) {
    openSpecialtyBtn.addEventListener("click", () => {
      const provinceEl = document.getElementById("selectedProvince");
      if (!provinceEl) return;
      const name = (provinceEl.textContent || "").trim();
      if (!name) return;
      const q = `đặc sản ${name}`;
      const url =
        "https://www.google.com/search?q=" + encodeURIComponent(q);
      window.open(url, "_blank");
    });
  }

  if (provinceSelect) {
    provinceSelect.addEventListener("change", () => {
      if (isAdminDataLoaded && districtSelect) {
        const code = provinceSelect.value || "";
        populateConvertDistrictSelect(code, districtSelect, wardSelect);
      }
      onProvinceChange(provinceSelect, wardSelect);
    });
  }

  if (districtSelect) {
    districtSelect.addEventListener("change", () => {
      if (!isAdminDataLoaded) return;
      const code = districtSelect.value || "";
      populateConvertWardSelect(code, wardSelect);
    });
  }

  if (wardSelect) {
    wardSelect.addEventListener("change", () => {
      onWardChange(wardSelect, provinceSelect);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      onClearClick(searchInput, provinceSelect, wardSelect, statusMessage);
    });
  }

  if (convertProvinceSelect) {
    convertProvinceSelect.addEventListener("change", () => {
      if (!isAdminDataLoaded) return;
      const code = convertProvinceSelect.value || "";
      populateConvertDistrictSelect(
        code,
        convertDistrictSelect,
        convertWardSelect
      );
    });
  }

  if (convertDistrictSelect) {
    convertDistrictSelect.addEventListener("change", () => {
      if (!isAdminDataLoaded) return;
      const code = convertDistrictSelect.value || "";
      populateConvertWardSelect(code, convertWardSelect);
    });
  }

  if (convertWardSelect) {
    convertWardSelect.addEventListener("change", () => {
      handleConvertFromHierarchy();
    });
  }

  if (convertFromOldBtn) {
    convertFromOldBtn.addEventListener("click", () => {
      handleConvertFromHierarchy();
    });
  }

  if (copyAddressBtn) {
    copyAddressBtn.addEventListener("click", () => {
      const addressEl = document.getElementById("selectedAddress");
      const addressText = addressEl ? addressEl.textContent.trim() : "";
      if (!addressText) return;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(addressText).catch(() => {});
      }
    });
  }
});

function initTheme(themeToggle, themeIcon) {
  if (!themeToggle || !themeIcon) return;

  const applyTheme = (mode) => {
    if (mode === "light") {
      document.body.classList.add("light-mode");
      themeIcon.classList.remove("fa-moon");
      themeIcon.classList.add("fa-sun");
    } else {
      document.body.classList.remove("light-mode");
      themeIcon.classList.remove("fa-sun");
      themeIcon.classList.add("fa-moon");
    }
  };

  const savedMode =
    localStorage.getItem("theme-mode") === "light" ? "light" : "dark";
  applyTheme(savedMode);

  themeToggle.addEventListener("click", () => {
    const isLight = document.body.classList.contains("light-mode");
    const nextMode = isLight ? "dark" : "light";
    applyTheme(nextMode);
    localStorage.setItem("theme-mode", nextMode);
  });
}

async function loadMainData() {
  const res = await fetch(MAIN_DATA_URL);
  if (!res.ok) {
    throw new Error("Không thể tải dữ liệu tra cứu (MAIN_DATA_URL).");
  }

  const raw = await res.json();
  buildMainDataFromRaw(raw);
}

function buildMainDataFromRaw(raw) {
  provinces = [];
  wards = [];
  provinceByCode = new Map();
  wardsByProvince = new Map();
  wardByCode = new Map();

  if (!Array.isArray(raw)) return;

  if (raw.length && raw[0] && Array.isArray(raw[0].wards)) {
    raw.forEach((p) => {
      const provinceCode = String(p.province_code || "").trim();
      if (!provinceCode) return;

      const province = {
        code: provinceCode,
        name: p.name || "",
        shortName: p.short_name || p.name || "",
        type: p.place_type || "",
      };

      provinces.push(province);
      provinceByCode.set(provinceCode, province);

      if (Array.isArray(p.wards)) {
        p.wards.forEach((w) => {
          const wardCode = String(w.ward_code || "").trim();
          if (!wardCode) return;

          const wardProvinceCode = String(
            w.province_code || provinceCode
          ).trim();

          const ward = {
            code: wardCode,
            name: w.name || "",
            provinceCode: wardProvinceCode,
          };

          wards.push(ward);
          wardByCode.set(wardCode, ward);

          let list = wardsByProvince.get(wardProvinceCode);
          if (!list) {
            list = [];
            wardsByProvince.set(wardProvinceCode, list);
          }
          list.push(ward);
        });
      }
    });
  } else {
    const provinceMap = new Map();

    raw.forEach((item) => {
      const provinceCode = String(item.province_code || "").trim();
      const provinceName = item.province_name || "";
      if (!provinceCode || !provinceName) return;

      if (!provinceMap.has(provinceCode)) {
        const province = {
          code: provinceCode,
          name: provinceName,
          shortName: item.province_short_name || provinceName,
          type: item.place_type || "",
        };
        provinceMap.set(provinceCode, province);
        provinces.push(province);
        provinceByCode.set(provinceCode, province);
      }

      const wardCode = String(item.ward_code || "").trim();
      const wardName = item.ward_name || "";
      if (!wardCode || !wardName) return;

      const ward = {
        code: wardCode,
        name: wardName,
        provinceCode,
      };

      wards.push(ward);
      wardByCode.set(wardCode, ward);

      let list = wardsByProvince.get(provinceCode);
      if (!list) {
        list = [];
        wardsByProvince.set(provinceCode, list);
      }
      list.push(ward);
    });
  }
}

async function loadAdminData() {
  const [pRes, dRes, wRes] = await Promise.all([
    fetch(ADMIN_PROVINCE_URL),
    fetch(ADMIN_DISTRICT_URL),
    fetch(ADMIN_WARD_URL),
  ]);

  if (!pRes.ok || !dRes.ok || !wRes.ok) {
    throw new Error("Không thể tải dữ liệu 3 cấp từ thư mục data.");
  }

  const [pRaw, dRaw, wRaw] = await Promise.all([
    pRes.json(),
    dRes.json(),
    wRes.json(),
  ]);

  adminProvinces = [];
  adminDistricts = [];
  adminWards = [];
  adminProvinceByCode = new Map();
  adminDistrictsByProvince = new Map();
  adminWardsByDistrict = new Map();
  adminWardByCode = new Map();

  if (Array.isArray(pRaw)) {
    pRaw.forEach((p) => {
      const code = String(p.code || "").trim();
      if (!code) return;
      const province = {
        code,
        name: p.name || "",
        shortName: p.short_name || p.name || "",
        type: p.type || "",
      };
      adminProvinces.push(province);
      adminProvinceByCode.set(code, province);
    });
  }

  if (Array.isArray(dRaw)) {
    dRaw.forEach((d) => {
      const code = String(d.code || "").trim();
      const parent = String(d.parent_code || "").trim();
      if (!code || !parent) return;
      const district = {
        code,
        name: d.name || "",
        shortName: d.short_name || d.name || "",
        type: d.type || "",
        provinceCode: parent,
      };
      adminDistricts.push(district);
      let list = adminDistrictsByProvince.get(parent);
      if (!list) {
        list = [];
        adminDistrictsByProvince.set(parent, list);
      }
      list.push(district);
    });
  }

  if (Array.isArray(wRaw)) {
    wRaw.forEach((w) => {
      const code = String(w.code || "").trim();
      const parent = String(w.parent_code || "").trim();
      if (!code || !parent) return;
      const ward = {
        code,
        name: w.name || "",
        shortName: w.short_name || w.name || "",
        type: w.type || "",
        districtCode: parent,
      };
      adminWards.push(ward);
      adminWardByCode.set(code, ward);
      let list = adminWardsByDistrict.get(parent);
      if (!list) {
        list = [];
        adminWardsByDistrict.set(parent, list);
      }
      list.push(ward);
    });
  }
}

function normalizeText(str) {
  if (!str) return "";
  return str
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase();
}

function searchCollection(items, rawQuery, fields) {
  const query = normalizeText(rawQuery);
  if (!query) return [];

  return items.filter((item) => {
    const combined = fields
      .map((field) => normalizeText(item[field] || ""))
      .join(" ");
    return combined.includes(query);
  });
}

function searchAll(rawQuery) {
  const provincePool = currentProvinceCode
    ? provinces.filter((p) => p.code === currentProvinceCode)
    : provinces;

  const wardPool = currentProvinceCode
    ? wardsByProvince.get(currentProvinceCode) || []
    : wards;

  const provinceResults = searchCollection(provincePool, rawQuery, [
    "name",
    "shortName",
  ]);
  const wardResults = searchCollection(wardPool, rawQuery, ["name"]);

  return { provinceResults, wardResults };
}

function clearResults() {
  const provinceList = document.getElementById("provinceResults");
  const wardList = document.getElementById("wardResults");

  if (provinceList) provinceList.innerHTML = "";
  if (wardList) wardList.innerHTML = "";
}

function renderResults(results) {
  clearResults();

  const provinceList = document.getElementById("provinceResults");
  const wardList = document.getElementById("wardResults");
  const statusMessage = document.getElementById("statusMessage");

  if (!provinceList || !wardList) return;

  const { provinceResults, wardResults } = results;

  if (statusMessage) {
    if (!provinceResults.length && !wardResults.length) {
      statusMessage.textContent = "Không tìm thấy kết quả phù hợp.";
    } else {
      statusMessage.textContent = `Tìm thấy ${provinceResults.length} tỉnh/thành và ${wardResults.length} xã/phường.`;
    }
  }

  provinceResults.forEach((p) => {
    const label = p.shortName || p.name;
    const hierarchy = p.type || "Tỉnh / Thành phố";
    provinceList.appendChild(createResultItem(label, hierarchy));
  });

  wardResults.forEach((w) => {
    const province = w.provinceCode
      ? provinceByCode.get(w.provinceCode)
      : null;

    const provinceName = province ? province.shortName || province.name : "";
    const label = w.name || "";

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

function buildSuggestions(results, suggestionList) {
  const listElement =
    suggestionList || document.getElementById("suggestionList");
  if (!listElement) return;

  const items = [];

  results.provinceResults.slice(0, 5).forEach((p) => {
    items.push({
      type: "province",
      code: p.code,
      label: p.name,
    });
  });

  results.wardResults.slice(0, 15).forEach((w) => {
    items.push({
      type: "ward",
      code: w.code,
      provinceCode: w.provinceCode,
      label: w.name,
    });
  });

  if (!items.length) {
    hideSuggestions(listElement);
    return;
  }

  listElement.innerHTML = "";

  items.forEach((item) => {
    const li = document.createElement("li");
    li.className = "suggestion-item";
    li.dataset.type = item.type;
    li.dataset.code = item.code || "";
    if (item.provinceCode) {
      li.dataset.provinceCode = item.provinceCode;
    }

    const main = document.createElement("div");
    main.className = "suggestion-main";

    const title = document.createElement("div");
    title.className = "suggestion-title";
    title.textContent = item.label;
    main.appendChild(title);

    if (item.type === "ward") {
      const province =
        item.provinceCode && provinceByCode.get(item.provinceCode);
      if (province) {
        const sub = document.createElement("div");
        sub.className = "suggestion-sub";
        sub.textContent = province.name;
        main.appendChild(sub);
      }
    }

    li.appendChild(main);

    const typeLabel = document.createElement("span");
    typeLabel.className = `suggestion-type-label ${item.type}`;
    typeLabel.textContent =
      item.type === "province" ? "Tỉnh/TP" : "Xã/Phường";
    li.appendChild(typeLabel);

    li.addEventListener("mousedown", (event) => {
      event.preventDefault();
      applySuggestionSelection(item);
    });

    listElement.appendChild(li);
  });

  listElement.style.display = "block";
}

function hideSuggestions(suggestionList) {
  const listElement =
    suggestionList || document.getElementById("suggestionList");
  if (!listElement) return;

  listElement.innerHTML = "";
  listElement.style.display = "none";
}

function applySuggestionSelection(item) {
  const provinceSelect = document.getElementById("provinceSelect");
  const wardSelect = document.getElementById("wardSelect");
  const searchInput = document.getElementById("searchInput");

  if (item.type === "province") {
    currentProvinceCode = item.code || "";

    if (provinceSelect) {
      provinceSelect.value = currentProvinceCode;
    }

    populateWardSelectForProvince(currentProvinceCode, wardSelect);
    updateStatsForProvince(currentProvinceCode);

    const province =
      currentProvinceCode && provinceByCode.get(currentProvinceCode);
    const provinceName = province ? province.name : "";

    updateSelectedInfo(provinceName, "", "");

    if (searchInput) {
      searchInput.value = item.label || "";
      const results = searchAll(item.label || "");
      renderResults(results);
    }
  } else if (item.type === "ward") {
    const provinceCode = item.provinceCode || "";
    currentProvinceCode = provinceCode;

    if (provinceSelect) {
      provinceSelect.value = provinceCode;
    }

    populateWardSelectForProvince(provinceCode, wardSelect);
    updateStatsForProvince(provinceCode);

    if (wardSelect) {
      wardSelect.value = item.code || "";
    }

    const province = provinceCode ? provinceByCode.get(provinceCode) : null;
    const provinceName = province ? province.name : "";
    const wardName = item.label || "";
    const wardCode = item.code || "";

    updateSelectedInfo(provinceName, wardName, wardCode);

    if (searchInput) {
      searchInput.value = wardName;
      const results = searchAll(wardName);
      renderResults(results);
    }
  }

  hideSuggestions();
}

function onProvinceChange(provinceSelect, wardSelect) {
  if (!isMainDataLoaded) return;

  const provinceCode = provinceSelect ? provinceSelect.value || "" : "";
  currentProvinceCode = provinceCode;

  populateWardSelectForProvince(provinceCode, wardSelect);
  updateStatsForProvince(provinceCode);

  const province = provinceCode ? provinceByCode.get(provinceCode) : null;
  const provinceName = province ? province.name : "";

  updateSelectedInfo(provinceName, "", "");

  const searchInput = document.getElementById("searchInput");
  const query = searchInput ? searchInput.value.trim() : "";
  if (query) {
    const results = searchAll(query);
    renderResults(results);
  } else {
    clearResults();
  }
}

function onWardChange(wardSelect, provinceSelect) {
  if (!isMainDataLoaded) return;

  const wardCode = wardSelect ? wardSelect.value || "" : "";
  const provinceCode =
    currentProvinceCode || (provinceSelect ? provinceSelect.value || "" : "");

  if (!provinceCode && !wardCode) {
    clearSelection();
    return;
  }

  const province = provinceCode ? provinceByCode.get(provinceCode) : null;
  const list = provinceCode ? wardsByProvince.get(provinceCode) || [] : wards;
  const ward = wardCode ? list.find((w) => w.code === wardCode) : null;

  const provinceName = province ? province.name : "";
  const wardName = ward ? ward.name : "";
  const finalWardCode = ward ? ward.code : wardCode;

  updateSelectedInfo(provinceName, wardName, finalWardCode);

  const searchInput = document.getElementById("searchInput");
  const query = wardName || provinceName;
  if (searchInput && !searchInput.value.trim()) {
    searchInput.value = query;
  }
  if (query) {
    const results = searchAll(query);
    renderResults(results);
  }
}

function onClearClick(searchInput, provinceSelect, wardSelect, statusMessage) {
  if (searchInput) {
    searchInput.value = "";
  }

  currentProvinceCode = "";

  if (provinceSelect) {
    provinceSelect.value = "";
  }

  populateWardSelectForProvince("", wardSelect);

  clearResults();
  clearSelection();
  hideSuggestions();
  updateStatsForProvince("");

  if (statusMessage) {
    statusMessage.textContent =
      "Nhập từ khóa để bắt đầu tra cứu (ví dụ: Ha Noi, Quan 1, Phuong Ben Nghe...).";
  }

  const clearButton = document.getElementById("clearBtn");
  if (clearButton) {
    clearButton.style.display = "none";
  }
}

function populateProvinceSelect(provinceSelect) {
  if (!provinceSelect) return;

  provinceSelect.innerHTML =
    '<option value="">-- Chọn Tỉnh/Thành phố --</option>';

  const sorted = [...provinces].sort((a, b) =>
    (a.name || "").localeCompare(b.name || "", "vi", {
      sensitivity: "base",
    })
  );

  sorted.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.code;
    opt.textContent = p.name;
    provinceSelect.appendChild(opt);
  });
}

function populateWardSelectForProvince(provinceCode, wardSelect) {
  const select = wardSelect || document.getElementById("wardSelect");
  if (!select) return;

  select.innerHTML = '<option value="">-- Chọn Xã/Phường --</option>';

  if (!provinceCode) {
    return;
  }

  const list = wardsByProvince.get(provinceCode) || [];
  const sorted = [...list].sort((a, b) =>
    (a.name || "").localeCompare(b.name || "", "vi", {
      sensitivity: "base",
    })
  );

  sorted.forEach((w) => {
    const opt = document.createElement("option");
    opt.value = w.code;
    opt.textContent = w.name;
    select.appendChild(opt);
  });
}

function populateConvertProvinceSelect(select) {
  if (!select) return;

  select.innerHTML =
    '<option value="">-- Chọn Tỉnh/Thành phố --</option>';

  const sorted = [...adminProvinces].sort((a, b) =>
    (a.name || "").localeCompare(b.name || "", "vi", {
      sensitivity: "base",
    })
  );

  sorted.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.code;
    opt.textContent = p.name;
    select.appendChild(opt);
  });

  const districtSelect = document.getElementById("convertDistrictSelect");
  const wardSelect = document.getElementById("convertWardSelect");
  if (districtSelect) {
    districtSelect.innerHTML =
      '<option value="">-- Chọn Quận/Huyện --</option>';
  }
  if (wardSelect) {
    wardSelect.innerHTML = '<option value="">-- Chọn Xã/Phường --</option>';
  }
}

function populateConvertDistrictSelect(
  provinceCode,
  districtSelect,
  wardSelect
) {
  if (!districtSelect) return;

  districtSelect.innerHTML =
    '<option value="">-- Chọn Quận/Huyện --</option>';
  if (wardSelect) {
    wardSelect.innerHTML = '<option value="">-- Chọn Xã/Phường --</option>';
  }

  if (!provinceCode) return;

  const list = adminDistrictsByProvince.get(provinceCode) || [];
  const sorted = [...list].sort((a, b) =>
    (a.name || "").localeCompare(b.name || "", "vi", {
      sensitivity: "base",
    })
  );

  sorted.forEach((d) => {
    const opt = document.createElement("option");
    opt.value = d.code;
    opt.textContent = d.name;
    districtSelect.appendChild(opt);
  });
}

function populateConvertWardSelect(districtCode, wardSelect) {
  if (!wardSelect) return;

  wardSelect.innerHTML = '<option value="">-- Chọn Xã/Phường --</option>';

  if (!districtCode) return;

  const list = adminWardsByDistrict.get(districtCode) || [];
  const sorted = [...list].sort((a, b) =>
    (a.name || "").localeCompare(b.name || "", "vi", {
      sensitivity: "base",
    })
  );

  sorted.forEach((w) => {
    const opt = document.createElement("option");
    opt.value = w.code;
    opt.textContent = w.name;
    wardSelect.appendChild(opt);
  });
}

function handleConvertFromHierarchy() {
  const convertResult = document.getElementById("convertResult");
  const provinceSelect = document.getElementById("convertProvinceSelect");
  const districtSelect = document.getElementById("convertDistrictSelect");
  const wardSelect = document.getElementById("convertWardSelect");

  if (!convertResult || !provinceSelect || !districtSelect || !wardSelect) {
    return;
  }

  if (!isAdminDataLoaded) {
    convertResult.textContent =
      "Dữ liệu 3 cấp chưa tải xong, vui lòng thử lại sau.";
    convertResult.className = "convert-result convert-result--error";
    return;
  }

  const provinceCode = provinceSelect.value || "";
  const districtCode = districtSelect.value || "";
  const wardCode = wardSelect.value || "";

  if (!provinceCode) {
    convertResult.textContent = "Vui lòng chọn Tỉnh/Thành phố.";
    convertResult.className = "convert-result convert-result--empty";
    return;
  }

  if (!districtCode) {
    convertResult.textContent = "Vui lòng chọn Quận/Huyện.";
    convertResult.className = "convert-result convert-result--empty";
    return;
  }

  if (!wardCode) {
    convertResult.textContent = "Vui lòng chọn Xã/Phường.";
    convertResult.className = "convert-result convert-result--empty";
    return;
  }

  const province = adminProvinceByCode.get(provinceCode);
  const districts = adminDistrictsByProvince.get(provinceCode) || [];
  const district =
    districts.find((d) => d.code === districtCode) || null;
  const ward = adminWardByCode.get(wardCode);

  if (!ward) {
    convertResult.textContent =
      "Không tìm thấy địa chỉ tương ứng trong dữ liệu.";
    convertResult.className = "convert-result convert-result--error";
    return;
  }

  const provinceName = province ? province.name : "";
  const districtName = district ? district.name : "";
  const wardName = ward.name || "";

  const parts = [];
  if (wardName) parts.push(wardName);
  if (districtName) parts.push(districtName);
  if (provinceName) parts.push(provinceName);
  parts.push("Việt Nam");
  const fullAddress = parts.join(", ");

  convertResult.innerHTML =
    `<div class="convert-result-main"><strong>Địa chỉ:</strong> ${fullAddress}</div>` +
    `<div class="convert-result-sub">Mã Xã/Phường: <strong>${ward.code}</strong></div>`;
  convertResult.className = "convert-result convert-result--ok";

  const mainWard = wardByCode.get(ward.code);
  const mainProvince =
    mainWard && mainWard.provinceCode
      ? provinceByCode.get(mainWard.provinceCode)
      : null;

  const targetProvinceName = mainProvince
    ? mainProvince.name
    : provinceName;
  const targetWardName = mainWard ? mainWard.name : wardName;
  const targetWardCode = mainWard ? mainWard.code : ward.code;

  const mainProvinceSelect = document.getElementById("provinceSelect");
  const mainWardSelect = document.getElementById("wardSelect");
  if (mainProvince && mainProvinceSelect) {
    currentProvinceCode = mainProvince.code;
    mainProvinceSelect.value = mainProvince.code;
    populateWardSelectForProvince(mainProvince.code, mainWardSelect);
    updateStatsForProvince(mainProvince.code);
    if (mainWardSelect && mainWard) {
      mainWardSelect.value = mainWard.code;
    }
  }

  updateSelectedInfo(
    targetProvinceName,
    targetWardName,
    targetWardCode
  );

  const searchInput = document.getElementById("searchInput");
  if (searchInput && targetWardName) {
    searchInput.value = targetWardName;
    if (isMainDataLoaded) {
      const results = searchAll(targetWardName);
      renderResults(results);
    }
  }
}

function updateStatsForAll() {
  const statProvincesEl = document.getElementById("statProvinces");
  const statWardsEl = document.getElementById("statWards");

  if (statProvincesEl) {
    statProvincesEl.textContent = String(provinces.length);
  }

  if (statWardsEl) {
    statWardsEl.textContent = String(wards.length);
  }
}

function updateStatsForProvince(provinceCode) {
  const statCurrentWardsEl = document.getElementById("statCurrentWards");
  if (!statCurrentWardsEl) return;

  if (!provinceCode) {
    statCurrentWardsEl.textContent = "0";
    return;
  }

  const list = wardsByProvince.get(provinceCode) || [];
  statCurrentWardsEl.textContent = String(list.length);
}

function updateSelectedInfo(provinceName, wardName, wardCode) {
  const selectedInfo = document.getElementById("selectedInfo");
  const provinceEl = document.getElementById("selectedProvince");
  const wardEl = document.getElementById("selectedWard");
  const codeEl = document.getElementById("selectedWardCode");
  const addressEl = document.getElementById("selectedAddress");
  const mapFrame = document.getElementById("mapFrame");

  if (!selectedInfo || !provinceEl || !wardEl || !codeEl) {
    return;
  }

  const hasAny =
    Boolean(provinceName && provinceName.trim()) ||
    Boolean(wardName && wardName.trim()) ||
    Boolean(wardCode && String(wardCode).trim());

  if (!hasAny) {
    selectedInfo.hidden = true;
    provinceEl.textContent = "";
    wardEl.textContent = "";
    codeEl.textContent = "";
    if (addressEl) {
      addressEl.textContent = "";
    }
    if (mapFrame) {
      mapFrame.removeAttribute("src");
    }
    return;
  }

  provinceEl.textContent = provinceName || "";
  wardEl.textContent = wardName || "";
  codeEl.textContent = wardCode || "";

  let fullAddress = "";
  if (addressEl) {
    const parts = [];
    if (wardName && wardName.trim()) parts.push(wardName.trim());
    if (provinceName && provinceName.trim())
      parts.push(provinceName.trim());
    parts.push("Việt Nam");
    fullAddress = parts.join(", ");
    addressEl.textContent = fullAddress;
  }

  if (mapFrame && fullAddress) {
    const zoom = wardName ? 14 : 8;
    const url =
      "https://www.google.com/maps?q=" +
      encodeURIComponent(fullAddress) +
      "&z=" +
      zoom +
      "&output=embed";
    mapFrame.src = url;
  }

  selectedInfo.hidden = false;

  if (provinceName && provinceName.trim()) {
    loadProvinceIntro(provinceName.trim());
  } else {
    loadProvinceIntro("");
  }
}

function clearSelection() {
  updateSelectedInfo("", "", "");
}

async function loadProvinceIntro(provinceName) {
  const introEl = document.getElementById("provinceIntro");
  const thumbEl = document.getElementById("provinceThumbnail");
  if (!introEl) return;

  if (!provinceName || !provinceName.trim()) {
    introEl.textContent = "";
    if (thumbEl) {
      thumbEl.src = "";
      thumbEl.alt = "";
      thumbEl.style.display = "none";
    }
    currentProvinceIntroName = "";
    return;
  }

  const name = provinceName.trim();
  if (name === currentProvinceIntroName) {
    return;
  }
  currentProvinceIntroName = name;

  if (thumbEl) {
    thumbEl.src = "";
    thumbEl.alt = "";
    thumbEl.style.display = "none";
  }

  introEl.textContent = "Đang tải giới thiệu...";

  const title = name.replace(/\s+/g, "_");
  const url =
    "https://vi.wikipedia.org/api/rest_v1/page/summary/" +
    encodeURIComponent(title);

  try {
    const res = await fetch(url);
    if (!res.ok) {
      introEl.textContent = "Không tìm thấy giới thiệu";
      return;
    }

    const data = await res.json();
    const extract = data && (data.extract || data.description || "");
    introEl.textContent =
      (extract && String(extract).trim()) || "Không tìm thấy giới thiệu";

    if (thumbEl && data && data.thumbnail && data.thumbnail.source) {
      thumbEl.src = data.thumbnail.source;
      thumbEl.alt = data.title || name;
      thumbEl.style.display = "block";
    }
  } catch (error) {
    console.error("Loi tai gioi thieu Wikipedia:", error);
    introEl.textContent = "Không tải được giới thiệu";
  }
}
