import axios from "axios";
import React, { useEffect, useState } from "react";

interface ClassOffer {
  id: number;
  classCode: string;
  courseName: string;
  schedule: string;
  studentCount: number;
  status: string;
}

const ClassOffer: React.FC = () => {
  const [offers, setOffers] = useState<ClassOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const res = await axios.get("/class-offers");
      setOffers(res.data);
    } catch (err: any) {
      setError("Không thể tải danh sách phân công");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return <div className="p-8 text-center">Đang tải danh sách...</div>;
  if (error) return <div className="p-8 text-red-500 text-center">{error}</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Danh sách lớp được phân công</h1>

      {offers.length === 0 ? (
        <p className="text-gray-500 text-lg">
          Hiện chưa có lớp nào được phân công.
        </p>
      ) : (
        <div className="grid gap-6">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold">
                    {offer.classCode} - {offer.courseName}
                  </h3>
                  <p className="text-gray-600 mt-1">{offer.schedule}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    Số SV:{" "}
                    <span className="font-semibold">{offer.studentCount}</span>
                  </p>
                </div>
              </div>

              <div className="mt-6 flex gap-4">
                <button
                  onClick={() =>
                    (window.location.href = `/class-offers/${offer.id}/accept`)
                  }
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white text-center py-3 rounded-lg font-medium">
                  Đồng ý nhận lớp
                </button>
                <button
                  onClick={() =>
                    (window.location.href = `/class-offers/${offer.id}/reject`)
                  }
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white text-center py-3 rounded-lg font-medium">
                  Từ chối
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClassOffer;
