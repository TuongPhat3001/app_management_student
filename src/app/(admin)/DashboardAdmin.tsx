import axios from "axios";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  pendingAssignments: number;
  newNotifications: number;
}

const DashboardAdmin: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    pendingAssignments: 0,
    newNotifications: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await axios.get("/dashboard/admin");
      setStats(res.data);
    } catch (error) {
      console.log("Dashboard Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const Card = ({
    title,
    value,
    color = "#111827",
  }: {
    title: string;
    value: number;
    color?: string;
  }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={[styles.cardValue, { color }]}>{value}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Quản Trị Viên</Text>

      <Card title="Tổng sinh viên" value={stats.totalStudents} />
      <Card title="Tổng giảng viên" value={stats.totalTeachers} />
      <Card title="Tổng lớp học" value={stats.totalClasses} />
      <Card
        title="Lớp chờ phân công"
        value={stats.pendingAssignments}
        color="#EA580C"
      />
      <Card
        title="Thông báo mới"
        value={stats.newNotifications}
        color="#2563EB"
      />

      <Text style={styles.sectionTitle}>Quản lý nhanh</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          router.push({ pathname: "(/admin)/CreateStudent" } as any)
        }>
        <Text style={styles.buttonText}>+ Tạo sinh viên mới</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          router.push({ pathname: "(/admin)/CreateTeacher" } as any)
        }>
        <Text style={styles.buttonText}>+ Tạo giảng viên mới</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          router.push({ pathname: "(/admin)/CreateClass" } as any)
        }>
        <Text style={styles.buttonText}>+ Tạo lớp học mới</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Chức năng chính</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          router.push({ pathname: "(/admin)/AssignTeacher" } as any)
        }>
        <Text style={styles.buttonText}>Phân công giảng viên</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          router.push({ pathname: "(/admin)/SendNotification" } as any)
        }>
        <Text style={styles.buttonText}>Gửi thông báo</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default DashboardAdmin;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    padding: 16,
  },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#111827",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 18,
    marginBottom: 15,
    elevation: 3,
  },

  cardTitle: {
    color: "#6B7280",
    fontSize: 15,
  },

  cardValue: {
    marginTop: 8,
    fontSize: 32,
    fontWeight: "bold",
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 25,
    marginBottom: 12,
    color: "#111827",
  },

  button: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },

  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
});
