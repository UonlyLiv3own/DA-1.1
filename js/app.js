(async function () {
  const D = window.KTD,
    $ = (id) => document.getElementById(id),
    fmt = D.format,
    esc = D.escape;
  try {
    await D.load();
  } catch (e) {
    $("content").innerHTML =
      '<div class="notice">Lỗi nạp dữ liệu: ' + esc(e.message) + "</div>";
    return;
  }
  const file = $("file");
  if (file)
    file.addEventListener("change", async (e) => {
      if (!e.target.files[0]) return;
      try {
        const persistent = await D.upload(e.target.files[0]);
        render();
        if (!persistent)
          alert(
            "Đã đọc file, nhưng trình duyệt không đủ dung lượng để lưu cho lần mở sau. Hãy thay file data/du-toan.xlsx để cập nhật lâu dài.",
          );
      } catch (err) {
        alert(err.message);
      }
    });
  $("reset")?.addEventListener("click", D.reset);
  const view = document.body.dataset.view || "overview";
  const root = document.body.dataset.root || "";
  const listUrl = root + "pages/danh-sach.html",
    detailUrl = root + "pages/chi-tiet.html";
  function kpi(label, value, small = "") {
    return `<div class="kpi"><span>${label}</span><strong>${value}</strong><small>${small}</small></div>`;
  }
  function field(label, value) {
    return `<div class="field"><span>${esc(label)}</span><strong>${esc(value ?? "—") || "—"}</strong></div>`;
  }
  function tag(r) {
    return `<span class="tag ${r.consent === "Đồng ý" ? "ok" : "no"}">${esc(r.consent)}</span>`;
  }
  function render() {
    if ($("source"))
      $("source").textContent =
        "Nguồn: " +
        D.source +
        " · Sheet DT xử lý · " +
        D.rows.length +
        " trường hợp";
    const s = D.stats(D.rows);
    if (view === "overview") {
      $("content").innerHTML =
        `<div class="cards">${kpi("Tổng trường hợp", s.count)}${kpi("Tổng dự toán", fmt(s.total), "Bao gồm thưởng")}${kpi("Bồi thường, hỗ trợ", fmt(s.base), "Chưa gồm thưởng")}${kpi("Thưởng bàn giao", fmt(s.reward))}</div><div class="cols"><section class="panel"><h2>Tình trạng đồng thuận</h2><div class="bar"><div class="yes" style="width:${s.count ? (s.yes / s.count) * 100 : 0}%"></div><div class="no" style="width:${s.count ? (s.no / s.count) * 100 : 0}%"></div></div><div class="legend"><span><i class="dot yesdot"></i>Đã đánh dấu đồng ý: ${s.yes}</span><span><i class="dot nodot"></i>Chưa đánh dấu: ${s.no}</span></div><p class="muted">Trạng thái lấy trực tiếp từ dấu X cột AU. Chưa đánh dấu không mặc nhiên đồng nghĩa với phản đối.</p></section><section class="panel"><h2>Diện giải tỏa</h2><div class="details">${field("Một phần", s.partial + " trường hợp")}${field("Toàn phần", s.full + " trường hợp")}</div></section></div><section class="panel"><h2>Cơ cấu kinh phí</h2><div class="details">${field("Đất", fmt(s.land))}${field("Nhà, công trình", fmt(s.building))}${field("Bồi thường, hỗ trợ trước thưởng", fmt(s.base))}${field("Thưởng bàn giao", fmt(s.reward))}</div><div class="notice">Các trường BA–BF có dữ liệu liên quan đến chi trả, nhưng chưa xác minh quy tắc cộng và trạng thái xác nhận. Dashboard chưa hiển thị Đã chi / Chưa chi như số liệu giải ngân chính thức.</div></section><section class="panel"><h2>Hồ sơ tiêu biểu</h2>${table(D.rows.slice(0, 10))}<p><a class="btn" href="${listUrl}">Xem tất cả hồ sơ</a></p></section>`;
    } else if (view === "list") {
      $("content").innerHTML =
        `<section class="panel"><div class="filters"><input id="search" type="search" placeholder="Tìm tên, địa chỉ, số PA/QĐ, số tờ/thửa…"><select id="status"><option value="">Tất cả trạng thái</option><option value="yes">Đã đánh dấu đồng ý</option><option value="no">Chưa đánh dấu đồng ý</option></select><select id="clearance"><option value="">Tất cả diện giải tỏa</option><option value="Một phần">Một phần</option><option value="Toàn phần">Toàn phần</option></select></div><div id="result"></div></section>`;
      const update = () => {
        const q = $("search").value.trim().toLocaleLowerCase("vi-VN"),
          st = $("status").value,
          cl = $("clearance").value;
        const filtered = D.rows.filter(
          (r) =>
            (!q ||
              [r.name, r.address, r.pa, r.decision, r.map, r.parcel, r.id]
                .join(" ")
                .toLocaleLowerCase("vi-VN")
                .includes(q)) &&
            (!st ||
              (st === "yes"
                ? r.consent === "Đồng ý"
                : r.consent !== "Đồng ý")) &&
            (!cl || r.clearance === cl),
        );
        $("result").innerHTML =
          `<p class="muted">Hiển thị ${filtered.length} / ${D.rows.length} trường hợp</p>` +
          table(filtered);
      };
      ["search", "status", "clearance"].forEach((id) =>
        $(id).addEventListener("input", update),
      );
      update();
    } else if (view === "detail") {
      const id = new URLSearchParams(location.search).get("id"),
        r = D.rows.find((x) => x.id === id);
      if (!r) {
        $("content").innerHTML =
          '<div class="notice">Không tìm thấy hồ sơ. <a href="${listUrl}">Về danh sách</a></div>';
        return;
      }
      $("content").innerHTML =
        `<p><a href="${listUrl}">← Quay lại danh sách</a></p><section class="panel"><h2>${esc(r.name)}</h2><div class="details">${field("STT dự toán", r.id)}${field("Trạng thái", r.consent)}${field("Địa chỉ", r.address)}${field("Phường", r.ward)}${field("Số tờ", r.map)}${field("Số thửa", r.parcel)}${field("Diện tích giải tỏa", r.area + " m²")}${field("Diện giải tỏa", r.clearance)}${field("Số PA", r.pa)}${field("Ngày PA", r.paDate)}${field("Số QĐ", r.decision)}${field("Ngày QĐ", r.decisionDate)}</div></section><section class="panel"><h2>Chi tiết dự toán</h2><div class="details">${field("Bồi thường, hỗ trợ đất", fmt(r.land))}${field("Nhà, công trình", fmt(r.building))}${field("Cây trồng, tài sản khác", fmt(r.trees))}${field("Tháo dỡ, di chuyển", fmt(r.moving))}${r.support.map((v, i) => field(["Tự lo chỗ ở mới", "Suất tái định cư tối thiểu", "Gia đình có công / ổn định đời sống", "Di dời mồ mả / hỗ trợ di chuyển"][i], fmt(v))).join("")}${field("Tổng trước thưởng", fmt(r.base))}${field("Thưởng bàn giao", fmt(r.reward))}${field("Tổng bao gồm thưởng", fmt(r.total))}</div></section><section class="panel"><h2>Thông tin chi trả ghi nhận trong file</h2><div class="notice">Các giá trị dưới đây là dữ liệu nguyên trạng từ Excel, chưa xác minh là khoản thanh toán thực tế đã hoàn tất. Không tự cộng số tiền gửi ngân hàng vào số tiền chi.</div><div class="details">${field("Ngày chi BTHT", r.payDate)}${field("Số tiền BTHT (BB)", fmt(r.paid))}${field("Ngày gửi NH", r.bankDate)}${field("Số tiền gửi NH (BD)", fmt(r.bankAmount))}${field("Ngày chi thưởng", r.rewardDate)}${field("Số tiền thưởng (BF)", fmt(r.rewardPaid))}</div></section>`;
    } else if (view === "report") {
      $("content").innerHTML =
        `<div class="cards">${kpi("Trường hợp", s.count)}${kpi("Dự toán", fmt(s.total))}${kpi("Đã đánh dấu đồng ý", s.yes)}${kpi("Chưa đánh dấu", s.no)}</div><section class="panel"><h2>Thông tin phục vụ báo cáo lãnh đạo</h2><div class="details">${field("Bồi thường, hỗ trợ trước thưởng", fmt(s.base))}${field("Thưởng bàn giao", fmt(s.reward))}${field("Bồi thường đất", fmt(s.land))}${field("Nhà, công trình", fmt(s.building))}${field("Giải tỏa một phần", s.partial + " trường hợp")}${field("Giải tỏa toàn phần", s.full + " trường hợp")}</div><div class="notice">Đây là báo cáo dự toán từ DT xử lý, chưa phải báo cáo giải ngân đã đối soát. Chỉ tiêu đồng thuận dựa trên dấu X ở cột AU.</div><div class="actions"><button class="btn" onclick="window.print()">In / lưu PDF</button><a class="btn secondary" href="${listUrl}">Xem danh sách</a></div></section>`;
    }
  }
  function table(rows) {
    return `<div class="tablewrap"><table><thead><tr><th>STT</th><th>Họ tên</th><th>Địa chỉ</th><th>Diện tích (m²)</th><th>Trạng thái</th><th class="right">Tổng dự toán</th><th>Chi tiết</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${esc(r.id)}</td><td>${esc(r.name)}</td><td>${esc(r.address)}</td><td>${r.area.toLocaleString("vi-VN")}</td><td>${tag(r)}</td><td class="right">${fmt(r.total)}</td><td><a href="${detailUrl}?id=${encodeURIComponent(r.id)}">Xem →</a></td></tr>`).join("")}</tbody></table></div>`;
  }
  render();
})();
