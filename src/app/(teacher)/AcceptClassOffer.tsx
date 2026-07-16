import axios from "axios";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const AcceptClassOffer = ({ route, navigation }: any) => {
  const { id } = route.params;
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    try {
      await axios.post(`/class-offers/${id}/accept`);
      Alert.alert("Thành công", "Đã chấp nhận lớp học!", [
        { text: "OK", onPress: () => navigation.goBack() },
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
    <View className="flex-1 bg-white p-6 justify-center">
      <Text className="text-2xl font-bold text-center mb-8">
        Xác nhận nhận lớp
      </Text>
      <Text className="text-gray-600 text-center mb-10">
        Bạn có chắc chắn muốn nhận lớp này không?
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" />
      ) : (
        <View className="space-y-4">
          <TouchableOpacity
            onPress={handleAccept}
            className="bg-green-600 py-4 rounded-xl">
            <Text className="text-white text-center font-semibold text-lg">
              Đồng ý nhận lớp
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="border border-gray-300 py-4 rounded-xl">
            <Text className="text-center font-semibold text-lg">Quay lại</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default AcceptClassOffer;
