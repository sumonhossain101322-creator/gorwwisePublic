import Image from "next/image";
import styles from "./AuthorCard.module.css";

type Author = {
  name: string; role: string; image: string; bio: string; articlesHref?: string;
  socials?: { facebook?: string; twitter?: string; linkedin?: string };
};
type Props = { author: Author };

export default function AuthorCard({ author }: Props) {
  const socials = [
    ["facebook", "Facebook"], ["twitter", "X"], ["linkedin", "LinkedIn"],
  ] as const;
  return (
    <section className={styles.author} aria-labelledby="author-heading">
      <div className={styles.imageWrap}><Image src={author.image} alt={`${author.name}, article author`} fill sizes="(max-width: 520px) 6rem, 8rem" className={styles.image} /></div>
      <div className={styles.body}>
        <div className={styles.header}>
          <div><h2 className={styles.name} id="author-heading">{author.name}</h2><p className={styles.role}>{author.role}</p></div>
          {author.articlesHref && <a className={styles.articles} href={author.articlesHref}>View articles</a>}
        </div>
        <p className={styles.bio}>{author.bio}</p>
        <nav className={styles.socials} aria-label={`${author.name} social profiles`}>
          {socials.map(([key, label]) => {
            const href = author.socials?.[key];
            return href ? <a key={key} href={href} target="_blank" rel="noopener noreferrer" aria-label={`${author.name} on ${label}`}>{label}</a> : null;
          })}
        </nav>
      </div>
    </section>
  );
}
