export const NOTICE_TITLE = {
  COMMENT: "New comment",
  LIKE: "New like",
  FOLLOW: "New follower",
  POST_APPROVED: "Post approved",
  POST_REJECTED: "Post rejected",
  POST_REVIEW_REQUEST: "Review requested",
  ROLE_UPGRADE_REQUEST: "Writer application",
  ROLE_UPGRADE_APPROVED: "Writer access granted",
  ROLE_UPGRADE_REJECTED: "Writer application",
};

export function noticeBoardType(type) {
  if (type === "COMMENT") return "comment";
  if (type === "FOLLOW" || type === "ROLE_UPGRADE_APPROVED" || type === "ROLE_UPGRADE_REJECTED") {
    return "user";
  }
  return "bell";
}

export function timeAgo(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return `${days} d ago`;
}