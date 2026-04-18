interface AuthorsProps {
  authors: string[];
}
export default function ({ authors }: AuthorsProps) {
  return (
    <div className="marketplace-card__authors">
      {authors.map((author, index) => (
        <a
          className="marketplace-card__author"
          dir="auto"
          draggable="false"
          href={`https://github.com/${author}`}
          key={index}
          onClick={(e) => e.stopPropagation()}
          rel="noopener noreferrer"
          target="_blank"
          title={author}
        >
          {author}
        </a>
      ))}
    </div>
  );
}
