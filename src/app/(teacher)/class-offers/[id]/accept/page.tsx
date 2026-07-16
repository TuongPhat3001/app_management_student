import axios from "axios";
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
      await axios.post(`/class-offers/${id}/accept`);
      Alert.alert("Thành công", "Đã chấp nhận lớp học!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert(
        "Lỗi",
        err.response?.data?.message || "Không thể chấp nhận lớp",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white p-6 justify-center items-center">
      <Text className="text-2xl font-bold mb-6 text-center">
        Xác nhận nhận lớp
      </Text>
      <Text className="text-gray-600 text-center mb-10 px-4">
        Bạn có chắc chắn muốn nhận lớp này không?
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#22c55e" />
      ) : (
        <View className="w-full space-y-4 px-4">
          <TouchableOpacity
            onPress={handleAccept}
            className="bg-green-600 py-4 rounded-2xl">
            <Text className="text-white text-center font-semibold text-lg">
              Đồng ý nhận lớp
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

export default AcceptClassOffer;
