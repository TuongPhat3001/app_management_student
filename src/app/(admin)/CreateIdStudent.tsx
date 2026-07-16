"use client";

import axios from "axios";
import React, { useState } from "react";

const CreateStudent: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    dateOfBirth: "",
    major: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [createdInfo, setCreatedInfo] = useState<any>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setCreatedInfo(null);

    try {
      const res = await axios.post("/students", formData);
      setCreatedInfo(res.data);
      setMessage("Tạo sinh viên thành công!");
      setFormData({ fullName: "", dateOfBirth: "", major: "" });
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Tạo sinh viên thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Tạo Tài Khoản Sinh Viên</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Họ và tên</label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-xl p-4"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Ngày sinh</label>
          <input
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-xl p-4"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Ngành học</label>
          <input
            type="text"
            name="major"
            value={formData.major}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-xl p-4"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-semibold text-lg">
          {loading ? "Đang tạo..." : "Tạo Sinh Viên"}
        </button>
      </form>

      {message && (
        <p className="mt-6 text-center text-lg font-medium">{message}</p>
      )}

      {createdInfo && (
        <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-xl">
          <h3 className="font-semibold mb-3">Thông tin tài khoản đã tạo:</h3>
          <p>
            <strong>MSSV:</strong> {createdInfo.studentId}
          </p>
          <p>
            <strong>Email:</strong> {createdInfo.email}
          </p>
          <p>
            <strong>Mật khẩu mặc định:</strong> {createdInfo.defaultPassword}
          </p>
        </div>
      )}
    </div>
  );
};

export default CreateStudent;
