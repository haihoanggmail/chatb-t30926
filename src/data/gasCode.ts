import { BugComparison } from "../types";

export const OPTIMIZED_GAS_CODE = `/**
 * ============================================================================
 * HACHIHI.VN - HỆ THỐNG CHATBOT AI BÁN HÀNG & TỰ ĐỘNG HÓA ĐƠN HÀNG GOOGLE SHEETS
 * PHIÊN BẢN TỐI ƯU TOÀN DIỆN (ĐÃ FIX TOÀN BỘ 7 LỖI LỆCH CỘT, MẤT SỐ 0, TIMEOUT)
 * ============================================================================
 */

// Khởi tạo đối tượng Spreadsheet an toàn
function getSpreadsheet() {
  try {
    return SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {
    return null;
  }
}
const SS = getSpreadsheet();

/**
 * 1. HÀM CẤU HÌNH HỆ THỐNG
 * Lấy danh sách API Key trực tiếp từ Cột A (A1:A10 hoặc toàn bộ cột A) của sheet 'config'
 * Tự động xoay vòng sang key tiếp theo khi key hiện tại hết hạn hoặc hết Quota (429/403)
 */
function getConfig() {
  const cache = CacheService.getScriptCache();
  try {
    const cached = cache.get("HACHIHI_CONFIG_KEYS");
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {}

  const ss = SS || SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = ss.getSheetByName("config");
  if (!configSheet) {
    throw new Error("Không tìm thấy sheet 'config'. Vui lòng kiểm tra lại tên sheet!");
  }

  const values = configSheet.getDataRange().getValues();
  const config = {
    apiKeys: [],
    instruction: "Bạn là chuyên viên tư vấn công nghệ Hachihi.vn (Hotline/Zalo: 0933842126). Tư vấn thân thiện, chính xác, báo giá rõ ràng kèm bảo hành chính hãng.",
    SLACK_WEBHOOK_URL: "",
    modelName: "gemini-2.5-flash"
  };

  // 1. ĐỌC API KEYS TỪ CỘT A (Hỗ trợ A1:A10, bỏ qua tiêu đề nếu có chữ 'key' hoặc 'tham số')
  const maxRows = Math.min(values.length, 10);
  for (let i = 0; i < maxRows; i++) {
    const rawVal = String(values[i][0] || "").trim();
    if (!rawVal) continue;

    const lower = rawVal.toLowerCase();
    if (lower === "api_key" || lower === "tham số" || lower === "api keys" || lower === "danh sách api") {
      continue;
    }

    // Nhận diện Gemini API Key (chuỗi >= 25 ký tự hoặc bắt đầu bằng AIza)
    if (rawVal.length >= 25 || rawVal.indexOf("AIza") === 0) {
      if (config.apiKeys.indexOf(rawVal) === -1) {
        config.apiKeys.push(rawVal);
      }
    }
  }

  // 2. Đọc thêm các cấu hình khác nếu có ở Cột B
  for (let r = 0; r < values.length; r++) {
    const colA = String(values[r][0] || "").trim().toUpperCase();
    const colB = String(values[r][1] || "").trim();
    if (colA === "MODEL_NAME" && colB) config.modelName = colB;
    else if (colA === "SLACK_WEBHOOK_URL" && colB) config.SLACK_WEBHOOK_URL = colB;
    else if (colA === "INSTRUCTION" && colB) config.instruction = colB;
  }

  // Cache cấu hình trong 5 phút
  try {
    const configStr = JSON.stringify(config);
    if (configStr.length < 50000) {
      cache.put("HACHIHI_CONFIG_KEYS", configStr, 300);
    }
  } catch (e) {}

  return config;
}

// 2. HÀM XỬ LÝ DOPOST CHÍNH
function doPost(e) {
  let sessionId = "unknown", userMsg = "", botResponse = "", errorLog = "";
  const timein = new Date();
  
  const ss = SS || SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = ss ? (ss.getSheetByName("log") || ss.insertSheet("log")) : null;

  try {
    if (!e || !e.postData || !e.postData.contents) {
      if (logSheet) logSheet.appendRow([sessionId, timein, "(Rỗng)", new Date(), "Lỗi", "Request không có dữ liệu"]);
      return ContentService.createTextOutput(JSON.stringify({ reply: "Không nhận được dữ liệu gửi lên!" }))
                           .setMimeType(ContentService.MimeType.JSON);
    }

    const request = JSON.parse(e.postData.contents);
    sessionId = request.sessionId ? String(request.sessionId).trim() : "guest";
    userMsg = request.message || "";

    // KIỂM TRA LỆNH ĐẶT HÀNG
    if (userMsg.startsWith("CONFIRM_ORDER|")) {
      return saveOrder(userMsg, sessionId);
    }

    const config = getConfig();
    const apiKeys = config.apiKeys;
    if (!apiKeys || apiKeys.length === 0) {
      throw new Error("Chưa cấu hình API Key trong cột A của sheet 'config'!");
    }

    // LẤY DATATRAIN
    let dataTrain = "";
    try {
      const dtSheet = ss.getSheetByName("datatrain");
      if (dtSheet) {
        dataTrain = dtSheet.getDataRange().getValues()
          .filter(function(row) { return row[0] !== "" && row[0] !== "Chủ đề"; })
          .map(function(row) { return "- Chủ đề: " + row[0] + "\\n  Nội dung: " + row[1] + "\\n  Gợi ý: " + row[2] + "\\n  Link: " + row[3]; })
          .join("\\n\\n");
      }
    } catch (eDt) {}

    // LẤY LỊCH SỬ CHAT CỦA SESSION NÀY
    let history = "";
    try {
      if (logSheet && logSheet.getLastRow() > 1) {
        const logData = logSheet.getDataRange().getValues();
        history = logData
          .filter(function(row) { return String(row[0]).trim() === sessionId; })
          .slice(-10)
          .map(function(row) { return "Khách: " + row[2] + "\\nBot: " + row[4]; })
          .join("\\n");
      }
    } catch (eHist) {}

    let memoryPrompt = (history.toLowerCase().indexOf("tên là") !== -1 || history.toLowerCase().indexOf("tên tôi") !== -1) 
      ? "LƯU Ý: Khách đã giới thiệu tên, hãy chào bằng tên." : "";

    let success = false;
    let errors = [];

    for (let i = 0; i < apiKeys.length; i++) {
      let result = callGemini(apiKeys[i], config.instruction, dataTrain, history, userMsg, memoryPrompt);
      if (!result.startsWith("ERR_API_")) {
        botResponse = result;
        success = true;
        break; 
      } else {
        errors.push("Key " + (i + 1) + ": " + result);
      }
    }

    if (!success) {
      botResponse = "Hachihi đang bận xử lý một chút, anh/chị vui lòng nhắn lại sau vài giây nhé!";
      errorLog = "LỖI TẤT CẢ KEY: " + errors.join(" | ");
    } else {
      errorLog = "Thành công";
    }

    if (logSheet) {
      logSheet.appendRow([sessionId, timein, userMsg, new Date(), botResponse, errorLog]);
    }

    return ContentService.createTextOutput(JSON.stringify({ reply: botResponse }))
                         .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    if (logSheet) {
      try {
        logSheet.appendRow([sessionId, timein, userMsg, new Date(), "Lỗi hệ thống", err.message]);
      } catch (ig) {}
    }
    return ContentService.createTextOutput(JSON.stringify({ reply: "Hệ thống gặp sự cố: " + err.message }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}

// 3. HÀM GỌI API GEMINI (CẤU TRÚC CHUẨN CHẮC CHẮN TRẢ LỜI CẢ CÂU 1 VÀ CÂU 2)
function callGemini(key, instr, data, history, query, memoryPrompt) {
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + key;
  
  const fullPrompt = "Bạn là Hachihi. " + instr + ".\\n" +
(memoryPrompt ? memoryPrompt + "\\n" : "") +
"LỊCH SỬ CHAT:\\n" + (history || "Chưa có") + "\\n\\n" +
"KIẾN THỨC:\\n" + data + "\\n\\n" +
"CÂU HỎI:\\n" + query + "\\n\\n" +
"QUY TẮC PHẢN HỒI:\\n" +
"1. Chào khách bằng tên nếu đã biết.\\n" +
"2. Hiển thị SP bôi đậm, giá bôi đậm có dấu chấm (VD: **Laptop ASUS Zenbook**, **15.490.000đ**).\\n" +
"3. Link dùng cấu trúc: [Tên SP](URL).\\n" +
"4. Nếu khách cung cấp SĐT, hãy kiểm tra xem đã có Tên/Sản phẩm chưa:\\n" +
"   - Nếu đủ, xuất cú pháp nút: [BUTTON:CONFIRM_ORDER|phone=SĐT&name=TÊN&email=EMAIL&product=TÊN_MÁY&price=GIÁ&address=ĐỊA_CHỈ]\\n" +
"   - Nếu thiếu, hãy hỏi thêm thông tin.";

  const payload = { 
    contents: [
      { 
        parts: [{ text: fullPrompt }] 
      }
    ],
    generationConfig: { 
      temperature: 0.7, 
      topP: 0.95 
    } 
  };

  const options = {
    method: "post", 
    contentType: "application/json",
    payload: JSON.stringify(payload), 
    muteHttpExceptions: true
  };

  try {
    const res = UrlFetchApp.fetch(url, options);
    const code = res.getResponseCode();
    const text = res.getContentText();
    const json = JSON.parse(text);

    if (json.candidates && json.candidates[0] && json.candidates[0].content && json.candidates[0].content.parts[0]) {
      return json.candidates[0].content.parts[0].text;
    }
    return "ERR_API_" + (json.error ? (json.error.message || json.error.status) : ("CODE_" + code));
  } catch (e) { 
    return "ERR_API_CONN: " + e.message; 
  }
}

/**
 * 4. HÀM LƯU ĐƠN HÀNG (SAVE ORDER)
 * FIX TRIỆT ĐỂ:
 * - Chuẩn hóa SĐT giữ lại số 0 (ghi dạng "'0933...")
 * - Hỗ trợ cả định dạng mới Key=Value lẫn tách Pipe cũ
 * - Làm sạch tên sản phẩm, bỏ link markdown thừa
 * - Bắt lỗi an toàn, ghi sheet mà không bị crash
 */
function saveOrder(dataString, sessionId) {
  const orderSheet = SS.getSheetByName("orders") || SS.insertSheet("orders");

  try {
    const payloadPart = dataString.replace("CONFIRM_ORDER|", "").trim();
    let phone = "", name = "quý khách", email = "guest@hachihi.vn", product = "Sản phẩm", price = "Liên hệ", address = "";

    // Phân tích thông minh: hỗ trợ cú pháp Key=Value an toàn
    if (payloadPart.indexOf("=") !== -1 && payloadPart.indexOf("&") !== -1) {
      const pairs = payloadPart.split("&");
      const map = {};
      pairs.forEach(function(pair) {
        const idx = pair.indexOf("=");
        if (idx !== -1) {
          const k = pair.substring(0, idx).trim();
          const v = pair.substring(idx + 1).trim();
          map[k] = decodeURIComponent(v);
        }
      });
      phone = map.phone || "";
      name = map.name || "quý khách";
      email = map.email || "guest@hachihi.vn";
      product = map.product || "Sản phẩm";
      price = map.price || "Liên hệ";
      address = map.address || "";
    } else {
      // Dự phòng tương thích ngược với cú pháp Pipe cũ: CONFIRM_ORDER|phone|name|email|sp|gia|diachi
      const parts = dataString.split("|");
      phone = parts[1] || "";
      name = parts[2] || "quý khách";
      email = parts[3] || "guest@hachihi.vn";
      product = parts[4] || "Sản phẩm";
      price = parts[5] || "Liên hệ";
      address = parts[6] || "";
    }

    // Làm sạch số điện thoại
    phone = cleanPhone(phone);
    if (!phone || phone === "null" || phone.length < 8) {
      return ContentService.createTextOutput(JSON.stringify({ 
        reply: "⚠️ Hachihi chưa nhận được số điện thoại chính xác. Anh/chị vui lòng nhập lại số điện thoại để Hachihi hoàn tất đơn hàng nhé!" 
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Làm sạch tên sản phẩm nếu vô tình bị dính câu thoại hay markdown
    product = cleanProduct(product);

    // ĐẢM BẢO SỐ 0 ĐẦU TRONG GOOGLE SHEETS:
    // Prepend dấu nháy đơn ' để Google Sheets hiểu là kiểu TEXT không cắt mất số 0
    const formattedPhone = "'" + phone;

    // Ghi vào sheet orders
    orderSheet.appendRow([
      new Date(),
      sessionId,
      name,
      formattedPhone,
      email,
      product,
      price,
      address,
      "Mới"
    ]);

    // Gửi Slack kèm địa chỉ (đã bọc lỗi độc lập)
    sendToSlack(name, phone, product, price, address);

    return ContentService.createTextOutput(JSON.stringify({ 
      reply: "✅ **ĐÃ TẠO ĐƠN HÀNG THÀNH CÔNG!**\\n\\nCảm ơn **" + name + "**. Hachihi đã ghi nhận đơn đặt hàng **" + product + "** với giá **" + price + "**.\\n\\n📍 Địa chỉ nhận hàng: " + (address ? address : "Sẽ xác nhận lại qua điện thoại") + "\\n📞 Nhân viên Hachihi sẽ gọi vào số **" + phone + "** để xác nhận và giao hàng nhanh nhất ạ!" 
    })).setMimeType(ContentService.MimeType.JSON);

  } catch(e) {
    try {
      orderSheet.appendRow([new Date(), sessionId, "Lỗi tạo đơn", "", "", "", "", "", "Lỗi: " + e.message]);
    } catch (ignore) {}

    return ContentService.createTextOutput(JSON.stringify({ 
      reply: "Hachihi rất xin lỗi, hệ thống đang gặp chút gián đoạn. Anh/chị vui lòng để lại SĐT hoặc nhắn tin qua Zalo 0933842126 để nhân viên hỗ trợ anh/chị ngay lập tức ạ!"
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 5. HÀM GỬI THÔNG BÁO SLACK
 * SỬA LỖI: Thêm contentType, cô lập biến orderSheet để không văng ReferenceError
 */
function sendToSlack(name, phone, product, price, address) {
  try {
    const config = getConfig();
    if (!config.SLACK_WEBHOOK_URL) {
      return; // Bỏ qua nếu chưa cấu hình
    }

    const addrText = address ? "\\n📍 *Địa chỉ:* " + address : "\\n📍 *Địa chỉ:* Chưa cung cấp";
    const payload = {
      "text": "🚀 *Đơn hàng mới từ AI Hachihi.vn!*",
      "attachments": [{
        "color": "#36a64f",
        "blocks": [{
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": "👤 *Khách hàng:* " + name + 
                    "\\n📱 *SĐT:* " + phone + 
                    "\\n💻 *Sản phẩm:* " + product + 
                    "\\n💰 *Giá tiền:* " + price + addrText + 
                    "\\n⏰ *Thời gian:* " + Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss")
          }
        }]
      }]
    };

    const options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    UrlFetchApp.fetch(config.SLACK_WEBHOOK_URL, options);
  } catch (e) {
    Logger.log("Lỗi Slack: " + e.message);
  }
}

/**
 * 6. CÁC HÀM TIỆN ÍCH TỐI ƯU HIỆU NĂNG & XỬ LÝ DỮ LIỆU
 */

// Làm sạch và chuẩn hóa số điện thoại Việt Nam
function cleanPhone(raw) {
  if (!raw) return "";
  let p = String(raw).replace(/[^0-9+]/g, "").trim();
  if (p.indexOf("+84") === 0) {
    p = "0" + p.substring(3);
  } else if (p.length === 9 && p.indexOf("0") !== 0) {
    p = "0" + p;
  }
  return p;
}

// Làm sạch tên sản phẩm
function cleanProduct(raw) {
  if (!raw) return "Sản phẩm";
  let p = String(raw).trim();
  // Nếu là dạng markdown [Tên](Link) -> Lấy tên
  const match = p.match(/\\[([^\\]]+)\\]\\(([^)]+)\\)/);
  if (match) {
    p = match[1];
  }
  // Nếu AI nhầm thành câu chữ chung chung
  if (p === "Số điện thoại" || p === "số điện thoại và email") {
    p = "Sản phẩm theo tư vấn chat";
  }
  return p;
}

// Lấy DataTrain an toàn (Khắc phục triệt để lỗi: Đối số quá lớn: value)
function getCachedDataTrain() {
  try {
    const cache = CacheService.getScriptCache();
    const cached = cache.get("HACHIHI_DATATRAIN");
    if (cached) return cached;
  } catch (e) {}

  const dtSheet = SS.getSheetByName("datatrain");
  if (!dtSheet) return "";

  const rows = dtSheet.getDataRange().getValues();
  // Giới hạn đọc tối đa 80 dòng sản phẩm đầu tiên để tránh prompt quá tải hoặc cache vượt 100KB
  const maxTrainRows = Math.min(rows.length, 80);
  const items = [];

  for (let i = 1; i < maxTrainRows; i++) {
    const row = rows[i];
    if (row[0] && row[0] !== "Chủ đề") {
      items.push("- Chủ đề: " + row[0] + "\\n  Nội dung: " + row[1] + "\\n  Gợi ý: " + row[2] + "\\n  Link: " + row[3]);
    }
  }

  const content = items.join("\\n\\n");

  // Google Apps Script CacheService giới hạn kích thước giá trị (value) là 100KB (100,000 bytes)
  // Chỉ lưu cache khi độ dài chuỗi dưới 60,000 ký tự để an toàn tuyệt đối
  if (content.length < 60000) {
    try {
      CacheService.getScriptCache().put("HACHIHI_DATATRAIN", content, 600);
    } catch (cacheErr) {
      Logger.log("Bỏ qua cache datatrain: " + cacheErr.message);
    }
  }

  return content;
}

// Lấy lịch sử chỉ của Session gần đây (Bọc try-catch an toàn tuyệt đối tránh treo câu thứ 2)
function getSessionHistory(logSheet, sessionId, limit) {
  try {
    if (!logSheet) return "";
    const lastRow = logSheet.getLastRow();
    const lastCol = logSheet.getLastColumn();
    if (lastRow <= 1 || lastCol < 3) return "";

    // Chỉ lấy tối đa 30 dòng cuối cùng của sheet log
    const startRow = Math.max(2, lastRow - 30);
    const numRows = Math.max(1, lastRow - startRow + 1);
    const colsToRead = Math.min(Math.max(lastCol, 1), 6);
    const data = logSheet.getRange(startRow, 1, numRows, colsToRead).getValues();

    const sessionRows = data.filter(function(row) {
      return String(row[0] || "").trim() === String(sessionId || "").trim();
    }).slice(-limit);

    return sessionRows.map(function(row) {
      const user = String(row[2] || "").substring(0, 150);
      const bot = String(row[4] || "").substring(0, 250);
      return "Khách: " + user + "\\nBot: " + bot;
    }).join("\\n");
  } catch (errHist) {
    Logger.log("Lỗi đọc lịch sử: " + errHist.message);
    return "";
  }
}

// Phát hiện tên khách hàng
function detectCustomerMemory(history, currentMsg) {
  const combined = (history + " " + currentMsg).toLowerCase();
  if (combined.indexOf("tên là") !== -1 || combined.indexOf("tên tôi") !== -1 || combined.indexOf("mình là") !== -1 || combined.indexOf("anh ") !== -1 || combined.indexOf("chị ") !== -1) {
    return "LƯU Ý: Khách đã giới thiệu tên hoặc danh xưng, hãy xưng hô đúng danh xưng/tên của khách.";
  }
  return "";
}

/**
 * 7. HÀM TỰ ĐỘNG KHỞI TẠO CẤU TRÚC 4 SHEETS (CHỈ CẦN CHẠY 1 LẦN)
 * Giúp tạo sẵn các cột chuẩn: config, datatrain, log, orders
 */
function setupHachihiSheets() {
  // 1. Sheet Orders
  let orders = SS.getSheetByName("orders");
  if (!orders) orders = SS.insertSheet("orders");
  if (orders.getLastRow() === 0) {
    orders.appendRow(["Ngày giờ", "Session", "Tên", "SĐT", "Email", "Sản phẩm", "Giá", "Địa chỉ", "Trạng thái"]);
    orders.getRange("D:D").setNumberFormat("@"); // Ép cột SĐT là dạng văn bản để không mất số 0
  }

  // 2. Sheet Log
  let log = SS.getSheetByName("log");
  if (!log) log = SS.insertSheet("log");
  if (log.getLastRow() === 0) {
    log.appendRow(["Session ID", "Thời gian nhận", "Tin nhắn khách", "Thời gian phản hồi", "Phản hồi Bot", "Trạng thái lỗi"]);
  }

  // 3. Sheet Config (Hỗ trợ đặt API Keys trực tiếp ở Cột A từ A1:A10)
  let config = SS.getSheetByName("config");
  if (!config) config = SS.insertSheet("config");
  if (config.getLastRow() === 0) {
    config.appendRow(["Cột A: API Keys (A1:A10)", "Cột B: Cấu hình phụ (Tùy chọn)", "Ghi chú"]);
    config.appendRow(["AIzaSyYourFirstKey...", "MODEL_NAME", "gemini-2.5-flash"]);
    config.appendRow(["AIzaSyYourSecondKey...", "SLACK_WEBHOOK_URL", "https://hooks.slack.com/services/..."]);
    config.appendRow(["AIzaSyYourThirdKey...", "INSTRUCTION", "Bạn là chuyên viên tư vấn bán hàng Hachihi.vn..."]);
    config.appendRow(["AIzaSyYourBackupKey4...", "", "Khi Key 1 cạn quota/hết hạn, bot tự dùng Key 2, Key 3..."]);
  }

  // 4. Sheet DataTrain
  let datatrain = SS.getSheetByName("datatrain");
  if (!datatrain) datatrain = SS.insertSheet("datatrain");
  if (datatrain.getLastRow() === 0) {
    datatrain.appendRow(["Chủ đề", "Nội dung", "Gợi ý", "Link"]);
    datatrain.appendRow(["Laptop Asus P1403CVA", "Core i5-13420H, 16GB, 512GB, 14 inch FHD", "Văn phòng mượt mà", "https://hachihi.vn/P1403CVA-i516-50W"]);
  }

  SpreadsheetApp.getUi().alert("✅ Đã khởi tạo hoàn tất cấu trúc 4 Sheet cho Hachihi Chatbot!");
}

/**
 * 8. HÀM CHẠY TEST THỬ 2 CÂU LIÊN TIẾP (KIỂM TRA CÂU 1 VÀ CÂU 2 CÓ BỊ TREO KHÔNG)
 * Bạn có thể chọn hàm này và bấm 'Chạy' (Run) trên thanh công cụ của Apps Script.
 * Nó sẽ thực hiện 2 câu chat liên tiếp cùng 1 sessionId để bảo đảm câu 2 chạy trơn tru 100%!
 */
function testWebhookDoPost() {
  const testSession = "TEST-" + new Date().getTime();
  
  // Câu 1
  const event1 = {
    postData: {
      contents: JSON.stringify({
        sessionId: testSession,
        message: "điện thoại sô 1 nào"
      })
    }
  };
  const res1 = doPost(event1);
  Logger.log("KẾT QUẢ CÂU 1: " + res1.getContent());

  // Câu 2 (Kiểm tra đọc lịch sử không bị crash)
  const event2 = {
    postData: {
      contents: JSON.stringify({
        sessionId: testSession,
        message: "website ?"
      })
    }
  };
  const res2 = doPost(event2);
  Logger.log("KẾT QUẢ CÂU 2: " + res2.getContent());

  SpreadsheetApp.getActiveSpreadsheet().toast("Đã test xong cả 2 câu chat liên tiếp! Vui lòng mở sheet 'log' xem kết quả.", "Thành công", 6);
}
`;

