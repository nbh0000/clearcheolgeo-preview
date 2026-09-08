import type { FaqItem } from '@/content/faq';

/** details/summary 기반 FAQ — JS 없이도 열고 닫히며 키보드 조작이 가능하다. */
export default function Faq({ items }: { items: FaqItem[] }) {
  return (
    <div>
      {items.map((item) => (
        <details className="disclosure" key={item.q}>
          <summary>{item.q}</summary>
          <div className="disclosure-body">
            <p className="body-md">{item.a}</p>
          </div>
        </details>
      ))}
    </div>
  );
}
