import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, ShoppingBag, Phone, Mail, MapPin, CheckCircle, RefreshCw, Sparkles, Terminal, AlertCircle } from "lucide-react";
import { ChatMessage, OrderItem } from "../types";

interface ChatSimulatorProps {
  onOrderCreated: (order: OrderItem) => void;
}

export const ChatSimulator: React.FC<ChatSimulatorProps> = ({ onOrderCreated }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-welcome",
      sender: "bot",
      text: "Dạ em chào anh/chị! Em là **Hachihi** - trợ lý tư vấn bán hàng công nghệ tại **Hachihi.vn**.\n\nHachihi chuyên cung cấp Laptop chính hãng (ASUS, Acer, HP, ROG), Màn hình máy tính, PC Mini AOC và Máy chấm công Hikvision với giá tốt và bảo hành chính hãng. Anh/chị đang quan tâm đến dòng sản phẩm nào để em tư vấn cho mình ạ?",
      timestamp: "Vừa xong",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `SID-${Date.now()}`);
  
  // Checkout Modal State
  const [checkoutModal, setCheckoutModal] = useState<{
    isOpen: boolean;
    phone: string;
    name: string;
    email: string;
    product: string;
    price: string;
    address: string;
    rawPayload: string;
  } | null>(null);

  // Diagnostic drawer
  const [showDebug, setShowDebug] = useState(false);
  const [lastDebugLog, setLastDebugLog] = useState<string>("");

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Quick suggestion prompts
  const quickPrompts = [
    "Tư vấn laptop Asus tầm 13-15 triệu cho dân văn phòng",
    "Mình tên Nam, muốn mua màn hình Asus 27 inch 120Hz, SĐT 0988999888",
    "Báo giá laptop Gaming Acer Nitro V RTX 3050",
    "Tư vấn máy chấm công Hikvision cho văn phòng công ty",
  ];

  // Helper: parse order button from markdown text
  const parseOrderButton = (text: string) => {
    // Matches [BUTTON:CONFIRM_ORDER|...]
    const regex = /\[BUTTON:CONFIRM_ORDER\|([^\]]+)\]/;
    const match = text.match(regex);
    if (!match) return null;

    const payload = match[1];
    let phone = "", name = "quý khách", email = "guest@hachihi.vn", product = "Sản phẩm", price = "Liên hệ", address = "";

    if (payload.includes("=") && payload.includes("&")) {
      const params = new URLSearchParams(payload);
      phone = params.get("phone") || "";
      name = params.get("name") || "quý khách";
      email = params.get("email") || "guest@hachihi.vn";
      product = params.get("product") || "Sản phẩm";
      price = params.get("price") || "Liên hệ";
      address = params.get("address") || "";
    } else {
      const parts = payload.split("|");
      phone = parts[0] || "";
      name = parts[1] || "quý khách";
      email = parts[2] || "guest@hachihi.vn";
      product = parts[3] || "Sản phẩm";
      price = parts[4] || "Liên hệ";
      address = parts[5] || "";
    }

    return {
      rawPayload: payload,
      phone,
      name,
      email,
      product,
      price,
      address,
    };
  };

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend || input).trim();
    if (!messageText || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          sessionId,
          history: messages.map((m) => ({ sender: m.sender, text: m.text })),
        }),
      });

      const data = await response.json();
      setLastDebugLog(JSON.stringify(data, null, 2));

      if (data.isOrder && data.order) {
        onOrderCreated(data.order);
      }

      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: data.reply || "Hachihi đã nhận được thông tin ạ!",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        orderAction: parseOrderButton(data.reply || "") || undefined,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: "bot",
        text: "Dạ Hachihi đang có chút gián đoạn kết nối, anh/chị có thể liên hệ ngay Hotline/Zalo **0933842126** để được hỗ trợ tức thì ạ!",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmOrderFromModal = async () => {
    if (!checkoutModal) return;

    // Send formatted confirm command to backend
    // Sử dụng định dạng Key-Value an toàn đã cải tiến
    const command = `CONFIRM_ORDER|phone=${encodeURIComponent(checkoutModal.phone)}&name=${encodeURIComponent(checkoutModal.name)}&email=${encodeURIComponent(checkoutModal.email)}&product=${encodeURIComponent(checkoutModal.product)}&price=${encodeURIComponent(checkoutModal.price)}&address=${encodeURIComponent(checkoutModal.address)}`;

    setCheckoutModal(null);
    await handleSendMessage(command);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: "bot",
        text: "Dạ em chào anh/chị! Em là **Hachihi** - trợ lý tư vấn bán hàng công nghệ tại **Hachihi.vn** (Hotline/Zalo: 0933842126).\n\nEm đã được nâng cấp thuật toán tách đơn hàng thông minh, không còn bị lỗi mất số 0 hay lệch cột sản phẩm nữa ạ. Anh/chị cần em hỗ trợ tư vấn dòng máy nào ạ?",
        timestamp: "Vừa xong",
      },
    ]);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Chat Window (2 cols on large screen) */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-200 shadow-sm flex flex-col h-[740px] overflow-hidden">
        {/* Chat Header */}
        <div className="px-5 py-4 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                <Bot className="w-5 h-5" />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-bold text-neutral-900 text-base">Hachihi AI Assistant</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                  Trực tuyến
                </span>
              </div>
              <p className="text-xs text-neutral-500">Tư vấn Laptop, PC, Màn hình, Máy chấm công Hachihi.vn</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="btn-toggle-debug"
              onClick={() => setShowDebug(!showDebug)}
              title="Xem log chẩn đoán"
              className={`p-2 rounded-lg text-xs font-medium border transition-colors flex items-center space-x-1 ${
                showDebug ? "bg-neutral-800 text-white border-neutral-700" : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Chẩn đoán</span>
            </button>
            <button
              id="btn-reset-chat"
              onClick={handleResetChat}
              title="Làm mới phiên chat"
              className="p-2 rounded-lg text-neutral-700 hover:bg-neutral-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-neutral-50/50">
          {messages.map((msg) => {
            const isUser = msg.sender === "user";
            const orderBtn = !isUser ? parseOrderButton(msg.text) : null;
            // Clean display text without the raw button code
            const cleanText = msg.text.replace(/\[BUTTON:CONFIRM_ORDER\|[^\]]+\]/g, "").trim();

            return (
              <div
                key={msg.id}
                className={`flex items-start space-x-3 ${isUser ? "flex-row-reverse space-x-reverse" : ""}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs ${
                    isUser ? "bg-neutral-800" : "bg-emerald-600"
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className={`max-w-[85%] sm:max-w-[78%] space-y-2`}>
                  <div
                    className={`p-4 rounded-2xl text-sm leading-relaxed ${
                      isUser
                        ? "bg-neutral-900 text-white rounded-tr-xs"
                        : "bg-white text-neutral-800 border border-neutral-200/90 shadow-xs rounded-tl-xs"
                    }`}
                  >
                    <div className="whitespace-pre-line break-words">
                      {cleanText.split("\n").map((line, lIdx) => {
                        // Bold formatting
                        const parts = line.split(/(\*\*[^*]+\*\*)/g);
                        return (
                          <p key={lIdx} className={lIdx > 0 ? "mt-1.5" : ""}>
                            {parts.map((part, pIdx) => {
                              if (part.startsWith("**") && part.endsWith("**")) {
                                return (
                                  <strong key={pIdx} className={isUser ? "text-emerald-300 font-semibold" : "text-emerald-700 font-semibold"}>
                                    {part.slice(2, -2)}
                                  </strong>
                                );
                              }
                              return part;
                            })}
                          </p>
                        );
                      })}
                    </div>
                  </div>

                  {/* Interactive Order Button when AI extracts contact/product */}
                  {orderBtn && (
                    <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300 rounded-xl shadow-xs">
                      <div className="flex items-center space-x-2 text-emerald-900 font-semibold text-xs mb-1.5">
                        <ShoppingBag className="w-4 h-4 text-emerald-600" />
                        <span>Xác nhận thông tin đặt hàng từ AI</span>
                      </div>
                      <div className="text-xs text-neutral-700 space-y-1 mb-3">
                        <p>
                          💻 <strong>Sản phẩm:</strong> {orderBtn.product}
                        </p>
                        <p>
                          💰 <strong>Giá niêm yết:</strong> <span className="text-emerald-700 font-bold">{orderBtn.price}</span>
                        </p>
                        <p>
                          📱 <strong>SĐT khách hàng:</strong> <span className="font-semibold text-neutral-900">{orderBtn.phone || "Chưa có"}</span>
                        </p>
                      </div>

                      <button
                        id="btn-open-confirm-modal"
                        onClick={() =>
                          setCheckoutModal({
                            isOpen: true,
                            phone: orderBtn.phone,
                            name: orderBtn.name,
                            email: orderBtn.email,
                            product: orderBtn.product,
                            price: orderBtn.price,
                            address: orderBtn.address,
                            rawPayload: orderBtn.rawPayload,
                          })
                        }
                        className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 shadow-xs transition-all"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Nhấn để hoàn tất đơn hàng ({orderBtn.price})</span>
                      </button>
                    </div>
                  )}

                  <span className={`block text-[11px] text-neutral-700 ${isUser ? "text-right" : "text-left"}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 text-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 bg-white border border-neutral-200 rounded-2xl rounded-tl-xs shadow-xs text-xs text-neutral-700 flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:-.3s]"></div>
                  <div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:-.5s]"></div>
                </div>
                <span>Hachihi đang tra cứu kiến thức sản phẩm & tạo câu trả lời...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-neutral-50/80 border-t border-neutral-200/60 overflow-x-auto flex space-x-2 scrollbar-none">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              id={`quick-prompt-${idx}`}
              onClick={() => handleSendMessage(prompt)}
              disabled={isLoading}
              className="px-3 py-1 rounded-full text-xs bg-white text-neutral-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-neutral-200 whitespace-nowrap transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat Input Box */}
        <div className="p-3 sm:p-4 bg-white border-t border-neutral-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-2"
          >
            <input
              id="input-chat-message"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi tư vấn sản phẩm hoặc để lại SĐT đặt hàng..."
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
            />
            <button
              id="btn-send-chat"
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl transition-all shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Right Column: Order Process & Diagnostic Live Panel */}
      <div className="space-y-6 flex flex-col justify-between">
        {/* Order Logic Guide Box */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs">
          <div className="flex items-center space-x-2 mb-3 text-emerald-800 font-bold text-sm">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Quy trình chốt đơn tự động của Hachihi</span>
          </div>

          <ol className="space-y-3 text-xs text-neutral-700">
            <li className="flex items-start space-x-2">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                1
              </span>
              <div>
                <strong className="text-neutral-900">Tư vấn & Báo giá:</strong> Bot lấy dữ liệu từ catalog DataTrain, bôi đậm giá tiền và đưa link sản phẩm.
              </div>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                2
              </span>
              <div>
                <strong className="text-neutral-900">Trích xuất SĐT & Tạo nút:</strong> Khi khách gửi SĐT và chọn máy, bot tạo nút đặt hàng với cấu trúc Key-Value không bao giờ bị lệch cột.
              </div>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                3
              </span>
              <div>
                <strong className="text-neutral-900">Đồng bộ Google Sheets & Slack:</strong> Đơn hàng lưu vào sheet <code className="px-1 py-0.5 bg-neutral-100 rounded text-neutral-800 font-mono">orders</code> giữ nguyên số 0 ở đầu SĐT và bắn thông báo tức thì lên kênh Slack.
              </div>
            </li>
          </ol>

          <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Lưu ý:</strong> Ở phiên bản cũ của bạn, khách gửi SĐT thì bị lỗi ghi <code className="font-mono">Sản phẩm: "Số điện thoại"</code> hoặc mất số 0 đầu. Phiên bản mới đã xử lý triệt để!
            </div>
          </div>
        </div>

        {/* Diagnostic Panel */}
        <div className="bg-neutral-900 text-neutral-200 rounded-2xl p-5 shadow-xs flex-1 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400">
              <Terminal className="w-4 h-4" />
              <span>Chẩn đoán API & Trạng thái Session</span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono">
              {sessionId.slice(0, 14)}...
            </span>
          </div>

          <div className="mt-3 flex-1 overflow-y-auto max-h-60 text-xs font-mono space-y-2 text-neutral-300">
            <div className="p-2 rounded bg-neutral-800/80 border border-neutral-700/50">
              <span className="text-emerald-400">✓ Model:</span> Gemini 3.8 Flash (Server-Side)
            </div>
            <div className="p-2 rounded bg-neutral-800/80 border border-neutral-700/50">
              <span className="text-emerald-400">✓ Bộ nhớ khách:</span> Tự động nhận diện danh xưng & tên
            </div>
            <div className="p-2 rounded bg-neutral-800/80 border border-neutral-700/50">
              <span className="text-emerald-400">✓ Định dạng nút:</span> Key=Value an toàn, không phụ thuộc index Pipe
            </div>

            {lastDebugLog && (
              <div className="mt-2">
                <span className="text-neutral-400 block mb-1 text-[11px]">Payload phản hồi gần nhất:</span>
                <pre className="p-2 rounded bg-neutral-950 text-[11px] text-neutral-300 overflow-x-auto whitespace-pre-wrap max-h-36">
                  {lastDebugLog}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Checkout Verification Modal */}
      {checkoutModal && checkoutModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-neutral-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900">Xác nhận thông tin đặt hàng</h3>
                  <p className="text-xs text-neutral-500">Kiểm tra thông tin trước khi lưu vào Google Sheets</p>
                </div>
              </div>
              <button
                id="btn-close-modal"
                onClick={() => setCheckoutModal(null)}
                className="text-neutral-400 hover:text-neutral-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-sm">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Họ tên khách hàng
                </label>
                <div className="relative">
                  <input
                    id="input-order-name"
                    type="text"
                    value={checkoutModal.name}
                    onChange={(e) => setCheckoutModal({ ...checkoutModal, name: e.target.value })}
                    className="w-full px-3 py-2 pl-9 rounded-lg border border-neutral-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                  <User className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Số điện thoại nhận hàng <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="input-order-phone"
                    type="text"
                    value={checkoutModal.phone}
                    onChange={(e) => setCheckoutModal({ ...checkoutModal, phone: e.target.value })}
                    placeholder="VD: 0933842126"
                    className="w-full px-3 py-2 pl-9 rounded-lg border border-neutral-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden font-medium text-emerald-800"
                  />
                  <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Email</label>
                <div className="relative">
                  <input
                    id="input-order-email"
                    type="email"
                    value={checkoutModal.email}
                    onChange={(e) => setCheckoutModal({ ...checkoutModal, email: e.target.value })}
                    className="w-full px-3 py-2 pl-9 rounded-lg border border-neutral-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Sản phẩm đặt mua</label>
                  <input
                    id="input-order-product"
                    type="text"
                    value={checkoutModal.product}
                    onChange={(e) => setCheckoutModal({ ...checkoutModal, product: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Giá bán</label>
                  <input
                    id="input-order-price"
                    type="text"
                    value={checkoutModal.price}
                    onChange={(e) => setCheckoutModal({ ...checkoutModal, price: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Địa chỉ giao hàng</label>
                <div className="relative">
                  <input
                    id="input-order-address"
                    type="text"
                    value={checkoutModal.address}
                    onChange={(e) => setCheckoutModal({ ...checkoutModal, address: e.target.value })}
                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                    className="w-full px-3 py-2 pl-9 rounded-lg border border-neutral-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                  <MapPin className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-200 flex items-center justify-end space-x-3">
              <button
                id="btn-cancel-modal"
                onClick={() => setCheckoutModal(null)}
                className="px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 text-xs font-semibold hover:bg-neutral-100 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                id="btn-submit-order-modal"
                onClick={handleConfirmOrderFromModal}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-all"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Xác nhận & Lưu Google Sheet</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
