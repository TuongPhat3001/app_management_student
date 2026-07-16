"use client";

import axios from "axios";
import React, { useEffect, useState } from "react";

const DashboardAdmin: React.FC = () => {
  const [stats, setStats] = useState({
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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-10">Dashboard Quản Trị Viên</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow">
          <p className="text-gray-500">Tổng sinh viên</p>
          <p className="text-4xl font-bold mt-2">{stats.totalStudents}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow">
          <p className="text-gray-500">Tổng giảng viên</p>
          <p className="text-4xl font-bold mt-2">{stats.totalTeachers}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow">
          <p className="text-gray-500">Tổng lớp học</p>
          <p className="text-4xl font-bold mt-2">{stats.totalClasses}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow">
          <p className="text-gray-500">Lớp chờ phân công</p>
          <p className="text-4xl font-bold mt-2 text-orange-600">
            {stats.pendingAssignments}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow">
          <p className="text-gray-500">Thông báo mới</p>
          <p className="text-4xl font-bold mt-2 text-blue-600">
            {stats.newNotifications}
          </p>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-2xl shadow">
          <h2 className="text-xl font-semibold mb-6">Quản lý nhanh</h2>
          <div className="space-y-4">
            <a
              href="/admin/students/create"
              className="block p-4 border rounded-xl hover:bg-gray-50">
              + Tạo sinh viên mới
            </a>
            <a
              href="/admin/teachers/create"
              className="block p-4 border rounded-xl hover:bg-gray-50">
              + Tạo giảng viên mới
            </a>
            <a
              href="/admin/classes/create"
              className="block p-4 border rounded-xl hover:bg-gray-50">
              + Tạo lớp học mới
            </a>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow">
          <h2 className="text-xl font-semibold mb-6">Chức năng chính</h2>
          <div className="space-y-4">
            <a
              href="/admin/assign-teacher"
              className="block p-4 border rounded-xl hover:bg-gray-50">
              Phân công giảng viên
            </a>
            <a
              href="/admin/notifications/send"
              className="block p-4 border rounded-xl hover:bg-gray-50">
              Gửi thông báo
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardAdmin;
