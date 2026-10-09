export function StaticPage({ title, body }: { title: string; body: string }) {
  return (
    <div className="container-page max-w-2xl py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        {title}
      </h1>
      <p className="mt-5 text-lg leading-relaxed text-ink-muted">{body}</p>
    </div>
  );
}
