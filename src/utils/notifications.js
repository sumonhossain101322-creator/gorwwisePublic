import prisma from "@/utils/connect";
import { refreshPaths } from "@/utils/dashboard";
import { readSettings } from "@/utils/userSettings";
import { NOTICE_TITLE } from "@/utils/notificationLabels";

const APPROVAL_LABEL = {
  POST_CREATE: "new post",
  POST_UPDATE: "post edit",
  POST_DELETE: "deletion request",
};

function preferencesAllow(settingsJson, type) {
  const settings = readSettings(settingsJson);
  if (type === "COMMENT") {
    return settings.notifyComments !== false;
  }
  return settings.notifyPostActivity !== false;
}

export async function createNotification({ recipientId, senderId = null, type, message, link = "/" }) {
  if (!recipientId || !type || !message) return null;
  if (senderId && senderId === recipientId) return null;

  try {
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { settings: true, email: true, name: true },
    });
    if (!recipient || !preferencesAllow(recipient.settings, type)) return null;

    const row = await prisma.notification.create({
      data: {
        recipientId,
        senderId: senderId || null,
        type,
        message: message.slice(0, 500),
        link: (link || "/").slice(0, 500),
      },
    });

    const prefs = readSettings(recipient.settings);
    if (prefs.notifyEmail !== false && recipient.email) {
      const subject = NOTICE_TITLE[type] || "GrowWise notification";
      import("@/utils/mail")
        .then(({ sendNotificationEmail }) =>
          sendNotificationEmail({
            to: recipient.email,
            name: recipient.name,
            subject: `GrowWise: ${subject}`,
            message,
            path: link || "/profile",
          }),
        )
        .catch((err) => console.error("Notification email failed:", err?.message || err));
    }

    refreshPaths(["/profile", "/notifications"]);
    return row;
  } catch (err) {
    console.error("createNotification failed:", err?.message || err);
    return null;
  }
}

async function notifyRole(role, payload) {
  const users = await prisma.user.findMany({
    where: { role },
    select: { id: true },
  });
  await Promise.all(users.map((user) => createNotification({ ...payload, recipientId: user.id })));
}

export async function notifyAdmins(payload) {
  await notifyRole("ADMIN", payload);
}

function displayName(user) {
  return user?.name?.trim() || user?.email || "Someone";
}

export async function notifyAdminsOfReview(requester, post, approvalType) {
  const kind = APPROVAL_LABEL[approvalType] || "submission";
  const title = post?.title ? `"${post.title}"` : "a post";
  const message = `${displayName(requester)} submitted a ${kind} for review: ${title}.`;
  await notifyAdmins({
    senderId: requester.id,
    type: "POST_REVIEW_REQUEST",
    message,
    link: "/admin/approvals",
  });
}

export async function notifyRoleUpgradeRequest(applicant) {
  const message = `${displayName(applicant)} applied to become a writer.`;
  await notifyAdmins({
    senderId: applicant.id,
    type: "ROLE_UPGRADE_REQUEST",
    message,
    link: "/admin/approvals",
  });
}

export async function notifyNewComment({ commenter, post, commentText, parentComment }) {
  const postLink = `/posts/${post.slug}#comments`;
  const who = displayName(commenter);
  const preview =
    commentText.length > 100 ? `${commentText.slice(0, 97)}...` : commentText;

  const author = await prisma.user.findUnique({
    where: { email: post.userEmail },
    select: { id: true, settings: true },
  });
  if (author && author.id !== commenter.id) {
    await createNotification({
      recipientId: author.id,
      senderId: commenter.id,
      type: "COMMENT",
      message: `${who} commented on your post "${post.title}": ${preview}`,
      link: postLink,
    });
  }

  if (parentComment?.userEmail && parentComment.userEmail !== commenter.email) {
    const parentUser = await prisma.user.findUnique({
      where: { email: parentComment.userEmail },
      select: { id: true },
    });
    if (parentUser) {
      await createNotification({
        recipientId: parentUser.id,
        senderId: commenter.id,
        type: "COMMENT",
        message: `${who} replied to your comment on "${post.title}".`,
        link: postLink,
      });
    }
  }
}

function postDecisionMessage(request, approved) {
  const title = request.targetPost?.title || "your post";
  const slug = request.targetPost?.slug;
  const link = slug ? `/posts/${slug}` : "/profile";

  if (request.type === "ROLE_UPGRADE") {
    if (approved) {
      return {
        type: "ROLE_UPGRADE_APPROVED",
        message: "Your writer application was approved. You can now publish from the Write page.",
        link: "/write",
      };
    }
    return {
      type: "ROLE_UPGRADE_REJECTED",
      message: "Your writer application was not approved at this time.",
      link: "/profile",
    };
  }

  if (approved) {
    if (request.type === "POST_DELETE") {
      return {
        type: "POST_APPROVED",
        message: `Your deletion request for "${title}" was approved. The post has been removed.`,
        link: "/profile",
      };
    }
    if (request.type === "POST_UPDATE") {
      return {
        type: "POST_APPROVED",
        message: `Your edit to "${title}" was approved and is now live.`,
        link,
      };
    }
    return {
      type: "POST_APPROVED",
      message: `Your post "${title}" was approved and is now published.`,
      link,
    };
  }

  const action =
    request.type === "POST_DELETE"
      ? "deletion"
      : request.type === "POST_UPDATE"
        ? "edit"
        : "publication";
  return {
    type: "POST_REJECTED",
    message: `Your ${action} request for "${title}" was rejected.`,
    link: "/profile",
  };
}

export async function notifyApprovalDecision(request, approved, reviewerId = null) {
  if (!request?.requesterId) return;
  const { type, message, link } = postDecisionMessage(request, approved);
  await createNotification({
    recipientId: request.requesterId,
    senderId: reviewerId,
    type,
    message,
    link,
  });
}