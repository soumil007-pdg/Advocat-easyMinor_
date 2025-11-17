'use client';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

// Base style for the shimmer
const skeletonBase = {
  baseColor: "#ebebeb",
  highlightColor: "#f5f5f5",
  className: "skeleton-shimmer", // Use the custom shimmer from globals.css
};

export const ChatSkeleton = ({ lines = 3 }) => (
  <div className="space-y-4 p-4">
    <Skeleton {...skeletonBase} height={60} width="80%" />
    <Skeleton {...skeletonBase} height={60} width="60%" />
    <Skeleton {...skeletonBase} height={60} width="70%" />
    <Skeleton {...skeletonBase} height={40} width="30%" />
  </div>
);

export const FormSkeleton = ({ fields = 4 }) => (
  <div className="space-y-6 p-4">
    {[...Array(fields)].map((_, i) => (
      <Skeleton key={i} {...skeletonBase} height={i < 2 ? 40 : 100} />
    ))}
    <Skeleton {...skeletonBase} height={40} count={2} width="50%" />
  </div>
);

export const AnalysisSkeleton = () => (
  <div className="space-y-6 p-4">
    <Skeleton {...skeletonBase} height={200} />
    <Skeleton {...skeletonBase} height={150} count={3} />
    <Skeleton {...skeletonBase} height={50} width="70%" />
  </div>
);