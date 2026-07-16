import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const RejectClassOffer = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReject = async () => {
    if (!reason.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập lý do từ chối");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`/class-offers/${id}/reject`, { reason });
      Alert.alert("Thành công", "Đã từ chối nhận lớp", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert("Lỗi", err.response?.data?.message || "Không thể từ chối");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white p-6">
      <Text className="text-2xl font-bold text-red-600 mb-6">
        Từ chối nhận lớp
      </Text>

      <TextInput
        value={reason}
        onChangeText={setReason}
        placeholder="Nhập lý do từ chối..."
        multiline
        className="border border-gray-300 rounded-2xl p-4 text-base min-h-[140px] mb-8"
      />

      {loading ? (
        <ActivityIndicator size="large" color="#ef4444" />
      ) : (
        <View className="space-y-4">
          <TouchableOpacity
            onPress={handleReject}
            className="bg-red-600 py-4 rounded-2xl">
            <Text className="text-white text-center font-semibold text-lg">
              Xác nhận từ chối
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            className="border border-gray-300 py-4 rounded-2xl">
            <Text className="text-center font-semibold text-lg">Quay lại</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default RejectClassOffer;
