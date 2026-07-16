import apiClient from "@/src/api/axios";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const RejectClassOffer = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReject = async () => {
    if (!reason.trim()) {
      Alert.alert(
        "Thiếu thông tin",
        "Vui lòng cung cấp lý do từ chối để bộ phận giáo vụ nắm thông tin.",
      );
      return;
    }

    setLoading(true);
    try {
      await apiClient.post(`/class-offers/${id}/reject`, { reason });
      Alert.alert("Hoàn tất", "Đã gửi phản hồi từ chối nhận lớp.", [
        { text: "Đóng", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert(
        "Lỗi",
        err.response?.data?.message || "Không thể gửi phản hồi lúc này.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1 bg-white">
          {/* Header */}
          <View className="flex-row items-center p-6 pt-12 bg-white border-b border-gray-100">
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <Ionicons name="arrow-back" size={24} color="#1f2937" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-800">Từ chối lớp</Text>
          </View>

          <View className="flex-1 p-6 bg-gray-50">
            <View className="mb-2 flex-row items-center">
              <Ionicons
                name="alert-circle"
                size={20}
                color="#dc2626"
                className="mr-2"
              />
              <Text className="text-lg font-semibold text-gray-800 ml-2">
                Lý do từ chối
              </Text>
            </View>
            <Text className="text-gray-500 text-sm mb-4">
              Vui lòng cho biết lý do bạn không thể nhận lớp này (trùng lịch,
              không đúng chuyên môn, v.v.)
            </Text>

            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder="Nhập chi tiết lý do..."
              placeholderTextColor="#9ca3af"
              multiline
              textAlignVertical="top"
              className="bg-white border border-gray-200 rounded-xl p-4 text-base min-h-[160px] shadow-sm mb-8"
            />

            <View className="mt-auto pb-8">
              {loading ? (
                <ActivityIndicator size="large" color="#dc2626" />
              ) : (
                <View className="space-y-4">
                  <TouchableOpacity
                    onPress={handleReject}
                    className="bg-red-600 py-4 rounded-xl shadow-sm">
                    <Text className="text-white text-center font-semibold text-lg">
                      Xác nhận từ chối
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => router.back()}
                    className="bg-white border border-gray-300 py-4 rounded-xl">
                    <Text className="text-gray-700 text-center font-semibold text-lg">
                      Hủy bỏ
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default RejectClassOffer;
