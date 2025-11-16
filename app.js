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
  const openWikiBtn = document.getElementById("openWikiBtn");
  const donateBtn = document.getElementById("donateBtn");
  const donateModal = document.getElementById("donateModal");
  const donateBackdrop = document.getElementById("donateBackdrop");
  const donateClose = document.getElementById("donateClose");
  const themeToggle = document.getElementById("themeToggle");
  const themeIcon = document.getElementById("themeIcon");
  const headerEl = document.querySelector(".header");

  initTheme(themeToggle, themeIcon);

  if (headerEl) {
    const couponToggle = document.createElement("button");
    couponToggle.id = "couponToggle";
    couponToggle.className = "coupon-toggle";
    couponToggle.type = "button";
    couponToggle.title = "Các khoá học Udemy";
    couponToggle.setAttribute(
      "aria-label",
      "Các khoá học Udemy"
    );
    couponToggle.innerHTML =
      '<i class="fa-solid fa-graduation-cap"></i><span class="coupon-label">Các khoá học Udemy</span>';
    headerEl.appendChild(couponToggle);

    const udemyPanel = document.createElement("div");
    udemyPanel.id = "udemyPanel";
    udemyPanel.className = "udemy-panel";
    udemyPanel.hidden = true;
    udemyPanel.innerHTML =
      '<div class="udemy-panel-header">' +
      '  <div class="udemy-panel-title">' +
      '    <i class="fa-solid fa-graduation-cap"></i>' +
      "    Udemy free coupon" +
      "  </div>" +
      '  <button id="udemyPanelClose" type="button" class="udemy-panel-close" aria-label="Đóng danh sách khoá học">' +
      '    <i class="fa-solid fa-xmark"></i>' +
      "  </button>" +
      "</div>" +
      '<p id="udemyPanelStatus" class="udemy-panel-status"></p>' +
      '<ul id="udemyPanelList" class="udemy-panel-list"></ul>';
    document.body.appendChild(udemyPanel);

    const udemyStatus = document.getElementById("udemyPanelStatus");
    const udemyList = document.getElementById("udemyPanelList");
    const udemyClose = document.getElementById("udemyPanelClose");

    couponToggle.addEventListener("click", async () => {
      if (!udemyPanel || !udemyStatus || !udemyList) return;

      if (!udemyPanel.hidden) {
        udemyPanel.hidden = true;
        return;
      }

      udemyPanel.hidden = false;
      udemyStatus.textContent =
        "Đang tải danh sách khoá học Udemy free...";
      udemyList.innerHTML = "";

      try {
        if (!isUdemyLoaded) {
          const res = await fetch(UDEMY_API_URL);
          if (!res.ok) {
            throw new Error("Không thể tải dữ liệu khoá học.");
          }
          const data = await res.json();
          const raw = Array.isArray(data.courses) ? data.courses : [];

          udemyCourses = raw.map((item) => {
            const url = String(item.url || "").trim();
            let title = url;
            const m = url.match(/\/course\/([^/?]+)/);
            if (m && m[1]) {
              title = decodeURIComponent(m[1]).replace(/-/g, " ");
            }
            return {
              url,
              coupon: String(item.coupon_code || "").trim(),
              title,
            };
          });

          isUdemyLoaded = true;
        }

        renderUdemyCourses(udemyCourses, udemyStatus, udemyList);
      } catch (error) {
        console.error("Lỗi tải Udemy free:", error);
        udemyStatus.textContent =
          "Không thể tải danh sách khoá học Udemy free. Vui lòng thử lại sau.";
      }
    });

    if (udemyClose) {
      udemyClose.addEventListener("click", () => {
        udemyPanel.hidden = true;
      });
    }

    const udemyAlias = document.createElement("div");
    udemyAlias.className = "udemy-alias";
    udemyAlias.textContent = "";
    headerEl.appendChild(udemyAlias);

    couponToggle.addEventListener(
      "click",
      (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        window.open(
          "https://nam17111998.github.io/Udemy_free/udemy_free/",
          "_blank"
        );
      },
      true
    );
  }

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
          "";
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

  if (openWikiBtn) {
    openWikiBtn.addEventListener("click", () => {
      const fallback =
        (document.getElementById("selectedProvince")?.textContent || "").trim();
      const name =
        (typeof currentProvinceIntroName === "string" &&
          currentProvinceIntroName.trim()) ||
        fallback;
      if (!name) return;
      const title = name.replace(/\s+/g, "_");
      const url =
        "https://vi.wikipedia.org/wiki/" + encodeURIComponent(title);
      window.open(url, "_blank");
    });
  }

  function openDonate() {
    if (donateModal) {
      donateModal.hidden = false;
    }
  }

  function closeDonate() {
    if (donateModal) {
      donateModal.hidden = true;
    }
  }

  if (donateBtn && donateModal) {
    donateBtn.addEventListener("click", openDonate);
  }

  if (donateBackdrop) {
    donateBackdrop.addEventListener("click", closeDonate);
  }

  if (donateClose) {
    donateClose.addEventListener("click", closeDonate);
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeDonate();
    }
  });

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
      const code = String(p.code || p.ma || p.ma_tinh || "").trim();
      const name = p.name || p.ten || "";
      if (!code || !name) return;

      const province = { code, name };
      adminProvinces.push(province);
      adminProvinceByCode.set(code, province);
    });
  }

  if (Array.isArray(dRaw)) {
    dRaw.forEach((d) => {
      const code = String(d.code || d.ma || d.ma_huyen || "").trim();
      const name = d.name || d.ten || "";
      const provinceCode = String(
        d.province_code || d.ma_tinh || ""
      ).trim();
      if (!code || !name || !provinceCode) return;

      const district = { code, name, provinceCode };
      adminDistricts.push(district);

      let list = adminDistrictsByProvince.get(provinceCode);
      if (!list) {
        list = [];
        adminDistrictsByProvince.set(provinceCode, list);
      }
      list.push(district);
    });
  }

  if (Array.isArray(wRaw)) {
    wRaw.forEach((w) => {
      const code = String(w.code || w.ma || w.ma_xa || "").trim();
      const name = w.name || w.ten || "";
      const districtCode = String(
        w.district_code || w.ma_huyen || ""
      ).trim();
      if (!code || !name || !districtCode) return;

      const ward = { code, name, districtCode };
      adminWards.push(ward);
      adminWardByCode.set(code, ward);

      let list = adminWardsByDistrict.get(districtCode);
      if (!list) {
        list = [];
        adminWardsByDistrict.set(districtCode, list);
      }
      list.push(ward);
    });
  }
}

