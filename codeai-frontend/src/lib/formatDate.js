export const formatDate = (isoString) => {
  if (!isoString) return "-";

  // 문자열이 아닌 값(Date 객체, 숫자 타임스탬프 등)이 들어와도 안전하게 처리
  if (typeof isoString !== 'string') {
    const fallbackDate = new Date(isoString);
    if (Number.isNaN(fallbackDate.getTime())) return "-";
    return fallbackDate.toLocaleString("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  }

  // 1. 타임존 표시(Z 또는 +09:00 등 오프셋)가 없으면 UTC로 간주하고 'Z'를 붙임
  // 2. 이미 타임존 표시가 있다면 그대로 둠
  const hasTimezone = /Z$|[+-]\d{2}:\d{2}$/.test(isoString);
  const date = new Date(hasTimezone ? isoString : isoString + 'Z');

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
};