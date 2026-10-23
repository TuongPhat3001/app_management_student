import StudentDetailView from "@/src/components/StudentDetailView";
import { useLocalSearchParams } from "expo-router";
import React from "react";

export default function StudentDetailScreen() {
  const params = useLocalSearchParams<{ id?: string; studentId?: string }>();
  const id = Number(params.id || params.studentId || 0);

  return <StudentDetailView studentId={id} />;
}
