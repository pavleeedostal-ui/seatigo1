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
    <footer className="border-t border-border bg-white">
      <div className="container-page grid grid-cols-2 gap-10 py-16 sm:gap-12 lg:grid-cols-5">
        <div className="col-span-2 lg:col-span-2">
          <SeatigoLogo size={32} tagline={t("tagline")} />
          <div className="mt-6 flex items-center gap-2">
            {socials.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={social.label}
                className="inline-flex h-9 w-9 items-center justify-center rounded-control border border-border text-ink-muted transition-colors hover:border-border-strong hover:text-ink"
              >
                <social.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <FooterColumn title={t("navTitle")} links={exploreLinks} />
        <FooterColumn title={t("companyTitle")} links={companyLinks} />
        <FooterColumn title={t("legalTitle")} links={legalLinks} />
      </div>

      <div className="border-t border-border">
        <div className="container-page flex flex-col gap-3 py-6 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between">
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
      <p className="mb-4 text-[13px] font-medium uppercase tracking-wider text-ink-muted">{title}</p>
      <ul className="flex flex-col gap-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-[15px] text-ink-muted transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
