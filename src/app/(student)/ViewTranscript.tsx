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
    if (isNaN(g)) return "#6B7280";
    if (g >= 8.5) return "#059669";
    if (g >= 7.0) return "#0EA5E9";
    if (g >= 5.0) return "#D97706";
    return "#DC2626";
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bảng Điểm</Text>
        <TouchableOpacity
          onPress={handleExport}
          disabled={exporting}
          style={styles.exportButton}>
          <Ionicons
            name={exporting ? "hourglass-outline" : "download-outline"}
            size={22}
            color="#5B5BD6"
          />
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{summary.gpa}</Text>
            <Text style={styles.summaryLabel}>GPA</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{summary.totalCredits}</Text>
            <Text style={styles.summaryLabel}>Tín chỉ</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{summary.totalCourses}</Text>
            <Text style={styles.summaryLabel}>Môn học</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#5B5BD6"]}
            tintColor="#5B5BD6"
          />
        }>
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#5B5BD6" />
          </View>
        ) : transcript.length > 0 ? (
          transcript.map((item) => (
            <View key={item.id} style={styles.transcriptCard}>
              <View style={styles.courseInfo}>
                <Text style={styles.courseCode}>{item.courseCode}</Text>
                <Text style={styles.courseName} numberOfLines={2}>
                  {item.courseName}
                </Text>
                {item.semester ? (
                  <Text style={styles.semester}>{item.semester}</Text>
                ) : null}
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
                  size={22}
                  color={item.status === "Completed" ? "#059669" : "#9CA3AF"}
                />
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="school-outline" size={72} color="#D1D5DB" />
            <Text style={styles.emptyText}>Chưa có dữ liệu bảng điểm</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3EEFF",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  exportButton: {
    padding: 6,
  },

  summaryCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  summaryItem: {
    alignItems: "center",
    flex: 1,
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: "#E5E7EB",
  },
  summaryValue: {
    fontSize: 26,
    fontWeight: "700",
    color: "#5B5BD6",
  },
  summaryLabel: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },

  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },

  transcriptCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  courseInfo: {
    flex: 1,
  },
  courseCode: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  courseName: {
    fontSize: 14.5,
    marginVertical: 5,
    lineHeight: 20,
    color: "#374151",
  },
  semester: {
    fontSize: 12.5,
    color: "#9CA3AF",
  },

  gradeSection: {
    alignItems: "center",
    marginRight: 10,
    minWidth: 48,
  },
  grade: {
    fontSize: 20,
    fontWeight: "700",
  },
  creditText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 3,
  },

  statusContainer: {
    marginLeft: 4,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 16,
    color: "#9CA3AF",
    marginTop: 16,
  },
});

export default ViewTranscript;
