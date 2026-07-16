import React from "react";

interface LoadingProps {
  size?: "small" | "medium" | "large";
  text?: string;
  fullScreen?: boolean;
  overlay?: boolean;
}

const Loading: React.FC<LoadingProps> = ({
  size = "medium",
  text = "Đang tải...",
  fullScreen = false,
  overlay = false,
}) => {
  const sizeClasses = {
    small: "w-6 h-6",
    medium: "w-10 h-10",
    large: "w-14 h-14",
  };

  const content = (
    <div className="flex flex-col items-center justify-center">
      <div
        className={`animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 ${sizeClasses[size]}`}
      />
      {text && <p className="mt-4 text-gray-600 text-sm font-medium">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/90 flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-40">
        {content}
      </div>
    );
  }

  return content;
};

export default Loading;
