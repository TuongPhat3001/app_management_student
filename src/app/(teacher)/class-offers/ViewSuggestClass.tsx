import apiClient from "@/src/api/axios";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface ClassOffer {
  id: number;
  classCode: string;
  courseName: string;
  schedule: string;
  studentCount: number;
  status: string;
}

const ViewSuggestClass: React.FC = () => {
  const router = useRouter();
  const [offers, setOffers] = useState<ClassOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const res = await apiClient.get(`http://192.168.1.224:8080/class-offers`);

      setOffers(res.data);
    } catch (err: any) {
      console.error(err);
      setError(
        "Không thể kết nối đến server. Kiểm tra IP và backend đang chạy chưa.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = (id: number) => {
    router.push(`/class-offers/${id}/accept`);
  };

  const handleReject = (id: number) => {
    router.push(`/class-offers/${id}/reject`);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="mt-4 text-gray-600">Đang tải...</Text>
      </View>
    );
  }

  if (error) {
    return <Text className="text-red-500 p-8 text-center">{error}</Text>;
  }

  return (
    <ScrollView className="flex-1 bg-gray-50 p-6">
      <Text className="text-3xl font-bold mb-8">
        Danh sách lớp được phân công
      </Text>

      {offers.length === 0 ? (
        <Text className="text-gray-500 text-center py-10">
          Chưa có phân công nào.
        </Text>
      ) : (
        <View className="space-y-6">
          {offers.map((offer) => (
            <View
              key={offer.id}
              className="bg-white p-6 rounded-3xl border border-gray-200">
              <Text className="text-xl font-semibold">
                {offer.classCode} - {offer.courseName}
              </Text>
              <Text className="text-gray-600 mt-1">{offer.schedule}</Text>
              <Text className="text-sm text-gray-500 mt-2">
                Số sinh viên: {offer.studentCount}
              </Text>

              <View className="flex-row gap-4 mt-6">
                <TouchableOpacity
                  onPress={() => handleAccept(offer.id)}
                  className="flex-1 bg-green-600 py-4 rounded-2xl">
                  <Text className="text-white text-center font-semibold">
                    Đồng ý
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleReject(offer.id)}
                  className="flex-1 bg-red-600 py-4 rounded-2xl">
                  <Text className="text-white text-center font-semibold">
                    Từ chối
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

export default ViewSuggestClass;
