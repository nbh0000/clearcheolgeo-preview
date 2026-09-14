import { siteConfig } from '@/config/site';

const cfg = siteConfig.achievements;

/** 운영자가 근거를 확인해 켠 항목만 반환한다. */
export function getEnabledAchievements() {
  const list: { value: string; label: string; note: string | null }[] = [];
  if (cfg.projects.enabled) list.push({ ...cfg.projects });
  if (cfg.award.enabled) list.push({ ...cfg.award });
  return list;
}

/**
 * 실적·수상 강조 영역 (메인 첫 화면 아래 · 회사소개)
 * - 확인된 항목이 하나도 없으면 대체 문구를 보여준다.
 * - 수상 항목은 주관기관·부문·기간(note)이 있을 때 보조 설명으로 함께 표시한다.
 */
export default function Achievements({ tone = 'light' }: { tone?: 'light' | 'soft' }) {
  const items = getEnabledAchievements();

  if (items.length === 0) {
    return (
      <section className={`achievements achievements-fallback ${tone === 'soft' ? 'band-soft' : ''}`} aria-label="클리어철거 소개">
        <div className="container">
          <p className="achievements-fallback-text">
            {cfg.fallback[0]}
            <br />
            {cfg.fallback[1]}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className={`achievements ${tone === 'soft' ? 'band-soft' : ''}`} aria-label="시공 실적과 수상 이력">
      <div className="container">
        <ul className="achievements-grid" data-count={items.length}>
          {items.map((item) => (
            <li className="achievement" key={item.label}>
              <strong className="achievement-value num">{item.value}</strong>
              <span className="achievement-label">{item.label}</span>
              {item.note && <span className="achievement-note">{item.note}</span>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
