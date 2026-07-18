import { LoginRequest } from "../type/auth";
import api from "./axios";

export const useAuth = () => {
  const token = localStorage.getItem("token");
  return { token };
};

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

export interface CourseClass {
  id: number;
  course: any;
  classCode: string;
  room: string;
  teacher: any;
  startTime: string;
  endTime: string;
}

export const getOpenCourseClassesAPI = () => {
  return api.get("/course-classes/open");
};

export const registerCourseAPI = (courseClassId: number) => {
  return api.post("/course-registrations", { courseClassId });
};

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
  return api.post("/attendance/qr", { qrCode });
};

export const getMyAttendancesAPI = () => {
  return api.get("/student/attendances");
};

export const getTeacherAttendanceClassesAPI = () => {
  return api.get("/teacher/attendance/classes");
};

export const createAttendanceSessionAPI = (classId: number) => {
  return api.post("/attendance/sessions", { classId });
};

export const getAttendanceSessionQRAPI = (sessionId: number) => {
  return api.get(`/attendance/sessions/${sessionId}/qr`);
};

export const getStudentExercisesAPI = () => {
  return api.get("/student/exercises");
};

export const submitExerciseAPI = (exerciseId: number, data: FormData) => {
  return api.post(`/exercises/${exerciseId}/submissions`, data, {
    headers: { "Content-Type": "multipart/form-data" },
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
