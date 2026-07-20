"use client";

import axios from "axios";
import React, { useState } from "react";
import { Text, View } from "react-native";

const CreateTeacher: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    department: "",
    specialization: "",
    joinYear: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [createdInfo, setCreatedInfo] = useState<any>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await axios.post("/teachers", formData);
      setCreatedInfo(res.data);
      setMessage("Tạo giảng viên thành công!");
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Tạo giảng viên thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="max-w-2xl mx-auto p-8">
      <Text className="text-3xl font-bold mb-8">Tạo Tài Khoản Giảng Viên</Text>

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

        <View className="grid grid-cols-2 gap-6">
          <View>
            <Text className="block text-sm font-medium mb-2">
              Khoa / Bộ môn
            </Text>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-xl p-4"
            />
          </View>
          <View>
            <Text className="block text-sm font-medium mb-2">Chuyên ngành</Text>
            <input
              type="text"
              name="specialization"
              value={formData.specialization}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-xl p-4"
            />
          </View>
        </View>

        <View>
          <Text className="block text-sm font-medium mb-2">Năm công tác</Text>
          <input
            type="text"
            name="joinYear"
            value={formData.joinYear}
            onChange={handleChange}
            placeholder="2023"
            className="w-full border border-gray-300 rounded-xl p-4"
          />
        </View>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-semibold text-lg">
          {loading ? "Đang tạo..." : "Tạo Giảng Viên"}
        </button>
      </form>

      {createdInfo && (
        <View className="mt-8 p-6 bg-green-50 border border-green-200 rounded-xl">
          <Text className="font-semibold mb-3">Thông tin đã tạo:</Text>
          <Text>
            <strong>Mã GV:</strong> {createdInfo.teacherId}
          </Text>
          <Text>
            <strong>Email:</strong> {createdInfo.email}
          </Text>
        </View>
      )}
    </View>
  );
};

export default CreateTeacher;
