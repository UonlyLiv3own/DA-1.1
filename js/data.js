(function () {
  "use strict";
  const S = "DT xử lý",
    START = 9;
  let rows = [],
    source = "";
  const num = (v) => {
    if (typeof v === "number") return Number.isFinite(v) ? v : 0;
    if (v == null) return 0;
    let s = String(v).trim().replace(/\s/g, "");
    if (!s || s === "-") return 0;
    if (/^[-+]?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s))
      s = s.replace(/\./g, "").replace(",", ".");
    else if (/^[-+]?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, "");
    else s = s.replace(",", ".");
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  };
  const txt = (v) => (v == null ? "" : String(v).trim());
  const date = (v) => {
    if (!v) return "";
    if (v instanceof Date && !isNaN(v)) return v.toLocaleDateString("vi-VN");
    if (typeof v === "number" && v > 30000 && v < 100000) {
      const d = new Date(Date.UTC(1899, 11, 30) + v * 86400000);
      return d.toLocaleDateString("vi-VN", { timeZone: "UTC" });
    }
    return txt(v);
  };
  const C = {
    stt: 0,
    name: 1,
    house: 8,
    street: 9,
    ward: 10,
    address: 11,
    map: 12,
    parcel: 13,
    area: 15,
    land: 30,
    building: 36,
    trees: 37,
    moving: 38,
    support1: 39,
    support2: 40,
    support3: 41,
    support4: 42,
    base: 43,
    reward: 44,
    total: 45,
    consent: 46,
    clearance: 47,
    pa: 48,
    paDate: 49,
    decision: 50,
    decisionDate: 51,
    payDate: 52,
    paid: 53,
    bankDate: 54,
    bankAmount: 55,
    rewardDate: 56,
    rewardPaid: 57,
  };
  function parse(book) {
    const sh = book.Sheets[S];
    if (!sh)
      throw Error('Không tìm thấy sheet "' + S + '". File chỉ đọc sheet này.');
    const raw = XLSX.utils.sheet_to_json(sh, {
      header: 1,
      defval: null,
      raw: true,
    });
    const out = [];
    for (let i = START - 1; i < raw.length; i++) {
      const r = raw[i] || [],
        stt = r[C.stt],
        name = txt(r[C.name]);
      if (!/^\d+$/.test(txt(stt)) || !name) continue;
      const get = (k) => r[C[k]];
      const money = (k) => num(get(k));
      out.push({
        id: txt(stt),
        row: i + 1,
        name,
        address:
          txt(get("address")) ||
          [txt(get("house")), txt(get("street")), txt(get("ward"))]
            .filter(Boolean)
            .join(" "),
        house: txt(get("house")),
        street: txt(get("street")),
        ward: txt(get("ward")),
        map: txt(get("map")),
        parcel: txt(get("parcel")),
        area: money("area"),
        land: money("land"),
        building: money("building"),
        trees: money("trees"),
        moving: money("moving"),
        support: [
          money("support1"),
          money("support2"),
          money("support3"),
          money("support4"),
        ],
        base: money("base"),
        reward: money("reward"),
        total: money("total"),
        consent: /^[xX×]$/.test(txt(get("consent")))
          ? "Đồng ý"
          : "Chưa đánh dấu đồng ý",
        clearance: txt(get("clearance")),
        pa: txt(get("pa")),
        paDate: date(get("paDate")),
        decision: txt(get("decision")),
        decisionDate: date(get("decisionDate")),
        payDate: date(get("payDate")),
        paid: money("paid"),
        bankDate: date(get("bankDate")),
        bankAmount: money("bankAmount"),
        rewardDate: date(get("rewardDate")),
        rewardPaid: money("rewardPaid"),
      });
    }
    if (!out.length)
      throw Error("Không có dòng hồ sơ hợp lệ từ hàng 9, cột A/B.");
    return out;
  }
  async function load() {
    const custom = localStorage.getItem("kethanhda_uploaded");
    if (custom) {
      try {
        const arr = Uint8Array.from(atob(custom), (c) => c.charCodeAt(0));
        rows = parse(XLSX.read(arr, { type: "array" }));
        source = "File đã tải lên (lưu trong trình duyệt)";
        return;
      } catch (e) {
        localStorage.removeItem("kethanhda_uploaded");
      }
    }
    const res = await fetch(
      (document.body.dataset.root || "") + "data/du-toan.xlsx",
    );
    if (!res.ok) throw Error("Không tải được data/du-toan.xlsx");
    rows = parse(XLSX.read(await res.arrayBuffer(), { type: "array" }));
    source = "data/du-toan.xlsx";
  }
  async function upload(file) {
    const buf = await file.arrayBuffer();
    const parsed = parse(XLSX.read(buf, { type: "array" }));
    rows = parsed;
    source = file.name;
    try {
      const bytes = new Uint8Array(buf);
      let binary = "";
      for (let i = 0; i < bytes.length; i += 32768)
        binary += String.fromCharCode(...bytes.subarray(i, i + 32768));
      localStorage.setItem("kethanhda_uploaded", btoa(binary));
      return true;
    } catch (e) {
      localStorage.removeItem("kethanhda_uploaded");
      return false;
    }
  }
  function reset() {
    localStorage.removeItem("kethanhda_uploaded");
    location.reload();
  }
  const sum = (arr, key) => arr.reduce((a, r) => a + (Number(r[key]) || 0), 0);
  const stats = (arr) => ({
    count: arr.length,
    total: sum(arr, "total"),
    base: sum(arr, "base"),
    reward: sum(arr, "reward"),
    land: sum(arr, "land"),
    building: sum(arr, "building"),
    yes: arr.filter((r) => r.consent === "Đồng ý").length,
    no: arr.filter((r) => r.consent !== "Đồng ý").length,
    partial: arr.filter((r) => /một phần/i.test(r.clearance)).length,
    full: arr.filter((r) => /toàn phần/i.test(r.clearance)).length,
    paidRecorded: sum(arr, "paid"),
    rewardPaidRecorded: sum(arr, "rewardPaid"),
  });
  window.KTD = {
    load,
    upload,
    reset,
    get rows() {
      return rows;
    },
    get source() {
      return source;
    },
    stats,
    num,
    format: (n) => Math.round(n || 0).toLocaleString("vi-VN") + " đ",
    money: (n) => Math.round(n || 0).toLocaleString("vi-VN"),
    escape: (s) =>
      String(s ?? "").replace(
        /[&<>"']/g,
        (c) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[c],
      ),
  };
})();
