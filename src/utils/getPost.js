import { cache } from "react";
import prisma from "@/utils/connect";
import { labelFromSlug } from "@/utils/homeData";
import { readSettings } from "@/utils/userSettings";

export const getPublishedPost = cache(async (slug) => {
  if (!slug) return null;

  const post = await prisma.post.findFirst({
    where: { slug, published: true },
    include: {
      user: { select: { name: true, image: true, bio: true, jobTitle: true, username: true, email: true, settings: true } },
    },
  });
  if (!post) return null;

  if (post.user && !readSettings(post.user.settings).visibleProfile) {
    post.user = {
      name: "GrowWise member",
      image: null,
      bio: "",
      jobTitle: null,
      username: null,
      email: null,
    };
  } else if (post.user) {
    delete post.user.settings;
  }

  const cat = await prisma.category.findUnique({
    where: { slug: post.catSlug },
    select: { slug: true, title: true },
  });

  return {
    ...post,
    cat,
    categoryTitle: cat?.title || labelFromSlug(post.catSlug),
  };
});