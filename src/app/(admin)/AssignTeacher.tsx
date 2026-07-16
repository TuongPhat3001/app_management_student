import axios from "axios";
import React, { useState } from "react";

const AssignTeacher: React.FC = () => {
  const [formData, setFormData] = useState({
    classId: "",
    teacherId: "",
    startTime: "",
    endTime: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await axios.put(`/classes/${formData.classId}/assign-teacher`, {
        teacherId: formData.teacherId,
        startTime: formData.startTime,
        endTime: formData.endTime,
      });
      setMessage("Phân công giảng viên thành công!");
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Phân công thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Phân Công Giảng Viên</h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white p-8 rounded-xl shadow">
        <div>
          <label className="block text-sm font-medium mb-1">Lớp học</label>
          <input
            type="text"
            name="classId"
            value={formData.classId}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg p-3"
            placeholder="Nhập ID lớp"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Giảng viên</label>
          <input
            type="text"
            name="teacherId"
            value={formData.teacherId}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg p-3"
            placeholder="Nhập ID giảng viên"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Thời gian bắt đầu
            </label>
            <input
              type="datetime-local"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg p-3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Thời gian kết thúc
            </label>
            <input
              type="datetime-local"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg p-3"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-lg">
          {loading ? "Đang phân công..." : "Phân công giảng viên"}
        </button>

        {message && (
          <p className="text-center mt-4 font-medium text-green-600">
            {message}
          </p>
        )}
      </form>
    </div>
  );
};

export default AssignTeacher;
