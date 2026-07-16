import axios from "axios";
import React, { useState } from "react";

const CreateClass: React.FC = () => {
  const [formData, setFormData] = useState({
    classCode: "",
    className: "",
    courseId: "",
    semester: "",
    academicYear: "",
    capacity: 0,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "capacity" ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await axios.post("/classes", formData);
      setMessage("Tạo lớp học thành công!");
      setFormData({
        classCode: "",
        className: "",
        courseId: "",
        semester: "",
        academicYear: "",
        capacity: 0,
      });
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Lỗi khi tạo lớp học");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Tạo Lớp Học Mới</h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white p-8 rounded-xl shadow">
        <div>
          <label className="block text-sm font-medium mb-1">Mã lớp</label>
          <input
            type="text"
            name="classCode"
            value={formData.classCode}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg p-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tên lớp</label>
          <input
            type="text"
            name="className"
            value={formData.className}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg p-3"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Môn học</label>
            <input
              type="text"
              name="courseId"
              value={formData.courseId}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg p-3"
              placeholder="Nhập ID môn học"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Học kỳ</label>
            <input
              type="text"
              name="semester"
              value={formData.semester}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg p-3"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Năm học</label>
            <input
              type="text"
              name="academicYear"
              value={formData.academicYear}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg p-3"
              placeholder="2025-2026"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Sức chứa</label>
            <input
              type="number"
              name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              required
              min="1"
              className="w-full border border-gray-300 rounded-lg p-3"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-lg transition">
          {loading ? "Đang tạo..." : "Tạo lớp học"}
        </button>

        {message && (
          <p
            className={`text-center font-medium ${message.includes("thành công") ? "text-green-600" : "text-red-600"}`}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
};

export default CreateClass;
