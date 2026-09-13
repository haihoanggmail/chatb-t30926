import React, { useState, useEffect } from "react";
import { Navbar, ActiveTab } from "./components/Navbar";
import { ChatSimulator } from "./components/ChatSimulator";
import { GasScriptViewer } from "./components/GasScriptViewer";
import { OrdersManager } from "./components/OrdersManager";
import { DataTrainManager } from "./components/DataTrainManager";
import { SlackSimulator } from "./components/SlackSimulator";
import { OrderItem, TrainingItem } from "./types";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("chat");
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [trainingData, setTrainingData] = useState<TrainingItem[]>([]);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "info" } | null>(null);

  const showToast = (text: string, type: "success" | "info" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (data.orders) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  const fetchTrainingData = async () => {
    try {
      const res = await fetch("/api/training");
      const data = await res.json();
      if (data.trainingData) {
        setTrainingData(data.trainingData);
      }
    } catch (err) {
      console.error("Error fetching training:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchTrainingData();
  }, []);

  const handleOrderCreated = (newOrder: OrderItem) => {
    setOrders((prev) => [newOrder, ...prev]);
    showToast(`Đã ghi nhận đơn hàng mới cho ${newOrder.name} (${newOrder.product})!`);
  };

  const handleUpdateOrder = async (updatedOrder: OrderItem) => {
    try {
      const res = await fetch(`/api/orders/${updatedOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedOrder),
      });
      if (res.ok) {
        setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
        showToast("Đã cập nhật đơn hàng thành công!");
      }
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    try {
      const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });
      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== id));
        showToast("Đã xóa đơn hàng!", "info");
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleNormalizeLegacy = async () => {
    try {
      const res = await fetch("/api/orders/normalize-legacy", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
        showToast(`Đã tự động sửa xong ${data.fixedCount} đơn hàng bị lỗi từ code cũ!`);
      }
    } catch (err) {
      console.error("Normalize error:", err);
    }
  };

  const handleAddTrainingItem = async (newItem: Omit<TrainingItem, "id">) => {
    try {
      const res = await fetch("/api/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });
      const data = await res.json();
      if (data.item) {
        setTrainingData((prev) => [...prev, data.item]);
        showToast("Đã thêm sản phẩm mới vào danh mục DataTrain!");
      }
    } catch (err) {
      console.error("Add train error:", err);
    }
  };

  const handleDeleteTrainingItem = async (id: string) => {
    try {
      const res = await fetch(`/api/training/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTrainingData((prev) => prev.filter((t) => t.id !== id));
        showToast("Đã xóa sản phẩm khỏi DataTrain!", "info");
      }
    } catch (err) {
      console.error("Delete train error:", err);
    }
  };

  const corruptedCount = orders.filter((o) => o.isLegacyCorrupted).length;

  return (
    <div className="min-h-screen bg-neutral-100/70 flex flex-col text-neutral-900 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5">
          <div className="flex items-center space-x-2 px-4 py-3 rounded-xl bg-neutral-900 text-white text-xs font-semibold shadow-lg border border-neutral-700">
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        orderCount={orders.length}
        corruptedCount={corruptedCount}
      />

      {/* Main Content Areas */}
      <main className="flex-1 py-6">
        {activeTab === "chat" && <ChatSimulator onOrderCreated={handleOrderCreated} />}
        {activeTab === "script" && <GasScriptViewer />}
        {activeTab === "orders" && (
          <OrdersManager
            orders={orders}
            onUpdateOrder={handleUpdateOrder}
            onDeleteOrder={handleDeleteOrder}
            onNormalizeLegacy={handleNormalizeLegacy}
            onRefresh={fetchOrders}
          />
        )}
        {activeTab === "datatrain" && (
          <DataTrainManager
            trainingData={trainingData}
            onAddTrainingItem={handleAddTrainingItem}
            onDeleteTrainingItem={handleDeleteTrainingItem}
          />
        )}
        {activeTab === "slack" && <SlackSimulator />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 py-4 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Hachihi.vn © 2026 - Giải pháp Chatbot AI & Tự động hóa bán hàng đa kênh
          </span>
          <div className="flex items-center space-x-4">
            <span className="text-emerald-700 font-medium">Hotline/Zalo: 0933842126</span>
            <span>•</span>
            <button
              onClick={() => setActiveTab("script")}
              className="text-emerald-600 hover:underline font-semibold"
            >
              Xem mã nguồn Google Apps Script
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
