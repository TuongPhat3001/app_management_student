import { exportTranscriptAPI, getTranscriptAPI } from "@/src/api/authApi";
import { useAuth } from "@/src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface TranscriptItem {
  id: number;
  courseCode: string;
  courseName: string;
  credit: number;
  grade: string | number;
  status: string;
  semester?: string;
}

const ViewTranscript: React.FC = () => {
  const { token } = useAuth();

  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [summary, setSummary] = useState({
    gpa: 0,
    totalCredits: 0,
    totalCourses: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchTranscript = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getTranscriptAPI();

      const data = response.data || [];

      let totalCredits = 0;
      let totalGradePoints = 0;
      let validCourses = 0;

      const formattedData = data.map((item: any) => {
        const credits = item.credit || 3;
        const grade = item.grade || 0;
        const gradeNum = typeof grade === "string" ? parseFloat(grade) : grade;

        totalCredits += credits;
        if (gradeNum > 0) {
          totalGradePoints += gradeNum * credits;
          validCourses++;
        }

        return {
          id: item.id,
          courseCode: item.courseCode || item.code,
          courseName: item.course?.name || item.courseName,
          credit: credits,
          grade: gradeNum || "Chưa có",
          status: item.status || "Completed",
          semester: item.semester,
        };
      });

      const gpa = totalCredits > 0 ? totalGradePoints / totalCredits : 0;

      setTranscript(formattedData);
      setSummary({
        gpa: parseFloat(gpa.toFixed(2)),
        totalCredits,
        totalCourses: data.length,
      });
    } catch (error) {
      console.error("Lỗi tải bảng điểm:", error);
      Alert.alert("Lỗi", "Không thể tải bảng điểm. Vui lòng thử lại sau.");

      setTranscript([
        {
          id: 1,
          courseCode: "DB101",
          courseName: "Cơ sở dữ liệu",
          credit: 3,
          grade: 8.5,
          status: "Completed",
          semester: "2025.1",
        },
        {
          id: 2,
          courseCode: "WEB201",
          courseName: "Lập trình Web",
          credit: 3,
          grade: 9.0,
          status: "Completed",
          semester: "2025.1",
        },
        {
          id: 3,
          courseCode: "ML301",
          courseName: "Machine Learning",
          credit: 4,
          grade: 7.5,
          status: "Completed",
          semester: "2025.2",
        },
      ]);
      setSummary({ gpa: 8.33, totalCredits: 10, totalCourses: 3 });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (token) fetchTranscript();
  }, [token, fetchTranscript]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTranscript();
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const response = await exportTranscriptAPI();

      Alert.alert("Thành công", "Bảng điểm đã được xuất ra file!");
      console.log("Export response:", response);
    } catch (error) {
      Alert.alert("Lỗi", "Không thể xuất bảng điểm");
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  const getGradeColor = (grade: string | number) => {
    const g = typeof grade === "number" ? grade : parseFloat(grade as string);
    if (g >= 8.5) return "#28a745";
    if (g >= 7.0) return "#17a2b8";
    if (g >= 5.0) return "#ffc107";
    return "#dc3545";
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bảng Điểm</Text>
        <TouchableOpacity
          onPress={handleExport}
          disabled={exporting}
          style={styles.exportButton}>
          <Ionicons name="download-outline" size={24} color="#0066CC" />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{summary.gpa}</Text>
            <Text style={styles.summaryLabel}>GPA</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{summary.totalCredits}</Text>
            <Text style={styles.summaryLabel}>Tín chỉ</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{summary.totalCourses}</Text>
            <Text style={styles.summaryLabel}>Môn học</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0066CC" />
          </View>
        ) : transcript.length > 0 ? (
          transcript.map((item) => (
            <View key={item.id} style={styles.transcriptCard}>
              <View style={styles.courseInfo}>
                <Text style={styles.courseCode}>{item.courseCode}</Text>
                <Text style={styles.courseName} numberOfLines={2}>
                  {item.courseName}
                </Text>
                <Text style={styles.semester}>{item.semester}</Text>
              </View>

              <View style={styles.gradeSection}>
                <Text
                  style={[styles.grade, { color: getGradeColor(item.grade) }]}>
                  {item.grade}
                </Text>
                <Text style={styles.creditText}>{item.credit} TC</Text>
              </View>

              <View style={styles.statusContainer}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={item.status === "Completed" ? "#28a745" : "#6c757d"}
                />
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="school-outline" size={80} color="#e0e0e0" />
            <Text style={styles.emptyText}>Chưa có dữ liệu bảng điểm</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#1f1f1f" },
  exportButton: { padding: 6 },

  summaryCard: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.08)",
    elevation: 4,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  summaryItem: { alignItems: "center" },
  summaryValue: { fontSize: 28, fontWeight: "700", color: "#0066CC" },
  summaryLabel: { fontSize: 13, color: "#666", marginTop: 4 },

  listContainer: { flex: 1, paddingHorizontal: 16 },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },

  transcriptCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.07)",
    elevation: 3,
  },

  courseInfo: { flex: 1 },
  courseCode: { fontSize: 16, fontWeight: "700", color: "#333" },
  courseName: { fontSize: 15.5, marginVertical: 6, lineHeight: 22 },
  semester: { fontSize: 13, color: "#888" },

  gradeSection: { alignItems: "center", marginRight: 12 },
  grade: { fontSize: 22, fontWeight: "700" },
  creditText: { fontSize: 13, color: "#666", marginTop: 4 },

  statusContainer: { marginLeft: 8 },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 120,
  },
  emptyText: { fontSize: 17, color: "#888", marginTop: 16 },
});

export default ViewTranscript;
