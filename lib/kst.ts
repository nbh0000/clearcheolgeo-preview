/** 한국시간(KST, UTC+9) 기준 날짜 키. 팝업의 "오늘 하루 보지 않기" 판정에 사용한다. */
export function kstDateKey(date: Date = new Date()): string {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10); // YYYY-MM-DD
}
