import { PageHeader } from "./PageHeader";

/** A plain page of the album: its title on the blue band, its text on paper. */
export function StaticPage({ title, body }: { title: string; body: string }) {
  return (
    <>
      <PageHeader title={title} size="compact" />
      <div className="container-page pb-24 pt-12 sm:pt-16">
        <p className="max-w-[65ch] text-pretty text-[18px] leading-relaxed text-ink-soft sm:text-[20px]">
          {body}
        </p>
      </div>
    </>
  );
}
