import { useEffect, useRef, useState } from "react";
import styles from "./Modal.module.css";
import LoadingSpinner from "./LoadingSpinner";

export default function Modal({ isOpen, onClose, children, title, loading }) {
  const modalRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // 处理动画状态
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      // 在下一帧开始渲染动画
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    } else {
      setIsVisible(false);
      // 等待动画结束后再完全移除组件
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 300); // 动画持续时间
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // 处理点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // 阻止背景滚动
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      // 恢复背景滚动
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  // ESC 键关闭
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [isOpen, onClose]);

  if (!isAnimating) return null;

  return (
    <div
      className={`${styles.modalOverlay} ${isVisible ? styles.visible : styles.hidden}`}
    >
      <div
        className={`${styles.modalContainer} ${isVisible ? styles.slideIn : styles.slideOut}`}
        ref={modalRef}
      >
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{title}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>
        <div className={styles.modalContent}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <LoadingSpinner />
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}
