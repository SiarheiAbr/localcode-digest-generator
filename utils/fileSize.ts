const getFileSizeFromSlider = (value: number): number => {
  if (value <= 50) {
    return Math.round(1 + (value / 50) * 49);
  }

  // 50kB..100MB (exponential)
  const rightProgress = (value - 50) / 50;
  const exponentialValue = Math.pow(rightProgress, 1.5);
  const sizeInKb = 50 + exponentialValue * (100 * 1024 - 50);
  return Math.round(sizeInKb);
};

const formatFileSize = (sizeInKb: number): string => {
  if (sizeInKb >= 1024) {
    const sizeInMb = Math.round(sizeInKb / 1024);
    return `${sizeInMb}MB`;
  }
  return `${sizeInKb}kB`;
};

const formatTokenCount = (count: number): string => {
  if (count >= 1000) {
    const inThousands = count / 1000;
    const fixed =
      inThousands >= 10 ? inThousands.toFixed(0) : inThousands.toFixed(1);
    return `${fixed}k`;
  }
  return `${count}`;
};

export { getFileSizeFromSlider, formatFileSize, formatTokenCount };
