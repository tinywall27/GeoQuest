import type {
  AiReviewRecord,
  PublicAiReviewSummary,
  PublicReviewSummary,
  PublicSourceRef,
  PublicTopicManifest,
  ReviewRecord,
  TopicManifestSource,
} from "../domain/topic";

function toPublicReview(review: ReviewRecord): PublicReviewSummary {
  return review.checkedAt
    ? { status: review.status, checkedAt: review.checkedAt }
    : { status: review.status };
}

function toPublicAiReview(review: AiReviewRecord): PublicAiReviewSummary {
  return { status: review.status, checkedAt: review.checkedAt };
}

function toPublicSource(
  source: TopicManifestSource["sources"][number],
): PublicSourceRef {
  return {
    ...source,
    review: toPublicReview(source.review),
  };
}

function overallReview(reviews: TopicManifestSource["reviews"]): PublicReviewSummary {
  const entries = reviews ? Object.values(reviews) : [];
  const status = entries.some((review) => review.status === "blocked")
    ? "blocked"
    : entries.length > 0 && entries.every((review) => review.status === "approved")
      ? "approved"
      : entries.some((review) => review.status === "initial")
        ? "initial"
        : "unreviewed";
  const dates = entries
    .map((review) => review.checkedAt)
    .filter((date): date is string => typeof date === "string")
    .sort();
  const checkedAt = dates.at(-1);
  return checkedAt ? { status, checkedAt } : { status };
}

export function toPublicTopicManifest(
  source: TopicManifestSource,
): PublicTopicManifest {
  const { reviews, aiReview, sources, ...publicFields } = source;
  return {
    ...publicFields,
    sources: sources.map(toPublicSource),
    ...(aiReview ? { aiReview: toPublicAiReview(aiReview) } : {}),
    reviewSummary: aiReview
      ? toPublicAiReview(aiReview)
      : overallReview(reviews),
  };
}
