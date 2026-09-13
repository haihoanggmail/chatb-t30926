import React, { useState } from "react";
import { Plus, Trash2, Search, ExternalLink, BookOpen, Check, Sparkles } from "lucide-react";
import { TrainingItem } from "../types";

interface DataTrainManagerProps {
  trainingData: TrainingItem[];
  onAddTrainingItem: (item: Omit<TrainingItem, "id">) => void;
  onDeleteTrainingItem: (id: string) => void;
}

export const DataTrainManager: React.FC<DataTrainManagerProps> = ({
  trainingData,
  onAddTrainingItem,
  onDeleteTrainingItem,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTopic, setNewTopic] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newSuggestion, setNewSuggestion] = useState("");
  const [newLink, setNewLink] = useState("https://hachihi.vn/");

  const filteredItems = trainingData.filter(
    (item) =>
      item.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.suggestion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.trim() || !newContent.trim()) return;

    onAddTrainingItem({
      topic: newTopic.trim(),
      content: newContent.trim(),
      suggestion: newSuggestion.trim() || "Sản phẩm chính hãng tại Hachihi.vn",
      link: newLink.trim() || "https://hachihi.vn",
    });

    setNewTopic("");
    setNewContent("");
    setNewSuggestion("");
    setNewLink("https://hachihi.vn/");
    setIsAddModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight flex items-center space-x-2">
            <span>Dữ liệu huấn luyện sản phẩm (DataTrain)</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              {trainingData.length} sản phẩm
            </span>
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Tương ứng với các cột <code>[Chủ đề, Nội dung, Gợi ý, Link]</code> trong sheet <code className="font-mono text-neutral-800">datatrain</code> của bạn
          </p>
        </div>

        <button
          id="btn-open-add-train-modal"
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm sản phẩm mới vào DataTrain</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <input
            id="input-search-train"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã máy, CPU, RAM, màn hình..."
            className="w-full px-3 py-2 pl-9 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
          />
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
        </div>
        <div className="text-xs text-neutral-500 hidden sm:block">
          Hiển thị <strong>{filteredItems.length}</strong> / <strong>{trainingData.length}</strong> mục
        </div>
      </div>

      {/* Grid of Knowledge Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs flex flex-col justify-between hover:border-emerald-300 hover:shadow-sm transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-neutral-100 text-neutral-800">
                  {item.topic}
                </span>
                <button
                  onClick={() => onDeleteTrainingItem(item.id)}
                  className="text-neutral-400 hover:text-red-500 p-1 rounded transition-colors"
                  title="Xóa mục này"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-xs text-neutral-700 leading-relaxed font-medium mb-3">
                {item.content}
              </p>

              <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-900 mb-3">
                <span className="font-bold text-emerald-950 block mb-0.5">Gợi ý tư vấn cho Bot:</span>
                <span className="leading-snug">{item.suggestion}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
              <a
                href={item.link}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-600 hover:text-emerald-700 font-semibold flex items-center space-x-1 truncate max-w-[220px]"
              >
                <span className="truncate">{item.link}</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
              <span className="text-[10px] text-neutral-400">ID: {item.id}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add Item */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddSubmit}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-neutral-200 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <h3 className="text-base font-bold text-neutral-900">
                Thêm sản phẩm mới vào Sheet DataTrain
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Chủ đề / Tên danh mục (Cột A)
                </label>
                <input
                  type="text"
                  required
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="VD: Laptop Asus Zenbook 14 OLED..."
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Nội dung chi tiết cấu hình / Giá bán (Cột B)
                </label>
                <textarea
                  rows={3}
                  required
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="VD: Core Ultra 7, 32GB RAM, 1TB SSD, Màn 2.8K OLED 120Hz, Giá 29.990.000đ..."
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Gợi ý chốt đơn cho Chatbot (Cột C)
                </label>
                <input
                  type="text"
                  value={newSuggestion}
                  onChange={(e) => setNewSuggestion(e.target.value)}
                  placeholder="VD: Thích hợp người làm sáng tạo nội dung, doanh nhân cần máy mỏng nhẹ pin trâu..."
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Đường link sản phẩm trên website (Cột D)
                </label>
                <input
                  type="url"
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  placeholder="https://hachihi.vn/san-pham/..."
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-200 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 text-xs font-semibold hover:bg-neutral-100 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                Lưu vào DataTrain
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
