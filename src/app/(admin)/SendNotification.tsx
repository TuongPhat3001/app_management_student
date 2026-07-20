import axios from "axios";
import React, { useState } from "react";
import { Text, View } from "react-native";

const SendNotificationToEmail: React.FC = () => {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    target: "all",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      setMessage("Vui lòng nhập tiêu đề và nội dung");
      return;
    }

    setLoading(true);
    try {
      await axios.post("/notifications/email", formData);
      setMessage("Gửi thông báo thành công!");
      setFormData({ title: "", content: "", target: "all" });
    } catch (err: any) {
      setMessage("Gửi thông báo thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="max-w-3xl mx-auto p-6">
      <Text className="text-3xl font-bold mb-8">Gửi Thông Báo Qua Email</Text>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow space-y-6">
        <View>
          <Text className="block text-sm font-medium mb-2">Tiêu đề</Text>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-3"
            required
          />
        </View>

        <View>
          <Text className="block text-sm font-medium mb-2">Nội dung</Text>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            rows={6}
            className="w-full border border-gray-300 rounded-lg p-3"
            required
          />
        </View>

        <View>
          <Text className="block text-sm font-medium mb-2">Đối tượng nhận</Text>
          <select
            name="target"
            value={formData.target}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-3">
            <option value="all">Tất cả</option>
            <option value="student">Sinh viên</option>
            <option value="teacher">Giảng viên</option>
            <option value="admin">Quản trị viên</option>
          </select>
        </View>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-lg font-semibold">
          {loading ? "Đang gửi..." : "Gửi Thông Báo"}
        </button>

        {message && (
          <Text
            className={`text-center font-medium ${message.includes("thành công") ? "text-green-600" : "text-red-600"}`}>
            {message}
          </Text>
        )}
      </form>
    </View>
  );
};

export default SendNotificationToEmail;
