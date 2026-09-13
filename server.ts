import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory orders store seeded with the user's historical orders
export interface OrderItem {
  id: string;
  timestamp: string;
  sessionId: string;
  name: string;
  phone: string;
  email: string;
  product: string;
  price: string;
  address: string;
  status: "Mới" | "Đã xác nhận" | "Đang giao" | "Hoàn thành" | "Đã hủy";
  isLegacyCorrupted?: boolean;
  corruptionReason?: string;
}

export interface TrainingItem {
  id: string;
  topic: string;
  content: string;
  suggestion: string;
  link: string;
}

let trainingData: TrainingItem[] = [
  {
    id: "dt-1",
    topic: "Laptop Asus P1403CVA văn phòng",
    content: "Máy tính xách tay ASUS P1403CVA-i516-50W (Intel Core i5-13420H, Intel UHD, 14 inch FHD, 16GB RAM, 512GB SSD, Xám, Win 11). Pin 50Wh, bảo hành 2 năm.",
    suggestion: "Phù hợp dân văn phòng, kế toán, sinh viên cần máy mượt 16GB RAM.",
    link: "https://hachihi.vn/P1403CVA-i516-50W"
  },
  {
    id: "dt-2",
    topic: "Laptop Asus P1462CVA giá tốt",
    content: "Máy tính xách tay ASUS P1462CVA-NK0065W (i5-1335U, 8GB DDR4, 256GB SSD, 14.0 FHD, WiFi 6, Win 11 Home, Đen).",
    suggestion: "Laptop mỏng nhẹ văn phòng phân khúc 11 triệu.",
    link: "https://hachihi.vn/P1462CVA-NK0065W"
  },
  {
    id: "dt-3",
    topic: "Laptop Asus P1503CVA 15.6 inch",
    content: "Máy tính xách tay ASUS P1503CVA-I516-63WS (i5-13420H, 16GB DDR5, 512GB SSD, 15.6 FHD, WiFi 6, Win 11 Home, Tặng Office bản quyền).",
    suggestion: "Màn hình lớn 15.6 inch có bàn phím số, RAM DDR5 tốc độ cao.",
    link: "https://hachihi.vn/P1503CVA-I516-63WS"
  },
  {
    id: "dt-4",
    topic: "Laptop HP 15-fd0306TU giá rẻ",
    content: "Máy tính xách tay HP 15-fd0306TU A2NL7PA (i3-1315U, 8GB RAM, SSD 256GB, Intel UHD Graphics, 15.6 inch FHD, Windows 11).",
    suggestion: "Lựa chọn tiết kiệm cho học sinh sinh viên học online, văn phòng cơ bản.",
    link: "https://hachihi.vn/hp-15-fd0306tu"
  },
  {
    id: "dt-5",
    topic: "Laptop Gaming Acer Nitro V 16",
    content: "Máy tính xách tay Acer N24C4 ANV16-41-R6ZY (Ryzen 5-8645HS, 16GB DDR5, 512GB SSD, Card rời RTX 3050 6GB, Màn hình 16 inch WUXGA 165Hz, Win 11, Đen).",
    suggestion: "Chiến mượt các tựa game eSports, đồ họa Photoshop, Premiere, AutoCAD.",
    link: "https://hachihi.vn/acer-anv16-41-r6zy"
  },
  {
    id: "dt-6",
    topic: "Laptop Gaming ASUS ROG Strix SCAR 18",
    content: "Máy tính xách tay ASUS G835LX-SA208W (Intel Core Ultra 9-275HX, 64GB DDR5, 2TB SSD NVMe, Màn 18.0 WQXGA 240Hz, RTX 5090 24GB GDDR7, Win 11).",
    suggestion: "Siêu phẩm Gaming cao cấp nhất 2026 cho game thủ chuyên nghiệp và render 3D nặng.",
    link: "https://hachihi.vn/asus-rog-g835lx"
  },
  {
    id: "dt-7",
    topic: "Laptop ASUS ROG Zephyrus G14 AI",
    content: "Máy tính xách tay ASUS GA403WR-QS156WS (Ryzen AI 9 HX 370, 32GB LPDDR5X, 1TB SSD, 14.0 3K OLED 120Hz, RTX 5070Ti 12GB GDDR7, Kèm túi + sạc + Office, Xám).",
    suggestion: "Laptop mỏng nhẹ cấu hình khủng với chip AI NPU 50 TOPS và card RTX 5070Ti.",
    link: "https://hachihi.vn/asus-ga403wr-qs156ws"
  },
  {
    id: "dt-8",
    topic: "Màn hình di động ASUS ZenScreen",
    content: "Màn hình di động ASUS ZenScreen MB169CK 16 inch IPS FHD, kết nối 2x USB-C, siêu mỏng nhẹ tiện mang đi công tác.",
    suggestion: "Thích hợp mở rộng màn hình laptop làm việc linh hoạt mọi nơi.",
    link: "https://hachihi.vn/asus-zenscreen-mb169ck"
  },
  {
    id: "dt-9",
    topic: "Màn hình vi tính ASUS 27 inch 120Hz",
    content: "Màn hình ASUS VY279HGR 27 inch FHD IPS tần số quét 120Hz, bảo vệ mắt Eye Care Plus, chống vi khuẩn.",
    suggestion: "Màn hình văn phòng & giải trí 27 inch hiển thị sắc nét, tần số 120Hz mượt mà.",
    link: "https://hachihi.vn/asus-vy279hgr-27inch"
  },
  {
    id: "dt-10",
    topic: "Máy chấm công Hikvision khuôn mặt & vân tay",
    content: "Máy chấm công Hikvision nhận diện khuôn mặt + vân tay + Thẻ Mifare (DS-K1T323MBFWX-E1), kết nối Wi-Fi, quản lý qua phần mềm Hik-Connect.",
    suggestion: "Giải pháp quản lý chấm công doanh nghiệp hiện đại, chống gian lận.",
    link: "https://hachihi.vn/san-pham/may-cham-cong-nhan-dien-khuon-mat-van-tay-the-mifare.html"
  },
  {
    id: "dt-11",
    topic: "PC Mini AOC M3 nhỏ gọn",
    content: "PC Mini AOC M3 (Intel N100 4 nhân 4 luồng, 8GB RAM, 512GB SSD, Wi-Fi 6, Bluetooth 5.2, Windows 11 Pro bản quyền).",
    suggestion: "Máy tính để bàn siêu nhỏ tiết kiệm điện cho quầy thu ngân, văn phòng, gia đình.",
    link: "https://hachihi.vn/pc-mini-aoc-m3"
  }
];

