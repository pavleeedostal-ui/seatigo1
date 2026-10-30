import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { SeatigoLogo } from "@/components/branding/SeatigoLogo";
import {
  FacebookIcon,
  InstagramIcon,
  XIcon,
  YoutubeIcon,
} from "@/components/shared/SocialIcons";

export function Footer() {
  const t = useTranslations("Footer");
  const tNav = useTranslations("Nav");
  const year = new Date().getFullYear();

  const exploreLinks = [
    { href: "/matches", label: tNav("matches") },
    { href: "/competitions", label: tNav("competitions") },
    { href: "/clubs", label: tNav("clubs") },
  ];

  const companyLinks = [
    { href: "/about", label: t("about") },
    { href: "/contact", label: t("contact") },
    { href: "/faq", label: t("faq") },
  ];

  const legalLinks = [
    { href: "/terms", label: t("terms") },
    { href: "/privacy", label: t("privacy") },
    { href: "/cookies", label: t("cookies") },
  ];

  const socials = [
    { icon: InstagramIcon, label: "Instagram", href: "https://instagram.com" },
    { icon: XIcon, label: "X", href: "https://x.com" },
    { icon: FacebookIcon, label: "Facebook", href: "https://facebook.com" },
    { icon: YoutubeIcon, label: "YouTube", href: "https://youtube.com" },
  ];

  return (
    // The album's back cover: the deepest blue, the slogan at poster scale,
    // and the plain facts — where purchases happen — at the foot.
    <footer className="on-album bg-album-night text-white">
      <div className="container-page grid grid-cols-2 gap-10 pb-14 pt-16 sm:gap-12 sm:pt-20 lg:grid-cols-12">
        <div className="col-span-2 lg:col-span-6">
          <SeatigoLogo size={30} variant="light" />
          <p className="font-display mt-8 text-[56px] text-white sm:text-[80px]">
            {t("tagline")}
          </p>
          <div className="mt-8 flex items-center gap-2">
            {socials.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={social.label}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-album-line text-album-ink-muted transition-colors hover:border-white hover:text-white"
              >
                <social.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div className="col-span-2 grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-6 lg:pt-2">
          <FooterColumn title={t("navTitle")} links={exploreLinks} />
          <FooterColumn title={t("companyTitle")} links={companyLinks} />
          <FooterColumn title={t("legalTitle")} links={legalLinks} />
        </div>
      </div>

      <div className="border-t border-album-line">
        <div className="container-page flex flex-col gap-3 py-6 text-[13px] text-album-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} Seatigo. {t("rights")}
          </p>
          <p className="max-w-2xl sm:text-right">{t("disclaimer")}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <p className="font-tab mb-4 text-[12px] text-album-ink-muted">{title}</p>
      <ul className="flex flex-col gap-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-[16px] font-medium text-white underline decoration-transparent underline-offset-4 transition-colors hover:decoration-signal"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