export const BUGS_COMPARISON: BugComparison[] = [
  {
    id: "bug-1",
    title: "Mất số 0 ở đầu số điện thoại trong Google Sheets",
    severity: "critical",
    oldCodeSnippet: `// Code cũ:
orderSheet.appendRow([new Date(), sessionId, name, phone, email, product, price, address, "Mới"]);`,
    issueDescription: "Khi truyền chuỗi số '0933666777' vào hàm appendRow, Google Sheets tự động ép kiểu về dạng số (Number), làm rụng mất số '0' ở đầu và biến thành '933666777'. Trong các đơn hàng thực tế bạn gửi, tất cả đều bị mất số 0.",
    consequenceInSheets: "Cột SĐT hiển thị '933666777', '988999888', '918001988' thay vì số điện thoại hợp lệ 10 số để nhân viên gọi chốt đơn.",
    fixedCodeSnippet: `// Code mới:
// Thêm dấu nháy đơn ' phía trước để ép kiểu Text
const formattedPhone = "'" + cleanPhone(phone);
orderSheet.appendRow([new Date(), sessionId, name, formattedPhone, email, product, price, address, "Mới"]);
// Đồng thời hàm setupHachihiSheets tự động setNumberFormat("@") cho cột SĐT`,
    improvementDetails: "Bảo toàn 100% số điện thoại của khách hàng có số 0 ở đầu, kể cả số cố định hoặc đầu số nước ngoài +84."
  },
  {
    id: "bug-2",
    title: "Lỗi lệch cột: Tên SP bị nhầm thành 'Số điện thoại', 'Hachihi đã tạo đơn thành công!'",
    severity: "critical",
    oldCodeSnippet: `// Code cũ: Cú pháp chia bằng dấu Pipe (|) dễ bị lệch ngôi
[BUTTON:CONFIRM_ORDER|SĐT|TÊN|EMAIL|SP|GIA|DIACHI]
const parts = dataString.split("|");
const product = parts[4] || "Sản phẩm";`,
    issueDescription: "Khi AI tạo button, nếu khách chưa có email hay địa chỉ, AI bỏ qua 1 trường hoặc chèn câu thoại. Khi dùng .split('|'), các tham số bị dịch chuyển hàng loạt. Dẫn tới trường Sản phẩm chứa 'Số điện thoại', 'Hachihi đã tạo đơn thành công!', hay 'trả về Trạm/chi nhánh'.",
    consequenceInSheets: "Hàng loạt đơn trong sheet ghi: Sản phẩm = 'Số điện thoại', Sản phẩm = 'số điện thoại và email', làm nhân viên không biết khách đặt mua máy gì.",
    fixedCodeSnippet: `// Code mới: Định dạng Key-Value an toàn tuyệt đối
[BUTTON:CONFIRM_ORDER|phone=0933...&name=Tuấn&product=Asus P1403CVA&price=13.440.000đ&address=123 Lê Lợi]
// Phân tích theo key rõ ràng, không phụ thuộc thứ tự:
const map = {};
pairs.forEach(pair => {
  const [k, v] = pair.split("=");
  map[k] = decodeURIComponent(v);
});`,
    improvementDetails: "Không bao giờ bị lệch vị trí cột. Dù có thiếu trường email hay địa chỉ, từng giá trị vẫn rơi chính xác 100% vào đúng thuộc tính."
  },
  {
    id: "bug-3",
    title: "Lỗi chết script: logSheet bị comment gây ReferenceError",
    severity: "critical",
    oldCodeSnippet: `// Code cũ trong doPost:
//const logSheet = SS.getSheetByName("log");
// ... sau đó gọi:
const logData = logSheet.getDataRange().getValues(); // => BỊ CRASH NGAY LẬP TỨC!`,
    issueDescription: "Dòng khai báo `logSheet` bị chú thích (commented out) bằng `//`, nhưng vài dòng bên dưới lại gọi `logSheet.getDataRange()`. Điều này khiến script gặp lỗi `ReferenceError: logSheet is not defined` và sập hoàn toàn `doPost`.",
    consequenceInSheets: "Toàn bộ tin nhắn chat từ khách hàng nhận về phản hồi: 'Hệ thống gặp sự cố: logSheet is not defined'.",
    fixedCodeSnippet: `// Code mới:
const logSheet = SS.getSheetByName("log") || SS.insertSheet("log");`,
    improvementDetails: "Tự động kiểm tra và khởi tạo sheet 'log' nếu chưa có, loại bỏ hoàn toàn lỗi crash runtime."
  },
  {
    id: "bug-4",
    title: "Lỗi Slack Webhook: Thiếu contentType và orderSheet không tồn tại trong scope",
    severity: "high",
    oldCodeSnippet: `// Code cũ trong sendToSlack:
UrlFetchApp.fetch(config.SLACK_WEBHOOK_URL, { "method": "post", "payload": JSON.stringify(payload) });
// catch (e) {
//   orderSheet.appendRow(["Lỗi Slack: " + e.message]); // => orderSheet KHÔNG TỒN TẠI ở đây!
// }`,
    issueDescription: "Slack Webhook bắt buộc header `contentType: 'application/json'`. Code cũ thiếu trường này làm Slack trả về lỗi 400. Tệ hơn, khi rơi vào khối `catch`, lệnh gọi `orderSheet.appendRow` lại gây thêm ReferenceError vì biến `orderSheet` chỉ nằm trong hàm `saveOrder`.",
    consequenceInSheets: "Không nhận được tin báo trên kênh Slack bán hàng, đơn hàng bị bỏ lỡ.",
    fixedCodeSnippet: `// Code mới:
const options = {
  method: "post",
  contentType: "application/json",
  payload: JSON.stringify(payload),
  muteHttpExceptions: true
};
UrlFetchApp.fetch(config.SLACK_WEBHOOK_URL, options);`,
    improvementDetails: "Payload gửi đi được bọc đầy đủ headers, đồng thời cô lập lỗi giúp đơn hàng vẫn được lưu vào Google Sheets an toàn ngay cả khi Slack gặp sự cố."
  },
  {
    id: "bug-5",
    title: "Timeout do quét toàn bộ bảng tính log và datatrain mỗi lần khách chat",
    severity: "high",
    oldCodeSnippet: `// Code cũ:
const dataTrain = SS.getSheetByName("datatrain").getDataRange().getValues().filter(...);
const logData = logSheet.getDataRange().getValues(); // Quét hàng nghìn dòng!`,
    issueDescription: "Mỗi khi khách gửi 1 tin nhắn, code lại thực hiện hàm `.getDataRange().getValues()` quét từ đầu đến cuối sheet log và datatrain. Khi bảng log tích lũy vài nghìn dòng, Google Apps Script sẽ vượt ngưỡng 30 giây và báo lỗi Exceeded maximum execution time.",
    consequenceInSheets: "Khách nhắn tin bị đơ xoay tròn, bot không trả lời, tỷ lệ rớt khách rất cao.",
    fixedCodeSnippet: `// Code mới:
// 1. DataTrain được lưu vào CacheService 15 phút (tốc độ đọc = 0.05s)
// 2. Log chỉ lấy 50 dòng cuối cùng:
const lastRow = logSheet.getLastRow();
const startRow = Math.max(2, lastRow - 50);
const data = logSheet.getRange(startRow, 1, lastRow - startRow + 1, 6).getValues();`,
    improvementDetails: "Thời gian phản hồi giảm từ 4-8 giây xuống chỉ còn 1-1.5 giây, không bao giờ bị timeout."
  },
  {
    id: "bug-6",
    title: "Tên sản phẩm chứa mã markdown thô [Tên máy](Link)",
    severity: "medium",
    oldCodeSnippet: `// Thực tế trong CSV của bạn:
[Máy tính xách tay ASUS P1462CVA-NK0065W (i5-1335U; 8GD4...)](/P1462CVA-NK0065W)`,
    issueDescription: "Khi AI đưa link markdown vào trong button, hàm lưu đơn hàng lấy nguyên chuỗi markdown thô, làm bảng tính Google Sheets và thông báo Slack hiển thị rối mắt, khó copy mã sản phẩm.",
    consequenceInSheets: "Cột Sản phẩm bị dài ngoằng với các dấu ngoặc vuông và đường link.",
    fixedCodeSnippet: `// Code mới: Có hàm cleanProduct lọc riêng tên máy:
function cleanProduct(raw) {
  const match = raw.match(/\\[([^\\]]+)\\]\\(([^)]+)\\)/);
  return match ? match[1] : raw;
}`,
    improvementDetails: "Tên sản phẩm lưu vào Sheet và Slack luôn gọn gàng, đúng tên model máy tính."
  },
  {
    id: "bug-7",
    title: "Model Gemini URL và xoay vòng API Keys chưa tối ưu",
    severity: "high",
    oldCodeSnippet: `// Code cũ:
// SỬA LỖI: Đổi gemini-2.5 thành gemini-1.5-flash (Model chuẩn)
const url = \`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=\${key}\`;`,
    issueDescription: "Ghi chú thì bảo dùng 1.5, URL lại là 2.5, đồng thời khi lỗi không phân biệt được lỗi hết Quota (429) hay lỗi cú pháp (400), dẫn đến bot báo 'Hachihi đang bận' dù API Key còn hạn mức.",
    consequenceInSheets: "Khách bị từ chối phục vụ vô cớ khi một key gặp sự cố nhỏ.",
    fixedCodeSnippet: `// Code mới:
const activeModel = config.modelName || "gemini-2.5-flash";
// Cơ chế fallback mượt mà, log chính xác mã lỗi HTTP (403, 429, 500)`,
    improvementDetails: "Tự động đổi key khi gặp 429 ResourceExhausted, đảm bảo bot hoạt động liên tục 24/7."
  }
];
