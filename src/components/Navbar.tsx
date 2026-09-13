import React from "react";
import { MessageSquare, Code2, Database, BookOpen, Bell, Sparkles, PhoneCall, CheckCircle2 } from "lucide-react";

export type ActiveTab = "chat" | "script" | "orders" | "datatrain" | "slack";

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  orderCount: number;
  corruptedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  orderCount,
  corruptedCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-neutral-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white font-black text-xl shadow-sm">
              H
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-neutral-900">Hachihi.vn</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                  <Sparkles className="w-3 h-3 mr-1" /> AI Chatbot Pro
                </span>
              </div>
              <p className="text-xs text-neutral-700 hidden sm:block">
                Hệ thống nâng cấp Chatbot Gemini & Đồng bộ Đơn hàng Google Sheets
              </p>
            </div>
          </div>

          {/* Quick Hotline & Status */}
          <div className="hidden md:flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 text-neutral-700">
              <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-medium">Hotline/Zalo: 0933842126</span>
            </div>
            <div className="flex items-center space-x-1 text-emerald-800 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Đã vá 7 lỗi nghiêm trọng</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            id="tab-chat"
            onClick={() => setActiveTab("chat")}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === "chat"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Thử nghiệm Chatbot AI</span>
          </button>

          <button
            id="tab-script"
            onClick={() => setActiveTab("script")}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === "script"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100"
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Mã nguồn Google Apps Script (Đã Fix)</span>
          </button>

          <button
            id="tab-orders"
            onClick={() => setActiveTab("orders")}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === "orders"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100"
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Đơn hàng Sheets ({orderCount})</span>
            {corruptedCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                {corruptedCount} lỗi cũ
              </span>
            )}
          </button>

          <button
            id="tab-datatrain"
            onClick={() => setActiveTab("datatrain")}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === "datatrain"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Dữ liệu huấn luyện DataTrain</span>
          </button>

          <button
            id="tab-slack"
            onClick={() => setActiveTab("slack")}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === "slack"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100"
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Giả lập Slack Webhook</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
