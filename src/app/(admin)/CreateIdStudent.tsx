"use client";

import axios from "axios";
import React, { useState } from "react";
import { Text, View } from "react-native";

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
    <View className="max-w-2xl mx-auto p-8">
      <Text className="text-3xl font-bold mb-8">Tạo Tài Khoản Sinh Viên</Text>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow space-y-6">
        <View>
          <Text className="block text-sm font-medium mb-2">Họ và tên</Text>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-xl p-4"
          />
        </View>

        <View>
          <Text className="block text-sm font-medium mb-2">Ngày sinh</Text>
          <input
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-xl p-4"
          />
        </View>

        <View>
          <Text className="block text-sm font-medium mb-2">Ngành học</Text>
          <input
            type="text"
            name="major"
            value={formData.major}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-xl p-4"
          />
        </View>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-semibold text-lg">
          {loading ? "Đang tạo..." : "Tạo Sinh Viên"}
        </button>
      </form>

      {message && (
        <Text className="mt-6 text-center text-lg font-medium">{message}</Text>
      )}

      {createdInfo && (
        <View className="mt-8 p-6 bg-green-50 border border-green-200 rounded-xl">
          <Text className="font-semibold mb-3">
            Thông tin tài khoản đã tạo:
          </Text>
          <Text>
            <strong>MSSV:</strong> {createdInfo.studentId}
          </Text>
          <Text>
            <strong>Email:</strong> {createdInfo.email}
          </Text>
          <Text>
            <strong>Mật khẩu mặc định:</strong> {createdInfo.defaultPassword}
          </Text>
        </View>
      )}
    </View>
  );
};

export default CreateStudent;
