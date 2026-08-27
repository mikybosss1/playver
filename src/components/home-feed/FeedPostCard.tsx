"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export type FeedPostCardProps = {
  authorName: string;
  authorInitial: string;
  authorColor: string;
  verified?: boolean;
  tag?: string;
  subtitle: string;
  body: string;
  hashtags?: string[];
  achievement?: { label: string; title: string };
  likes: number;
  comments: number;
  shares: number;
};

const IconVerified = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l2.4 2.2 3.2-.6.6 3.2L21 9l-1.8 2.8L21 15l-2.8.6-.6 3.2-3.2-.6L12 21l-2.4-2.2-3.2.6-.6-3.2L3 15l1.8-2.8L3 9l2.8-.6.6-3.2 3.2.6L12 2z" />
    <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const IconHeart = ({ filled }: { filled: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "#e21d12" : "none"} stroke={filled ? "#e21d12" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.6z" />
  </svg>
);

export default function FeedPostCard({
  authorName,
  authorInitial,
  authorColor,
  verified,
  tag,
  subtitle,
  body,
  hashtags,
  achievement,
  likes,
  comments,
  shares,
}: FeedPostCardProps) {
  const t = useTranslations("HomeFeed");
  const [liked, setLiked] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const displayLikes = likes + (liked ? 1 : 0);

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
      <div className="flex items-start gap-3">
        <span
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
          style={{ backgroundColor: authorColor }}
        >
          {authorInitial}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-zinc-900">{authorName}</span>
            {verified && <span className="text-[#e21d12]"><IconVerified /></span>}
            {tag && (
              <span className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold">
                🏆 {tag}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400">{subtitle}</p>
        </div>
        <button type="button" className="text-zinc-300 hover:text-zinc-500 transition-colors shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
          </svg>
        </button>
      </div>

      <p className={`text-sm text-zinc-700 leading-relaxed mt-3 ${expanded ? "" : "line-clamp-2"}`}>{body}</p>
      {!expanded && (
        <button type="button" onClick={() => setExpanded(true)} className="text-sm font-semibold text-[#e21d12] mt-1">
          {t("readMore")}
        </button>
      )}

      {hashtags && hashtags.length > 0 && (
        <p className="text-sm font-semibold text-[#e21d12] mt-2">
          {hashtags.map((tag) => `#${tag}`).join(" ")}
        </p>
      )}

      {achievement && (
        <div className="mt-4 rounded-xl bg-zinc-900 p-4 flex items-center gap-4">
          <span className="w-12 h-12 rounded-lg bg-amber-400 flex items-center justify-center text-2xl shrink-0">
            🏆
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold tracking-wide uppercase text-zinc-400">{achievement.label}</p>
            <p className="text-base font-bold text-white">{achievement.title}</p>
            <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
              <span className="text-[#e21d12]"><IconVerified /></span>
              {t("verifiedByPlayver")}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-4">
        <span className="flex items-center gap-1 text-sm text-zinc-500">
          <IconHeart filled={liked} /> {displayLikes}
        </span>
        <span className="text-xs text-zinc-400">
          {comments} {t("comment").toLowerCase()} · {shares} {t("share").toLowerCase()}
        </span>
      </div>

      <div className="flex items-center gap-6 mt-3 pt-3 border-t border-zinc-100">
        <button
          type="button"
          onClick={() => setLiked((v) => !v)}
          className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${liked ? "text-[#e21d12]" : "text-zinc-500 hover:text-zinc-700"}`}
        >
          <IconHeart filled={liked} />
          {t("like")}
        </button>
        <button type="button" className="flex items-center gap-1.5 text-sm font-semibold text-zinc-500 hover:text-zinc-700 transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          {t("comment")}
        </button>
        <button type="button" className="flex items-center gap-1.5 text-sm font-semibold text-zinc-500 hover:text-zinc-700 transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.6" y1="10.6" x2="15.4" y2="6.4" /><line x1="8.6" y1="13.4" x2="15.4" y2="17.6" />
          </svg>
          {t("share")}
        </button>
        <button type="button" className="ml-auto text-zinc-400 hover:text-zinc-600 transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