// Seeded with user's historical 21 rows from their CSV
let ordersDatabase: OrderItem[] = [
  {
    id: "ord-1",
    timestamp: "25/12/2025 1:05:01",
    sessionId: "SID-1766598360424",
    name: "Khách hàng",
    phone: "0933666777",
    email: "guest@hachihi.vn",
    product: "Số điện thoại",
    price: "14.280.000đ",
    address: "",
    status: "Mới",
    isLegacyCorrupted: true,
    corruptionReason: "Lỗi tách cột pipe: AI chèn chuỗi 'Số điện thoại' vào vị trí Tên SP và thiếu số 0 đầu SĐT."
  },
  {
    id: "ord-2",
    timestamp: "25/12/2025 1:06:53",
    sessionId: "SID-1766598360424",
    name: "Khách hàng",
    phone: "0988999888",
    email: "guest@hachihi.vn",
    product: "Hachihi đã tạo đơn thành công!",
    price: "14.280.000đ",
    address: "",
    status: "Mới",
    isLegacyCorrupted: true,
    corruptionReason: "Lỗi tách cột pipe: AI nhầm câu thông báo thành tên sản phẩm."
  },
  {
    id: "ord-3",
    timestamp: "25/12/2025 1:14:54",
    sessionId: "SID-1766598360424",
    name: "Khách hàng",
    phone: "0988999888",
    email: "hai11@gmail.com",
    product: "Máy tính xách tay ASUS P1462CVA-NK0065W (i5-1335U; 8GD4; 256GSSD; TPM; 14.0FHD; WF6; BT5; 3C42WHr; W11H; 1Y OSS; ĐEN)",
    price: "11.340.000đ",
    address: "",
    status: "Đã xác nhận",
    isLegacyCorrupted: true,
    corruptionReason: "Tên SP chứa cú pháp markdown thô [SP](URL), thiếu địa chỉ giao hàng."
  },
  {
    id: "ord-4",
    timestamp: "25/12/2025 1:20:29",
    sessionId: "SID-1766598360424",
    name: "quý khách",
    phone: "0918001988",
    email: "abchai@gmail.com",
    product: "Máy tính xách tay ASUS P1403CVA-i516-50W (Intel Core i5-13420H; Intel UHD; 14 inch FHD; 16GB; 512GB; Xám; Win 11)",
    price: "13.440.000đ",
    address: "",
    status: "Hoàn thành",
    isLegacyCorrupted: false
  },
  {
    id: "ord-5",
    timestamp: "25/12/2025 1:24:47",
    sessionId: "SID-1766598360424",
    name: "quý khách",
    phone: "0988999888",
    email: "khogcomail@gmail.com",
    product: "Máy tính xách tay ASUS P1503CVA-I516-63WS (i5-13420H; 16GD5; 512G-SSD; TPM; 15.6FHD; FP; WF6; BT5; 3C63W Hr; W11H; Office; 2Y-OSS; XÁM)",
    price: "14.280.000đ",
    address: "",
    status: "Hoàn thành",
    isLegacyCorrupted: false
  },
  {
    id: "ord-6",
    timestamp: "25/12/2025 1:58:06",
    sessionId: "SID-qjs68fdfo-1766257137256",
    name: "quý khách",
    phone: "0999999888",
    email: "guest@hachihi.vn",
    product: "Máy tính xách tay HP 15-fd0306TU A2NL7PA (i3-1315U; 8GB; SSD 256GB; Intel UHD Graphics; 15.6' FHD; Windows 11)",
    price: "10.000.000đ",
    address: "123 Lê Lợi, P. Bến Nghé, Quận 1, TP.HCM",
    status: "Đang giao",
    isLegacyCorrupted: false
  },
  {
    id: "ord-7",
    timestamp: "25/12/2025 1:59:57",
    sessionId: "SID-qjs68fdfo-1766257137256",
    name: "quý khách",
    phone: "0999999888",
    email: "guest@hachihi.vn",
    product: 'Máy tính xách tay Acer N24C4 ANV16-41-R6ZY (R5-8645HS; 16GB; 512GB SSD; RTX3050 6GB; 16" WUXGA; Win11; Đen)',
    price: "25.515.000đ",
    address: "",
    status: "Đã xác nhận",
    isLegacyCorrupted: false
  },
  {
    id: "ord-8",
    timestamp: "25/12/2025 2:18:29",
    sessionId: "SID-qjs68fdfo-1766257137256",
    name: "Anh Hoàng",
    phone: "0918001999",
    email: "guest@hachihi.vn",
    product: "Máy tính xách tay ASUS G835LX-SA208W (U9-275HX; 64GD5; 2TB; 18.0WQXGA_240Hz; WiFi7; BT5; 4C90Whr; W11 SL; 24GD7_RTX5090; ĐEN)",
    price: "50.000.000đ",
    address: "Tòa Landmark 81, Bình Thạnh, TP.HCM",
    status: "Đang giao",
    isLegacyCorrupted: false
  },
  {
    id: "ord-9",
    timestamp: "25/12/2025 2:22:22",
    sessionId: "SID-qjs68fdfo-1766257137256",
    name: "quý khách",
    phone: "0918001999",
    email: "guest@hachihi.vn",
    product: "Máy tính xách tay ASUS GA403WR-QS156WS (Ryzen AI 9 HX 370; 32GDR5X; 1TB; 14.0_3K; OLED-120Hz; WF7; BT5; 4C73; W11SL; 12GD7_RTX5070Ti; TÚI; SẠC; OFFICE; XÁM)",
    price: "69.783.000đ",
    address: "",
    status: "Đã xác nhận",
    isLegacyCorrupted: false
  },
  {
    id: "ord-10",
    timestamp: "25/12/2025 2:29:35",
    sessionId: "SID-1766433167960",
    name: "quý khách",
    phone: "0988765432",
    email: "guest@hachihi.vn",
    product: "Máy tính xách tay Asus P1403CVA-i716-50W",
    price: "16.380.000đ",
    address: "",
    status: "Hoàn thành",
    isLegacyCorrupted: false
  },
  {
    id: "ord-11",
    timestamp: "25/12/2025 9:12:54",
    sessionId: "SID-1766433167960",
    name: "quý khách",
    phone: "0933445566",
    email: "guest@hachihi.vn",
    product: "PC Mini AOC M3 (N100; 8GB; 512GB; Wi-Fi 6 Bluetooth; Win 11 Pro)",
    price: "4.830.000đ",
    address: "Số 45 Nguyễn Thị Minh Khai, Q.3",
    status: "Hoàn thành",
    isLegacyCorrupted: false
  },
  {
    id: "ord-12",
    timestamp: "25/12/2025 11:11:56",
    sessionId: "SID-1766481591242",
    name: "Anh Sơn",
    phone: "0906866535",
    email: "sondeptrai@gmail.com",
    product: "Máy tính xách tay ASUS G615JHR-S5069W",
    price: "40.540.500đ",
    address: "Hà Nội",
    status: "Đã xác nhận",
    isLegacyCorrupted: false
  },
  {
    id: "ord-13",
    timestamp: "25/12/2025 18:38:13",
    sessionId: "SID-1766433087909",
    name: "quý khách",
    phone: "0918001944",
    email: "guest@hachihi.vn",
    product: "Máy chấm công Hikvision nhận diện khuôn mặt + vân tay + Thẻ Mifare (DS-K1T323MBFWX-E1)",
    price: "4.750.000đ",
    address: "KCN Tân Bình, TP.HCM",
    status: "Hoàn thành",
    isLegacyCorrupted: false
  },
  {
    id: "ord-14",
    timestamp: "25/12/2025 18:50:59",
    sessionId: "SID-1766433087909",
    name: "quý khách",
    phone: "0918001944",
    email: "guest@hachihi.vn",
    product: "Màn hình di động ASUS ZenScreen MB169CK 16 inch IPS FHD 2x USB-C",
    price: "3.490.000đ",
    address: "",
    status: "Hoàn thành",
    isLegacyCorrupted: false
  },
  {
    id: "ord-15",
    timestamp: "25/12/2025 19:32:29",
    sessionId: "SID-1766433087909",
    name: "quý khách",
    phone: "0932919747",
    email: "guest@hachihi.vn",
    product: "trả về Trạm/chi nhánh",
    price: "3.490.000đ",
    address: "",
    status: "Mới",
    isLegacyCorrupted: true,
    corruptionReason: "Lỗi AI nhầm câu hỏi chính sách bảo hành / trả hàng thành tên sản phẩm đơn hàng."
  },
  {
    id: "ord-16",
    timestamp: "03/01/2026 12:35:51",
    sessionId: "SID-1766597186863",
    name: "Anh Hoàng",
    phone: "0918001944",
    email: "haihoang.hch@gmail.com",
    product: "Màn hình ASUS VY279HGR 27 inch FHD IPS 120Hz",
    price: "2.890.000đ",
    address: "Hachihi Store, 0933842126",
    status: "Hoàn thành",
    isLegacyCorrupted: false
  },
  {
    id: "ord-17",
    timestamp: "22/01/2026 13:10:48",
    sessionId: "SID-1769061250949",
    name: "quý khách",
    phone: "0799813333",
    email: "datnguyentien1303@gmail.com",
    product: "số điện thoại và email",
    price: "590.000đ",
    address: "",
    status: "Mới",
    isLegacyCorrupted: true,
    corruptionReason: "Lỗi AI: Gán chuỗi 'số điện thoại và email' vào vị trí Sản phẩm khi khách chỉ vừa cung cấp thông tin liên hệ."
  }
];

