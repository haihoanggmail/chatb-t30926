import React, { useState } from "react";
import { Copy, Check, Download, AlertTriangle, ShieldCheck, FileCode, CheckCircle2, ChevronRight, Layers } from "lucide-react";
import { OPTIMIZED_GAS_CODE, BUGS_COMPARISON } from "../data/gasCode";

export const GasScriptViewer: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"code" | "audit" | "guide">("code");
  const [selectedBugId, setSelectedBugId] = useState<string>("bug-1");

  const handleCopy = () => {
    navigator.clipboard.writeText(OPTIMIZED_GAS_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([OPTIMIZED_GAS_CODE], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "Hachihi_Chatbot_Gemini_Optimized.gs";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const selectedBug = BUGS_COMPARISON.find((b) => b.id === selectedBugId) || BUGS_COMPARISON[0];

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Mã nguồn Google Apps Script Đã Khắc Phục Lỗi</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Bộ mã nguồn chuẩn cho Hachihi Chatbot
          </h2>
          <p className="text-sm text-emerald-100 max-w-2xl mt-1">
            Đã sửa triệt để 7 lỗi: mất số 0 đầu SĐT, lệch thứ tự cột đơn hàng, lỗi sập do comment logSheet, lỗi Slack webhook, và timeout do quét toàn bộ sheet.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            id="btn-download-gs"
            onClick={handleDownload}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center space-x-2 border border-white/20 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Tải file .gs</span>
          </button>
          <button
            id="btn-copy-full-code"
            onClick={handleCopy}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-neutral-950 font-bold text-xs flex items-center space-x-2 shadow-sm transition-all"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? "Đã sao chép!" : "Sao chép mã nguồn (.gs)"}</span>
          </button>
        </div>
      </div>

      {/* Sub tabs */}
      <div className="flex border-b border-neutral-200 space-x-4">
        <button
          id="subtab-code"
          onClick={() => setActiveSubTab("code")}
          className={`pb-3 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-all ${
            activeSubTab === "code"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-neutral-500 hover:text-neutral-800"
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Toàn bộ mã nguồn (.gs)</span>
        </button>

        <button
          id="subtab-audit"
          onClick={() => setActiveSubTab("audit")}
          className={`pb-3 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-all ${
            activeSubTab === "audit"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-neutral-500 hover:text-neutral-800"
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>Phân tích & So sánh 7 lỗi cũ vs Code mới</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            7 Fixes
          </span>
        </button>

        <button
          id="subtab-guide"
          onClick={() => setActiveSubTab("guide")}
          className={`pb-3 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-all ${
            activeSubTab === "guide"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-neutral-500 hover:text-neutral-800"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Hướng dẫn cài đặt lên Google Sheets</span>
        </button>
      </div>

      {/* Sub Tab 1: Full Code View */}
      {activeSubTab === "code" && (
        <div className="bg-neutral-950 text-neutral-200 rounded-2xl border border-neutral-800 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              <span className="ml-2 font-mono text-xs text-neutral-400">
                Hachihi_GoogleAppsScript_Full_Fix.gs (~380 dòng)
              </span>
            </div>
            <button
              id="btn-code-copy-inline"
              onClick={handleCopy}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 flex items-center space-x-1.5 transition-colors border border-neutral-700"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Đã copy" : "Copy code"}</span>
            </button>
          </div>

          <pre className="p-5 text-xs sm:text-[13px] font-mono leading-relaxed overflow-x-auto text-neutral-200 max-h-[640px] select-all scrollbar-thin">
            {OPTIMIZED_GAS_CODE}
          </pre>
        </div>
      )}

      {/* Sub Tab 2: Bug Audit & Comparison */}
      {activeSubTab === "audit" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* List of bugs */}
          <div className="md:col-span-5 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 px-1 mb-2">
              Danh sách 7 lỗi đã được phân tích & xử lý:
            </h3>
            {BUGS_COMPARISON.map((bug, index) => {
              const isSelected = bug.id === selectedBugId;
              return (
                <button
                  key={bug.id}
                  id={`bug-item-${bug.id}`}
                  onClick={() => setSelectedBugId(bug.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start space-x-3 ${
                    isSelected
                      ? "bg-emerald-50 border-emerald-500 shadow-xs"
                      : "bg-white border-neutral-200 hover:bg-neutral-50"
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                      bug.severity === "critical"
                        ? "bg-red-100 text-red-700"
                        : bug.severity === "high"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h4
                      className={`text-xs font-bold truncate ${
                        isSelected ? "text-emerald-950" : "text-neutral-900"
                      }`}
                    >
                      {bug.title}
                    </h4>
                    <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-1">
                      {bug.issueDescription}
                    </p>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isSelected ? "text-emerald-600 translate-x-0.5" : "text-neutral-400"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Detailed view of selected bug */}
          <div className="md:col-span-7 bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div className="flex items-center space-x-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    selectedBug.severity === "critical"
                      ? "bg-red-100 text-red-800"
                      : selectedBug.severity === "high"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  Mức độ: {selectedBug.severity.toUpperCase()}
                </span>
                <span className="text-xs text-neutral-400">ID: {selectedBug.id}</span>
              </div>
              <span className="text-xs font-semibold text-emerald-600 flex items-center space-x-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Đã sửa thành công</span>
              </span>
            </div>

            <h3 className="text-base font-bold text-neutral-900">{selectedBug.title}</h3>

            <div>
              <h4 className="text-xs font-bold text-neutral-700 mb-1">Nguyên nhân cốt lõi:</h4>
              <p className="text-xs leading-relaxed text-neutral-600">{selectedBug.issueDescription}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-red-50/70 border border-red-200">
              <h4 className="text-xs font-bold text-red-900 mb-1">Hậu quả trực tiếp trên Google Sheets:</h4>
              <p className="text-xs text-red-800 leading-relaxed">{selectedBug.consequenceInSheets}</p>
            </div>

            {/* Code Diff Box */}
            <div className="space-y-3">
              <div>
                <span className="text-xs font-mono font-bold text-red-600 block mb-1">
                  ✕ Code cũ bị lỗi:
                </span>
                <pre className="p-3 rounded-lg bg-neutral-900 text-red-300 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                  {selectedBug.oldCodeSnippet}
                </pre>
              </div>

              <div>
                <span className="text-xs font-mono font-bold text-emerald-600 block mb-1">
                  ✓ Code mới đã tối ưu chuẩn:
                </span>
                <pre className="p-3 rounded-lg bg-neutral-900 text-emerald-300 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                  {selectedBug.fixedCodeSnippet}
                </pre>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-200">
              <h4 className="text-xs font-bold text-neutral-700 mb-1">Lợi ích sau khi nâng cấp:</h4>
              <p className="text-xs text-neutral-600 leading-relaxed">{selectedBug.improvementDetails}</p>
            </div>
          </div>
        </div>
      )}

      {/* Sub Tab 3: Setup Guide */}
      {activeSubTab === "guide" && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-neutral-900 mb-1">
              Hướng dẫn triển khai 3 bước đưa code lên Google Sheets
            </h3>
            <p className="text-xs text-neutral-500">
              Dành riêng cho bảng tính quản lý đơn hàng của Hachihi.vn
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h4 className="font-bold text-sm text-neutral-900">Mở Apps Script</h4>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Trên file Google Sheets quản lý đơn hàng của bạn, chọn menu <strong>Tiện ích mở rộng (Extensions)</strong> &gt; <strong>Apps Script</strong>.
              </p>
              <p className="text-xs text-neutral-500">
                Xóa toàn bộ mã nguồn cũ và dán toàn bộ code ở tab "Toàn bộ mã nguồn (.gs)" vào file <code>Code.gs</code>.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h4 className="font-bold text-sm text-neutral-900">Chạy hàm khởi tạo</h4>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Trên thanh công cụ Apps Script, chọn hàm <code>setupHachihiSheets</code> và nhấn <strong>Chạy (Run)</strong>.
              </p>
              <p className="text-xs text-neutral-500">
                Hàm này sẽ tự động tạo đủ 4 Sheet: <code>orders</code> (format cột SĐT chuẩn văn bản), <code>config</code>, <code>datatrain</code>, và <code>log</code>.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                3
              </div>
              <h4 className="font-bold text-sm text-neutral-900">Triển khai Web App</h4>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Nhấn nút <strong>Triển khai (Deploy)</strong> &gt; <strong>Triển khai mới (New deployment)</strong>.
              </p>
              <p className="text-xs text-neutral-500">
                Chọn loại <strong>Ứng dụng web (Web app)</strong>, mục <em>Ai có quyền truy cập</em> chọn <strong>Bất kỳ ai (Anyone)</strong>. Copy URL Web App thu được để kết nối Chatbot.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-emerald-950">📋 Cấu trúc sheet 'config' mới (API Keys ở Cột A từ A1:A10):</h4>
              <span className="px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 font-semibold text-[10px]">
                Tự động xoay vòng A1 ➔ A2 ➔ A3... khi hết hạn/hết Quota
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-[11px] bg-white rounded-lg border border-emerald-200 overflow-hidden">
                <thead className="bg-emerald-100/70 text-emerald-900">
                  <tr>
                    <th className="p-2 border-b border-emerald-200 w-16">Ô</th>
                    <th className="p-2 border-b border-emerald-200">Cột A (Chứa API Keys)</th>
                    <th className="p-2 border-b border-emerald-200">Cột B (Cấu hình phụ)</th>
                    <th className="p-2 border-b border-emerald-200">Cơ chế hoạt động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-100">
                  <tr className="bg-emerald-50/40">
                    <td className="p-2 font-bold text-emerald-700">A1</td>
                    <td className="p-2 text-neutral-800 font-medium">AIzaSyC... (API Key 1)</td>
                    <td className="p-2 text-neutral-500">MODEL_NAME (hoặc để trống)</td>
                    <td className="p-2 text-emerald-800 font-sans font-semibold">Ưu tiên gọi đầu tiên</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold text-emerald-700">A2</td>
                    <td className="p-2 text-neutral-800 font-medium">AIzaSyD... (API Key 2)</td>
                    <td className="p-2 text-neutral-500">SLACK_WEBHOOK_URL</td>
                    <td className="p-2 text-amber-700 font-sans">Tự kích hoạt nếu A1 lỗi / hết quota (429)</td>
                  </tr>
                  <tr className="bg-emerald-50/40">
                    <td className="p-2 font-bold text-emerald-700">A3</td>
                    <td className="p-2 text-neutral-800 font-medium">AIzaSyE... (API Key 3)</td>
                    <td className="p-2 text-neutral-500">INSTRUCTION</td>
                    <td className="p-2 text-amber-700 font-sans">Tự kích hoạt nếu A2 lỗi tiếp</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold text-emerald-700">A4..A10</td>
                    <td className="p-2 text-neutral-800 font-medium">AIzaSy... (Dự phòng đến A10)</td>
                    <td className="p-2 text-neutral-400">...</td>
                    <td className="p-2 text-neutral-600 font-sans">Tự động chuyển tiếp tuần tự đến hết danh sách</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-emerald-800 font-sans mt-2">
              💡 <strong>Lợi ích tối ưu:</strong> Khi một Key bị lỗi <code>429 (ResourceExhausted)</code> hoặc <code>403 (Invalid Key)</code>, hệ thống sẽ tự động tạm khóa Key đó 10 phút trong bộ nhớ đệm và gọi ngay Key tiếp theo, giúp khách hàng nhận được câu trả lời tức thì mà không phải chờ đợi!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
