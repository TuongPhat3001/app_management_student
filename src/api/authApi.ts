import { LoginRequest } from "../type/auth";
import api from "./axios";

export const loginAPI = (data: LoginRequest) => {
  return api.post("/login", data);
};

export const logoutAPI = () => {
  return api.post("/logout");
};

export const forgotPasswordAPI = (email: string) => {
  return api.post("/forgot-password", { email });
};

export interface ChangePasswordRequest {
  new_password: string;
}

export const changePasswordAPI = (data: ChangePasswordRequest) => {
  return api.post("/change-password", data);
};

export const getScheduleAPI = () => {
  return api.get("/schedule");
};

export const getTranscriptAPI = () => {
  return api.get("/transcript");
};

export const exportTranscriptAPI = () => {
  return api.get("/transcripts/export", { responseType: "blob" });
};

export const getOpenCourseClassesAPI = (params?: {
  semesterId?: number | string;
}) => {
  return api.get("/course-classes/open", { params });
};

export function registerCourseAPI(
  payloadOrCourseId:
    | number
    | { classId: number; courseId?: number; note?: string },
  classIdMaybe?: number,
) {
  let classId: number;
  let courseId: number | undefined;
  let note: string | undefined;

  if (typeof payloadOrCourseId === "object" && payloadOrCourseId !== null) {
    classId = Number(payloadOrCourseId.classId);
    courseId = payloadOrCourseId.courseId
      ? Number(payloadOrCourseId.courseId)
      : undefined;
    note = payloadOrCourseId.note;
  } else {
    courseId = Number(payloadOrCourseId);
    classId = Number(classIdMaybe);
  }

  if (!classId || Number.isNaN(classId)) {
    return Promise.reject(new Error("classId không hợp lệ"));
  }

  return api.post("/course-registrations", {
    classId,
    courseId: courseId && !Number.isNaN(courseId) ? courseId : undefined,
    note: note || undefined,
  });
}

export const getMyCourseRegistrationsAPI = () => {
  return api.get("/course-registrations");
};

export const cancelCourseRegistrationAPI = (id: number) => {
  return api.delete(`/course-registrations/${id}`);
};

export const getDashboardAPI = () => {
  return api.get("/dashboard");
};

export const getStudentDashboardAPI = () => {
  return api.get("/dashboard/student");
};

export const getTeacherDashboardAPI = () => {
  return api.get("/dashboard/teacher");
};

export const getAdminDashboardAPI = () => {
  return api.get("/dashboard/admin");
};

export const getStudentAttendanceClassesAPI = () => {
  return api.get("/student/attendance/classes");
};

export const attendanceByQRAPI = (qrCode: string) => {
  const code = String(qrCode || "").trim();
  return api.post("/attendance/qr", { code, qrCode: code });
};

export const getMyAttendancesAPI = () => {
  return api.get("/student/attendances");
};

export const getTeacherAttendanceClassesAPI = () => {
  return api.get("/teacher/attendance/classes");
};

export const createAttendanceSessionAPI = (payload: {
  classId?: number;
  courseId?: number;
  courseOfferingId?: number;
  classDate?: string;
  note?: string;
}) => {
  return api.post("/attendance/sessions", payload);
};

export const getAttendanceSessionQRAPI = (sessionId: number) => {
  return api.get(`/attendance/sessions/${sessionId}/qr`);
};

export const getStudentExercisesAPI = () => {
  return api.get("/student/exercises");
};

export const submitExerciseAPI = (
  exerciseId: number,
  data: { content?: string; fileUrl?: string },
) => {
  return api.post(`/exercises/${exerciseId}/submissions`, {
    content: data.content || "",
    fileUrl: data.fileUrl || "",
  });
};

export const getMySubmissionsAPI = () => {
  return api.get("/student/submissions");
};

export const getNotificationsAPI = () => {
  return api.get("/notifications");
};

export const searchAPI = (query: string) => {
  return api.get("/search", { params: { q: query } });
};

export const getCoursesAPI = () => {
  return api.get("/courses");
};

export const getCourseDetailAPI = (id: number) => {
  return api.get(`/courses/${id}`);
};

export default {
  loginAPI,
  logoutAPI,
  forgotPasswordAPI,
  changePasswordAPI,
  getScheduleAPI,
  getTranscriptAPI,
  getOpenCourseClassesAPI,
  registerCourseAPI,
  getMyCourseRegistrationsAPI,
  cancelCourseRegistrationAPI,
  getDashboardAPI,
  getStudentDashboardAPI,
  getTeacherDashboardAPI,
  getAdminDashboardAPI,
  attendanceByQRAPI,
  getMyAttendancesAPI,
};