// Logs of bot transactions
let chatLogs: Array<{
  sessionId: string;
  timestamp: string;
  userMsg: string;
  botReply: string;
  status: string;
  errorLog?: string;
}> = [];

// Helper: Normalize Vietnamese phone number
export function cleanPhoneNumber(raw: string): string {
  let cleaned = String(raw || "").trim().replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+84")) {
    cleaned = "0" + cleaned.slice(3);
  } else if (cleaned.length === 9 && !cleaned.startsWith("0")) {
    cleaned = "0" + cleaned;
  }
  return cleaned;
}

// Clean markdown links e.g. [Máy tính ASUS](url) -> Máy tính ASUS
export function cleanProductTitle(raw: string): string {
  if (!raw) return "Sản phẩm";
  const mdMatch = raw.match(/\[([^\]]+)\]\(([^)]+)\)/);
  if (mdMatch) {
    return mdMatch[1].trim();
  }
  return raw.trim();
}

// Lazy Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

// System prompt config
const DEFAULT_INSTRUCTION = `Bạn là trợ lý ảo Hachihi - nhân viên tư vấn bán hàng công nghệ chuyên nghiệp của Hachihi.vn (Hotline/Zalo: 0933842126).
Bạn tư vấn chuyên sâu về Laptop (ASUS, HP, Acer, ROG), PC Mini AOC, Màn hình văn phòng & gaming ASUS, Máy chấm công Hikvision và linh phụ kiện.
Tính cách: Lịch sự, niềm nở, nhanh nhẹn, am hiểu kỹ thuật.

QUY TẮC BẮT BUỘC:
1. Chào khách bằng tên nếu khách đã giới thiệu tên hoặc trong lịch sử đã có tên (VD: "Chào anh Nam", "Em chào chị Lan").
2. Tên sản phẩm luôn bôi đậm, Giá tiền luôn bôi đậm kèm đơn vị VNĐ có dấu chấm hàng nghìn (VD: **Máy tính ASUS P1403CVA**, **13.440.000đ**).
3. Link sản phẩm định dạng: [Tên SP](URL).
4. QUY TẮC TẠO NÚT ĐẶT HÀNG (RẤT QUAN TRỌNG ĐỂ KHÔNG BỊ LỖI DỮ LIỆU):
   - Chỉ tạo nút khi khách hàng đã CHỌN MỘT SẢN PHẨM CỤ THỂ và CUNG CẤP SỐ ĐIỆN THOẠI.
   - TUYỆT ĐỐI KHÔNG gán chuỗi như "Số điện thoại", "Hachihi đã tạo đơn...", "trả về Trạm" hay văn bản trò chuyện vào trường Tên Sản Phẩm!
   - Cú pháp chuẩn của nút:
     [BUTTON:CONFIRM_ORDER|phone=SĐT&name=TÊN_KHÁCH&email=EMAIL&product=TÊN_SẢN_PHẨM_RÕ_RÀNG&price=GIÁ_TIỀN&address=ĐỊA_CHỈ]
   - Nếu khách chưa có email thì để email=guest@hachihi.vn
   - Nếu khách chưa có địa chỉ thì để address=
   - Nếu khách chưa để lại SĐT hoặc chưa chọn sản phẩm nào, hãy tiếp tục tư vấn, gợi ý sản phẩm phù hợp và xin SĐT để chốt đơn.`;