function searchAll(query) {
  const q = normalizeText(query);
  if (!q) return { provinces: [], wards: [] };

  const provinceMatches = provinces.filter((p) =>
    normalizeText(p.name).includes(q)
  );

  const wardMatches = wards.filter((w) =>
    normalizeText(w.name).includes(q)
  );

  return { provinces: provinceMatches, wards: wardMatches };
}

function normalizeText(str) {
  if (!str) return "";
  return str
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .trim();
}

function renderResults(results) {
  const provinceList = document.getElementById("provinceResults");
  const wardList = document.getElementById("wardResults");
  if (!provinceList || !wardList) return;

  provinceList.innerHTML = "";
  wardList.innerHTML = "";

  results.provinces.forEach((p) => {
    const li = document.createElement("li");
    li.textContent = p.name;
    li.addEventListener("click", () => {
      selectProvinceFromResult(p);
    });
    provinceList.appendChild(li);
  });

  results.wards.forEach((w) => {
    const li = document.createElement("li");
    li.textContent = w.name;
    li.addEventListener("click", () => {
      selectWardFromResult(w);
    });
    wardList.appendChild(li);
  });
}

function clearResults() {
  const provinceList = document.getElementById("provinceResults");
  const wardList = document.getElementById("wardResults");
  if (provinceList) provinceList.innerHTML = "";
  if (wardList) wardList.innerHTML = "";
}

