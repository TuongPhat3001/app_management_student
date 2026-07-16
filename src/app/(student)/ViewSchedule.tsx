import axios from "axios";
import React, { useEffect, useState } from "react";

interface Schedule {
  id: number;
  courseCode: string;
  courseName: string;
  teacher: string;
  room: string;
  dayOfWeek: string;
  period: string;
  startDate: string;
  endDate: string;
}

const ViewSchedule: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      const res = await axios.get("/schedule");
      setSchedules(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Lỗi khi tải thời khóa biểu");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-10">Đang tải...</div>;
  if (error)
    return <div className="text-red-500 text-center py-10">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Thời Khóa Biểu</h1>
      {schedules.length === 0 ? (
        <p className="text-gray-500">Bạn chưa đăng ký môn học nào.</p>
      ) : (
        <div className="grid gap-4">
          {schedules.map((item) => (
            <div
              key={item.id}
              className="bg-white p-5 rounded-lg shadow border">
              <div className="flex justify-between">
                <div>
                  <h3 className="font-semibold">{item.courseName}</h3>
                  <p className="text-sm text-gray-600">{item.courseCode}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">
                    <strong>GV:</strong> {item.teacher}
                  </p>
                  <p className="text-sm">
                    <strong>Phòng:</strong> {item.room}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <p>
                  <strong>Thứ:</strong> {item.dayOfWeek}
                </p>
                <p>
                  <strong>Tiết:</strong> {item.period}
                </p>
                <p>
                  <strong>Bắt đầu:</strong> {item.startDate}
                </p>
                <p>
                  <strong>Kết thúc:</strong> {item.endDate}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ViewSchedule;
