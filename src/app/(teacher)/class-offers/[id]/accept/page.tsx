import apiClient from "@/src/api/axios";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const AcceptClassOffer = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    try {
      // Dùng apiClient và bỏ URL gốc đi
      await apiClient.post(`/class-offers/${id}/accept`);
      Alert.alert("Thành công", "Đã chấp nhận phân công lớp học!", [
        { text: "Tuyệt vời", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert(
        "Lỗi",
        err.response?.data?.message ||
          "Đã xảy ra lỗi, không thể chấp nhận lớp.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center p-6 pt-12 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-800">Xác nhận</Text>
      </View>

      {/* Content */}
      <View className="flex-1 justify-center items-center px-6 pb-20">
        <View className="bg-blue-50 p-6 rounded-full mb-8">
          <Ionicons name="checkmark-circle" size={80} color="#1e3a8a" />
        </View>

        <Text className="text-2xl font-bold mb-3 text-center text-gray-900">
          Nhận lớp học này?
        </Text>
        <Text className="text-gray-500 text-center mb-10 text-base leading-6 px-4">
          Bạn sẽ chịu trách nhiệm giảng dạy lớp học này. Thao tác này sẽ cập
          nhật trạng thái phân công của bạn.
        </Text>

        {/* Buttons */}
        {loading ? (
          <ActivityIndicator size="large" color="#1e3a8a" />
        ) : (
          <View className="w-full space-y-4">
            <TouchableOpacity
              onPress={handleAccept}
              className="bg-[#1e3a8a] py-4 rounded-xl shadow-sm">
              <Text className="text-white text-center font-semibold text-lg">
                Đồng ý nhận lớp
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.back()}
              className="py-4 rounded-xl">
              <Text className="text-[#1e3a8a] text-center font-semibold text-lg">
                Hủy bỏ
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

export default AcceptClassOffer;
