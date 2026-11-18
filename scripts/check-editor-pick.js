const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error("Usage: node scripts/check-editor-pick.js <post-slug>");
    process.exit(1);
  }
  const post = await prisma.post.findUnique({
    where: { slug },
    select: { slug: true, userEmail: true, title: true, user: { select: { name: true, email: true } } },
  });
  if (!post) {
    console.log("Post not found");
    return;
  }
  console.log("post", post);
  const picks = await prisma.post.findMany({
    where: {
      published: true,
      status: "PUBLISHED",
      userEmail: post.userEmail,
      editorPick: true,
      NOT: { slug },
    },
    select: { slug: true, title: true, img: true, editorPick: true },
  });
  console.log("editor picks for author", picks.length, picks);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());