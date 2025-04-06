import React from "react";

/**
 * 使用wsrv.nl代理图片URL的组件
 * @param {Object} props
 * @param {string} props.src - 原始图片URL
 * @param {number} props.width - 图片宽度
 * @param {number} props.height - 图片高度
 * @param {number} props.dpr - 设备像素比
 * @param {string} props.alt - 图片替代文本
 * @param {string} props.className - 图片CSS类名
 * @param {Object} props.imgProps - 传递给img标签的其他属性
 */
export default function ProxiedImage({
  src,
  width = 0,
  height = 0,
  dpr = 2,
  alt = "",
  className = "",
  imgProps = {},
}) {
  if (!src) return null;

  // 构建wsrv.nl URL
  let proxiedUrl = `https://wsrv.nl/?url=${encodeURIComponent(src)}`;

  // 添加可选参数
  if (width) proxiedUrl += `&w=${width}`;
  if (height) proxiedUrl += `&h=${height}`;
  if (dpr) proxiedUrl += `&dpr=${dpr}`;

  return (
    <img
      src={proxiedUrl}
      alt={alt}
      className={className}
      {...imgProps}
    />
  );
}