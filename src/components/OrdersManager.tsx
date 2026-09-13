import React, { useState } from "react";
import { Search, Download, Edit3, Trash2, AlertCircle, CheckCircle2, Phone, Mail, MapPin, Eye, Wand2, RefreshCw } from "lucide-react";
import { OrderItem } from "../types";

interface OrdersManagerProps {
  orders: OrderItem[];
  onUpdateOrder: (updated: OrderItem) => void;
  onDeleteOrder: (id: string) => void;
  onNormalizeLegacy: () => void;
  onRefresh: () => void;
}

export const OrdersManager: React.FC<OrdersManagerProps> = ({
  orders,
  onUpdateOrder,
  onDeleteOrder,
  onNormalizeLegacy,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [onlyCorrupted, setOnlyCorrupted] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Filtered list
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.phone.includes(searchTerm) ||
      order.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.sessionId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || order.status === statusFilter;
    const matchesCorrupted = !onlyCorrupted || order.isLegacyCorrupted;

    return matchesSearch && matchesStatus && matchesCorrupted;
  });

  const corruptedCount = orders.filter((o) => o.isLegacyCorrupted).length;

  const handleExportCSV = () => {
    const headers = ["Ngày giờ", "Session", "Tên", "SĐT", "Email", "Sản phẩm", "Giá", "Địa chỉ", "Trạng thái"];
    const rows = filteredOrders.map((o) => [
      `"${o.timestamp}"`,
      `"${o.sessionId}"`,
      `"${o.name}"`,
      `"'${o.phone}"`, // keep leading zero
      `"${o.email}"`,
      `"${o.product.replace(/"/g, '""')}"`,
      `"${o.price}"`,
      `"${o.address.replace(/"/g, '""')}"`,
      `"${o.status}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Hachihi_Orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Banner & Stats */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
            Quản lý đơn hàng Hachihi.vn
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Dữ liệu đồng bộ trực tiếp với sheet <code className="font-mono text-neutral-800">orders</code> trong Google Sheets
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {corruptedCount > 0 && (
            <button
              id="btn-normalize-legacy-orders"
              onClick={onNormalizeLegacy}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Chuẩn hóa {corruptedCount} đơn lỗi cũ</span>
            </button>
          )}

          <button
            id="btn-refresh-orders"
            onClick={onRefresh}
            className="p-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-medium transition-colors"
            title="Làm mới danh sách"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            id="btn-export-csv"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất file CSV Google Sheets</span>
          </button>
        </div>
      </div>

      {/* Alert for Corrupted Legacy Data */}
      {corruptedCount > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start space-x-3 text-amber-900">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <h4 className="font-bold text-amber-950">
              Phát hiện {corruptedCount} đơn hàng bị lỗi lệch cột từ mã nguồn cũ
            </h4>
            <p className="mt-0.5 leading-relaxed text-amber-800">
              Trong dữ liệu thực tế trích xuất từ Google Sheets của bạn, các đơn hàng này bị AI chèn chuỗi như:{" "}
              <code className="bg-amber-100 px-1 py-0.2 rounded font-mono">"Số điện thoại"</code>,{" "}
              <code className="bg-amber-100 px-1 py-0.2 rounded font-mono">"Hachihi đã tạo đơn thành công!"</code>, hoặc{" "}
              <code className="bg-amber-100 px-1 py-0.2 rounded font-mono">"trả về Trạm/chi nhánh"</code> vào cột Sản phẩm và mất số 0 đầu SĐT. Nhấn nút <strong>"Chuẩn hóa đơn lỗi cũ"</strong> để tự động hồi phục dữ liệu.
            </p>
          </div>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <input
            id="input-search-orders"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo Tên, SĐT, Sản phẩm, Session..."
            className="w-full px-3 py-2 pl-9 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
          />
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
          <div className="flex items-center space-x-1 overflow-x-auto text-xs">
            {["ALL", "Mới", "Đã xác nhận", "Đang giao", "Hoàn thành", "Đã hủy"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  statusFilter === status
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                {status === "ALL" ? "Tất cả" : status}
              </button>
            ))}
          </div>

          <label className="flex items-center space-x-1.5 text-xs text-neutral-600 cursor-pointer pl-2 sm:border-l border-neutral-200">
            <input
              type="checkbox"
              checked={onlyCorrupted}
              onChange={(e) => setOnlyCorrupted(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span className="font-semibold text-amber-700">Chỉ đơn có lỗi cũ ({corruptedCount})</span>
          </label>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-50 text-neutral-600 border-b border-neutral-200 font-semibold">
                <th className="py-3 px-4">Thời gian</th>
                <th className="py-3 px-4">Khách hàng</th>
                <th className="py-3 px-4">SĐT</th>
                <th className="py-3 px-4">Sản phẩm</th>
                <th className="py-3 px-4">Giá</th>
                <th className="py-3 px-4">Địa chỉ</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200/80">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-neutral-400">
                    Không tìm thấy đơn hàng nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-neutral-50/80 transition-colors ${
                        order.isLegacyCorrupted ? "bg-amber-50/40" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono text-neutral-500 whitespace-nowrap">
                        {order.timestamp}
                        <span className="block text-[10px] text-neutral-400">{order.sessionId.slice(0, 16)}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-neutral-900">{order.name}</div>
                        <div className="text-[11px] text-neutral-400 flex items-center space-x-1">
                          <Mail className="w-3 h-3" />
                          <span>{order.email}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1 font-mono font-bold text-emerald-700">
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{order.phone}</span>
                        </div>
                        {order.phone.length === 9 && (
                          <span className="text-[10px] text-red-500 font-sans">⚠ Thiếu số 0 đầu</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-neutral-800 line-clamp-2">
                          {order.product}
                        </div>
                        {order.isLegacyCorrupted && (
                          <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700 border border-red-200">
                            ⚠ Lỗi code cũ: {order.corruptionReason}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-emerald-700 whitespace-nowrap">
                        {order.price}
                      </td>

                      <td className="py-3.5 px-4 max-w-[180px] text-neutral-500 text-[11px] truncate">
                        {order.address ? (
                          <span className="flex items-center space-x-1" title={order.address}>
                            <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                            <span className="truncate">{order.address}</span>
                          </span>
                        ) : (
                          <span className="text-neutral-400 italic">Chưa cung cấp</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            order.status === "Mới"
                              ? "bg-blue-100 text-blue-800"
                              : order.status === "Đã xác nhận"
                              ? "bg-amber-100 text-amber-800"
                              : order.status === "Đang giao"
                              ? "bg-purple-100 text-purple-800"
                              : order.status === "Hoàn thành"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-neutral-100 text-neutral-600"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsEditModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-600 transition-colors"
                            title="Chỉnh sửa đơn"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteOrder(order.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                            title="Xóa đơn"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="px-5 py-3.5 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-500">
          <span>
            Hiển thị <strong>{filteredOrders.length}</strong> / <strong>{orders.length}</strong> đơn hàng
          </span>
          <span className="text-[11px]">
            Đồng bộ tự động với Google Sheets Webhook
          </span>
        </div>
      </div>

      {/* Edit Order Modal */}
      {isEditModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <h3 className="text-base font-bold text-neutral-900">
                Chỉnh sửa thông tin đơn hàng
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Khách hàng</label>
                <input
                  type="text"
                  value={selectedOrder.name}
                  onChange={(e) => setSelectedOrder({ ...selectedOrder, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">SĐT (Có số 0 đầu)</label>
                  <input
                    type="text"
                    value={selectedOrder.phone}
                    onChange={(e) => setSelectedOrder({ ...selectedOrder, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs font-mono font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Trạng thái</label>
                  <select
                    value={selectedOrder.status}
                    onChange={(e: any) => setSelectedOrder({ ...selectedOrder, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  >
                    <option value="Mới">Mới</option>
                    <option value="Đã xác nhận">Đã xác nhận</option>
                    <option value="Đang giao">Đang giao</option>
                    <option value="Hoàn thành">Hoàn thành</option>
                    <option value="Đã hủy">Đã hủy</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Tên sản phẩm</label>
                <input
                  type="text"
                  value={selectedOrder.product}
                  onChange={(e) => setSelectedOrder({ ...selectedOrder, product: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Giá bán</label>
                  <input
                    type="text"
                    value={selectedOrder.price}
                    onChange={(e) => setSelectedOrder({ ...selectedOrder, price: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={selectedOrder.email}
                    onChange={(e) => setSelectedOrder({ ...selectedOrder, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Địa chỉ nhận hàng</label>
                <input
                  type="text"
                  value={selectedOrder.address}
                  onChange={(e) => setSelectedOrder({ ...selectedOrder, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-200 flex items-center justify-end space-x-3">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 text-xs font-semibold hover:bg-neutral-100 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  onUpdateOrder(selectedOrder);
                  setIsEditModalOpen(false);
                }}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