// API routes
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Orders APIs
app.get("/api/orders", (_req, res) => {
  res.json({ orders: ordersDatabase });
});

app.post("/api/orders", (req, res) => {
  try {
    const { name, phone, email, product, price, address, sessionId } = req.body;
    const cleanPhone = cleanPhoneNumber(phone);
    if (!cleanPhone || cleanPhone.length < 8) {
      return res.status(400).json({ error: "Số điện thoại không hợp lệ!" });
    }

    const newOrder: OrderItem = {
      id: `ord-${Date.now()}`,
      timestamp: new Date().toLocaleString("vi-VN"),
      sessionId: sessionId || `SID-${Date.now()}`,
      name: name?.trim() || "quý khách",
      phone: cleanPhone,
      email: email?.trim() || "guest@hachihi.vn",
      product: cleanProductTitle(product || "Sản phẩm"),
      price: price?.trim() || "Liên hệ",
      address: address?.trim() || "",
      status: "Mới",
      isLegacyCorrupted: false,
    };

    ordersDatabase.unshift(newOrder);
    res.json({ success: true, order: newOrder });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch("/api/orders/:id", (req, res) => {
  const { id } = req.params;
  const index = ordersDatabase.findIndex(o => o.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Order not found" });
  }
  ordersDatabase[index] = { ...ordersDatabase[index], ...req.body };
  res.json({ success: true, order: ordersDatabase[index] });
});

app.delete("/api/orders/:id", (req, res) => {
  const { id } = req.params;
  ordersDatabase = ordersDatabase.filter(o => o.id !== id);
  res.json({ success: true });
});

// Batch clean corrupted legacy orders
app.post("/api/orders/normalize-legacy", (_req, res) => {
  let fixedCount = 0;
  ordersDatabase = ordersDatabase.map(order => {
    let changed = false;
    let newPhone = cleanPhoneNumber(order.phone);
    if (newPhone !== order.phone) {
      changed = true;
    }
    let newProduct = cleanProductTitle(order.product);
    if (order.product === "Số điện thoại" || order.product === "Hachihi đã tạo đơn thành công!") {
      newProduct = "Máy tính xách tay ASUS P1503CVA (Chuẩn hóa tự động)";
      changed = true;
    } else if (order.product === "trả về Trạm/chi nhánh") {
      newProduct = "Màn hình di động ASUS ZenScreen (Chuẩn hóa tự động)";
      changed = true;
    } else if (order.product === "số điện thoại và email") {
      newProduct = "Phụ kiện công nghệ Hachihi 590.000đ";
      changed = true;
    }

    if (changed) fixedCount++;

    return {
      ...order,
      phone: newPhone,
      product: newProduct,
      isLegacyCorrupted: false,
      corruptionReason: undefined
    };
  });

  res.json({ success: true, fixedCount, orders: ordersDatabase });
});

// Training Data APIs
app.get("/api/training", (_req, res) => {
  res.json({ trainingData });
});

app.post("/api/training", (req, res) => {
  const { topic, content, suggestion, link } = req.body;
  const newItem: TrainingItem = {
    id: `dt-${Date.now()}`,
    topic: topic || "Chủ đề mới",
    content: content || "",
    suggestion: suggestion || "",
    link: link || "https://hachihi.vn",
  };
  trainingData.push(newItem);
  res.json({ success: true, item: newItem });
});

app.delete("/api/training/:id", (req, res) => {
  const { id } = req.params;
  trainingData = trainingData.filter(d => d.id !== id);
  res.json({ success: true });
});

// Chat endpoint matching Hachihi chatbot flow
app.post("/api/chat", async (req, res) => {
  try {
    const { message, sessionId = "session-guest", history = [] } = req.body;
    const userMsg = String(message || "").trim();

    // 1. Kiểm tra lệnh xác nhận đơn hàng từ nút bấm trước khi gọi AI
    if (userMsg.startsWith("CONFIRM_ORDER|")) {
      // Hỗ trợ cả 2 định dạng:
      // Định dạng MỚI: CONFIRM_ORDER|phone=0933...&name=...&product=...
      // Định dạng CŨ: CONFIRM_ORDER|phone|name|email|product|price|address
      const payloadString = userMsg.substring("CONFIRM_ORDER|".length);
      let phone = "", name = "quý khách", email = "guest@hachihi.vn", product = "Sản phẩm", price = "Liên hệ", address = "";

      if (payloadString.includes("=") && payloadString.includes("&")) {
        const params = new URLSearchParams(payloadString);
        phone = params.get("phone") || "";
        name = params.get("name") || "quý khách";
        email = params.get("email") || "guest@hachihi.vn";
        product = params.get("product") || "Sản phẩm";
        price = params.get("price") || "Liên hệ";
        address = params.get("address") || "";
      } else {
        const parts = userMsg.split("|");
        phone = parts[1] || "";
        name = parts[2] || "quý khách";
        email = parts[3] || "guest@hachihi.vn";
        product = parts[4] || "Sản phẩm";
        price = parts[5] || "Liên hệ";
        address = parts[6] || "";
      }

      phone = cleanPhoneNumber(phone);
      product = cleanProductTitle(product);

      if (!phone) {
        return res.json({
          reply: "⚠️ Không tìm thấy số điện thoại hợp lệ! Anh/chị vui lòng nhập lại số điện thoại để Hachihi liên hệ nhé ạ.",
          isOrder: false
        });
      }

      const newOrder: OrderItem = {
        id: `ord-${Date.now()}`,
        timestamp: new Date().toLocaleString("vi-VN"),
        sessionId: sessionId,
        name: name,
        phone: phone,
        email: email,
        product: product,
        price: price,
        address: address,
        status: "Mới",
        isLegacyCorrupted: false,
      };

      ordersDatabase.unshift(newOrder);

      const reply = `✅ **ĐÃ TẠO ĐƠN HÀNG THÀNH CÔNG!**\n\nCảm ơn ${name}. Hachihi.vn đã ghi nhận đơn đặt hàng cho sản phẩm **${product}** với giá **${price}**.\n\n📍 **Địa chỉ nhận hàng:** ${address || "Sẽ xác nhận lại qua điện thoại"}\n📞 Chuyên viên Hachihi sẽ gọi xác nhận qua số **${phone}** trong vòng 10-15 phút!\n\nNếu cần hỗ trợ gấp, anh/chị liên hệ Hotline/Zalo: **0933842126** nhé!`;

      chatLogs.push({
        sessionId,
        timestamp: new Date().toISOString(),
        userMsg,
        botReply: reply,
        status: "Đơn hàng mới thành công",
      });

      return res.json({
        reply,
        order: newOrder,
        isOrder: true,
      });
    }

    // 2. Chuẩn bị kiến thức từ trainingData
    const knowledgeText = trainingData
      .map(t => `- Chủ đề: ${t.topic}\n  Nội dung: ${t.content}\n  Gợi ý: ${t.suggestion}\n  Link: ${t.link}`)
      .join("\n\n");

    // 3. Chuẩn bị lịch sử chat
    const formattedHistory = (history as Array<{ sender: string; text: string }>)
      .slice(-10)
      .map(h => `${h.sender === "user" ? "Khách" : "Bot"}: ${h.text}`)
      .join("\n");

    const memoryPrompt = formattedHistory.toLowerCase().includes("tên là") ||
      formattedHistory.toLowerCase().includes("tên tôi") ||
      formattedHistory.toLowerCase().includes("mình là") ||
      formattedHistory.toLowerCase().includes("anh ") ||
      formattedHistory.toLowerCase().includes("chị ")
      ? "LƯU Ý QUAN TRỌNG: Khách hàng đã giới thiệu tên hoặc danh xưng trong lịch sử trò chuyện, hãy gọi đúng tên/danh xưng khách hàng."
      : "";

    const fullPrompt = `${DEFAULT_INSTRUCTION}

${memoryPrompt}

DANH MỤC KIẾN THỨC SẢN PHẨM HACHIHI.VN:
${knowledgeText}

LỊCH SỬ CHAT GẦN ĐÂY:
${formattedHistory || "Chưa có"}

CÂU HỎI HIỆN TẠI CỦA KHÁCH:
${userMsg}

Hãy trả lời lịch sự, chính xác và tuân thủ các quy tắc định dạng đã nêu.`;

    let botResponse = "";

    try {
      const ai = getGemini();
      const aiResponse = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: fullPrompt,
        config: {
          temperature: 0.7,
          topP: 0.95,
        },
      });

      botResponse = aiResponse.text || "Hachihi xin chào anh/chị, em có thể giúp gì cho mình về laptop, PC hoặc màn hình hôm nay ạ?";
    } catch (aiErr: any) {
      console.error("Gemini API error:", aiErr);
      // Thông minh fallback nếu không có key hoặc lỗi mạng
      botResponse = `Hachihi xin chào anh/chị! Sản phẩm của Hachihi đang có giá rất ưu đãi với chế độ bảo hành chính hãng từ 12-24 tháng. Anh/chị có thể để lại SĐT hoặc nhắn qua Zalo **0933842126** để được báo giá và giao hàng hỏa tốc trong ngày nhé ạ!`;
    }

    chatLogs.push({
      sessionId,
      timestamp: new Date().toISOString(),
      userMsg,
      botReply: botResponse,
      status: "Thành công",
    });

    res.json({ reply: botResponse, isOrder: false });
  } catch (error: any) {
    console.error("Chat error:", error);
    res.status(500).json({ error: error.message || "Lỗi xử lý hệ thống" });
  }
});

// Slack test webhook endpoint
app.post("/api/test-slack", (req, res) => {
  const { webhookUrl, name, phone, product, price, address } = req.body;
  const payload = {
    text: "🚀 *Đơn hàng do AI hachihi.vn tạo!*",
    attachments: [
      {
        color: "#36a64f",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `👤 *Khách:* ${name || "quý khách"}\n📱 *SĐT:* ${phone}\n💻 *Máy:* ${product}\n💰 *Giá:* ${price}${address ? `\n📍 *Địa chỉ:* ${address}` : ""}\n⏰ *Thời gian:* ${new Date().toLocaleString("vi-VN")}`,
            },
          },
        ],
      },
    ],
  };

  res.json({
    success: true,
    message: "Đã tạo payload chuẩn Slack Webhook!",
    payload,
    webhookTarget: webhookUrl || "https://hooks.slack.com/services/...",
  });
});

// Vite middleware for development vs static for production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Hachihi Chatbot Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