function hideSuggestions(list) {
  const ul = list || document.getElementById("suggestionList");
  if (ul) {
    ul.style.display = "none";
    ul.innerHTML = "";
  }
}

function buildSuggestions(results, suggestionList) {
  if (!suggestionList) return;
  suggestionList.innerHTML = "";

  const items = [];
  results.provinces.forEach((p) => {
    items.push({ type: "province", name: p.name });
  });
  results.wards.forEach((w) => {
    items.push({ type: "ward", name: w.name });
  });

  if (!items.length) {
    suggestionList.style.display = "none";
    return;
  }

  items.slice(0, 10).forEach((item) => {
    const li = document.createElement("li");
    li.className = "suggestion-item";

    const main = document.createElement("div");
    main.className = "suggestion-main";

    const title = document.createElement("div");
    title.className = "suggestion-title";
    title.textContent = item.name;

    const sub = document.createElement("div");
    sub.className = "suggestion-sub";
    sub.textContent =
      item.type === "province"
        ? "Tỉnh/Thành"
        : "Xã/Phường";

    main.appendChild(title);
    main.appendChild(sub);

    const typeLabel = document.createElement("div");
    typeLabel.className = "suggestion-type-label " + item.type;
    typeLabel.textContent =
      item.type === "province" ? "Tỉnh/Thành" : "Xã/Phường";

    li.appendChild(main);
    li.appendChild(typeLabel);

    li.addEventListener("click", () => {
      const searchInput = document.getElementById("searchInput");
      if (searchInput) {
        searchInput.value = item.name;
      }
      const results = searchAll(item.name);
      renderResults(results);
      hideSuggestions(suggestionList);
    });

    suggestionList.appendChild(li);
  });

  suggestionList.style.display = "block";
}

function onProvinceChange(provinceSelect, wardSelect) {
  const code = provinceSelect.value || "";
  currentProvinceCode = code;
  populateWardSelectForProvince(code, wardSelect);
  updateStatsForProvince(code);

  const province = provinceByCode.get(code);
  const provinceName = province ? province.name : "";

  updateSelectedInfo(provinceName, "", "");

  const searchInput = document.getElementById("searchInput");
  if (searchInput && provinceName) {
    searchInput.value = provinceName;
    const results = searchAll(provinceName);
    renderResults(results);
  }
}

function onWardChange(wardSelect, provinceSelect) {
  const wardCode = wardSelect.value || "";
  if (!wardCode) {
    const provinceCode = provinceSelect ? provinceSelect.value || "" : "";
    const province =
      provinceCode && provinceByCode.get(provinceCode);
    const provinceName = province ? province.name : "";
    updateSelectedInfo(provinceName, "", "");
    return;
  }

  const ward = wardByCode.get(wardCode);
  if (!ward) {
    return;
  }

  const province =
    ward.provinceCode && provinceByCode.get(ward.provinceCode);
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

function renderUdemyCourses(courses, statusEl, listEl) {
  if (!statusEl || !listEl) return;

  listEl.innerHTML = "";

  if (!courses || !courses.length) {
    statusEl.textContent = "Hiện chưa có khoá học miễn phí nào.";
    return;
  }

  statusEl.textContent =
    "Có " + courses.length + " khoá học Udemy đang free coupon:";

  courses.forEach((c) => {
    const li = document.createElement("li");
    li.className = "udemy-panel-item";

    const a = document.createElement("a");
    a.href = c.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.className = "udemy-panel-link";
    a.textContent = c.title || c.url;

    const meta = document.createElement("div");
    meta.className = "udemy-panel-meta";
    meta.textContent = c.coupon
      ? "Coupon: " + c.coupon
      : "Free coupon (không có mã riêng)";

    li.appendChild(a);
    li.appendChild(meta);
    listEl.appendChild(li);
  });
}
