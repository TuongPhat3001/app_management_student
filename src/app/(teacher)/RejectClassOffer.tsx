import axios from "axios";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";

const RejectClassOffer: React.FC = () => {
  const { id } = useParams();
  const { assignmentId } = useLocalSearchParams<{
    assignmentId: string;
  }>();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleReject = async () => {
    if (!reason.trim()) {
      setMessage("Vui lòng nhập lý do từ chối");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`/class-offers/${id}/reject`, { reason });
      setMessage("Đã từ chối lớp thành công");
      setTimeout(() => router.back(), 1500);
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Không thể từ chối lớp");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-20 p-8 bg-white rounded-2xl shadow-xl">
      <h1 className="text-2xl font-bold mb-6 text-red-600">Từ chối nhận lớp</h1>

      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Nhập lý do từ chối..."
        rows={6}
        className="w-full border border-gray-300 rounded-xl p-4 focus:outline-none focus:border-red-400"
      />

      {message && (
        <p className="mt-4 text-center text-red-600 font-medium">{message}</p>
      )}

      <div className="flex gap-4 mt-8">
        <button
          onClick={handleReject}
          disabled={loading}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-semibold">
          {loading ? "Đang xử lý..." : "Xác nhận từ chối"}
        </button>

        <button
          onClick={() => router.back()}
          className="flex-1 border border-gray-300 py-4 rounded-xl font-semibold hover:bg-gray-50">
          Quay lại
        </button>
      </div>
    </div>
  );
};

export default RejectClassOffer;

function useParams(): { id: any } {
  throw new Error("Function not implemented.");
}
