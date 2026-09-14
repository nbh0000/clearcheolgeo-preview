import { getPublishedReviews, type Review } from '@/content/reviews';

/** 별점 — 시각적으로는 별 5개, 보조기술에는 '5점 만점에 N점' 으로 전달한다. */
function Stars({ rating }: { rating: Review['rating'] }) {
  return (
    <div className="review-stars" role="img" aria-label={`5점 만점에 ${rating}점`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          width="20"
          height="20"
          aria-hidden="true"
          focusable="false"
          className={i < rating ? 'is-on' : ''}
        >
          <path d="M10 1.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.6 7.7l5.8-.8z" />
        </svg>
      ))}
    </div>
  );
}

/**
 * 고객 후기 영역
 * - 같은 화면 너비에서 모든 카드의 가로·세로 크기가 같다 (grid-auto-rows: 1fr)
 * - 본문은 잘리거나 줄이지 않고 전체를 표시한다
 * - 카드 수에 따라 배치가 달라진다: 4개 → 2×2, 5개 → 3+2 중앙 정렬 (CSS data-count)
 * - 공개 후기가 없으면 영역 자체를 렌더링하지 않는다
 */
export default function Reviews() {
  const items = getPublishedReviews();
  if (items.length === 0) return null;

  return (
    <section className="section band-dark reviews" aria-labelledby="reviews-title">
      <div className="container">
        <div className="text-center">
          <p className="eyebrow reviews-eyebrow">CUSTOMER REVIEWS</p>
          <h2 className="display-sm mt-sm" id="reviews-title">
            고객님들의 실제 만족도 후기
          </h2>
          <p className="body-md mt-base mx-auto measure">
            견적 상담부터 현장 마무리까지,
            <br />
            고객이 직접 전하는 클리어철거 이야기.
          </p>
        </div>

        <ul className="reviews-grid mt-xl" data-count={items.length}>
          {items.map((review) => (
            <li className="review-card" key={review.author + review.body.slice(0, 12)}>
              <Stars rating={review.rating} />
              <p className="review-body">{review.body}</p>
              <p className="review-author">{review.author}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
