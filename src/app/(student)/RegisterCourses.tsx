import axios from "axios";
import React, { useEffect, useState } from "react";

const RegisterCourses: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOpenCourses();
  }, []);

  const fetchOpenCourses = async () => {
    try {
      const res = await axios.get("/course-classes/open");
      setCourses(res.data);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleRegister = async () => {
    if (selected.length === 0) return alert("Vui lòng chọn ít nhất 1 môn");
    try {
      await axios.post("/course-registrations", { courseClassIds: selected });
      alert("Đăng ký thành công! Vui lòng thanh toán.");
    } catch (err: any) {
      alert(err.response?.data?.message || "Đăng ký thất bại");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Đăng Ký Học Phần</h1>
      <button
        onClick={handleRegister}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg mt-6 hover:bg-blue-700">
        Đăng ký ({selected.length} môn)
      </button>
    </div>
  );
};

export default RegisterCourses;
