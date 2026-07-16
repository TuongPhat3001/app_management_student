import axios from "axios";
import React, { useEffect, useState } from "react";

interface Grade {
  courseCode: string;
  courseName: string;
  credits: number;
  componentScore: number;
  finalScore: number;
  gpa: number;
}

const ViewTranscript: React.FC = () => {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [gpa, setGpa] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTranscript();
  }, []);

  const fetchTranscript = async () => {
    try {
      const res = await axios.get("/transcript");
      setGrades(res.data.grades);
      setGpa(res.data.gpa);
    } catch (err: any) {
      setError(err.response?.data?.message || "Lỗi khi tải bảng điểm");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return <div className="text-center py-10">Đang tải bảng điểm...</div>;
  if (error)
    return <div className="text-red-500 text-center py-10">{error}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Bảng Điểm</h1>
        <div className="text-xl font-semibold">
          GPA: <span className="text-blue-600">{gpa.toFixed(2)}</span>
        </div>
      </div>

      {grades.length === 0 ? (
        <p className="text-gray-500">Chưa có điểm nào được công bố.</p>
      ) : (
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-3">Mã môn</th>
              <th className="border p-3">Tên môn</th>
              <th className="border p-3">Tín chỉ</th>
              <th className="border p-3">Điểm thành phần</th>
              <th className="border p-3">Điểm tổng kết</th>
              <th className="border p-3">Điểm GPA</th>
            </tr>
          </thead>
          <tbody>
            {grades.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="border p-3">{item.courseCode}</td>
                <td className="border p-3">{item.courseName}</td>
                <td className="border p-3 text-center">{item.credits}</td>
                <td className="border p-3 text-center">
                  {item.componentScore}
                </td>
                <td className="border p-3 text-center font-medium">
                  {item.finalScore}
                </td>
                <td className="border p-3 text-center font-semibold">
                  {item.gpa}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ViewTranscript;
