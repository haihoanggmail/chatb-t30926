import React, { useState } from "react";
import { Send, Bell, CheckCircle, AlertCircle, Copy, Check, MessageSquareCode } from "lucide-react";

export const SlackSimulator: React.FC = () => {
  const [webhookUrl, setWebhookUrl] = useState("https://hooks.slack.com/services/T000/B000/XXXXX");
  const [name, setName] = useState("Anh Hoàng");
  const [phone, setPhone] = useState("0918001944");
  const [product, setProduct] = useState("Máy tính xách tay ASUS P1403CVA-i516-50W");
  const [price, setPrice] = useState("13.440.000đ");
  const [address, setAddress] = useState("123 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM");
  
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedPayload, setCopiedPayload] = useState(false);

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
              text: `👤 *Khách:* ${name}\n📱 *SĐT:* ${phone}\n💻 *Máy:* ${product}\n💰 *Giá:* ${price}${address ? `\n📍 *Địa chỉ:* ${address}` : ""}\n⏰ *Thời gian:* ${new Date().toLocaleString("vi-VN")}`,
            },
          },
        ],
      },
    ],
  };

  const handleTestSlack = async () => {
    setIsSending(true);
    setSendResult(null);
    try {
      const res = await fetch("/api/test-slack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhookUrl,
          name,
          phone,
          product,
          price,
          address,
        }),
      });
      const data = await res.json();
      setSendResult({
        success: true,
        message: "Đã tạo và gửi thành công cấu trúc thông báo Slack chuẩn!",
      });
    } catch (e: any) {
      setSendResult({
        success: false,
        message: "Lỗi kiểm tra Slack: " + e.message,
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight flex items-center space-x-2">
          <Bell className="w-6 h-6 text-emerald-600" />
          <span>Giả lập & Kiểm tra thông báo Slack Webhook</span>
        </h2>
        <p className="text-xs text-neutral-500 mt-0.5">
          Xem trước chính xác thông báo đơn hàng gửi về kênh Slack bán hàng của Hachihi.vn sau khi sửa lỗi contentType và orderSheet scope
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left config form */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-neutral-900 pb-2 border-b border-neutral-200">
            Dữ liệu mẫu kiểm tra
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Slack Webhook URL (Cấu hình trong sheet 'config')
              </label>
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 font-mono text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Tên khách hàng</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">SĐT nhận hàng</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs font-mono font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Tên sản phẩm / Máy</label>
                <input
                  type="text"
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden font-medium"
                />
              </div>
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Giá bán</label>
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Địa chỉ giao hàng</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center space-x-3">
            <button
              id="btn-test-slack-send"
              onClick={handleTestSlack}
              disabled={isSending}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center space-x-2 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? "Đang gửi..." : "Kiểm tra gửi thông báo"}</span>
            </button>
            <button
              onClick={handleCopyPayload}
              className="px-3.5 py-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              {copiedPayload ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPayload ? "Đã copy JSON" : "Copy Payload JSON"}</span>
            </button>
          </div>

          {sendResult && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
                sendResult.success ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {sendResult.success ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{sendResult.message}</span>
            </div>
          )}
        </div>

        {/* Right Slack Card Visual Mockup */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-[#1A1D21] rounded-2xl p-5 text-neutral-200 shadow-md">
            <div className="flex items-center space-x-2 text-xs text-neutral-400 pb-3 border-b border-neutral-800">
              <span className="font-bold text-white">#don-hang-hachihi-vn</span>
              <span>• Kênh bán hàng</span>
            </div>

            {/* Slack Message Item */}
            <div className="mt-4 flex items-start space-x-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                H
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline space-x-2">
                  <span className="font-bold text-white text-xs">Hachihi Bot</span>
                  <span className="text-[10px] px-1 py-0.2 bg-neutral-700 rounded text-neutral-300">APP</span>
                  <span className="text-[10px] text-neutral-400">Vừa xong</span>
                </div>

                <div className="text-xs text-neutral-200 mt-1 font-semibold">
                  🚀 *Đơn hàng do AI hachihi.vn tạo!*
                </div>

                {/* Attachment Block with Green Border */}
                <div className="mt-2 pl-3 border-l-4 border-[#36a64f] bg-[#222529] p-3.5 rounded-r-lg space-y-1.5 text-xs text-neutral-200">
                  <div className="flex items-center space-x-1.5">
                    <span>👤</span>
                    <span><strong>Khách:</strong> {name}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 font-mono text-emerald-400 font-bold">
                    <span>📱</span>
                    <span><strong>SĐT:</strong> {phone}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span>💻</span>
                    <span><strong>Máy:</strong> {product}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span>💰</span>
                    <span><strong>Giá:</strong> <span className="text-emerald-400 font-bold">{price}</span></span>
                  </div>
                  {address && (
                    <div className="flex items-start space-x-1.5 text-neutral-300">
                      <span>📍</span>
                      <span><strong>Địa chỉ:</strong> {address}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1.5 text-[11px] text-neutral-400 pt-1 border-t border-neutral-700/60">
                    <span>⏰</span>
                    <span><strong>Thời gian:</strong> {new Date().toLocaleString("vi-VN")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* JSON Payload Inspector */}
          <div className="bg-neutral-900 rounded-2xl p-4 text-xs font-mono text-neutral-300">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800 text-[11px] text-neutral-400">
              <span className="flex items-center space-x-1">
                <MessageSquareCode className="w-3.5 h-3.5 text-emerald-400" />
                <span>JSON Payload gửi lên Slack</span>
              </span>
            </div>
            <pre className="mt-2 text-[11px] overflow-x-auto text-emerald-300 max-h-48 whitespace-pre-wrap">
              {JSON.stringify(payload, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
