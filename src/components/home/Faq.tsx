import { useTranslations } from "next-intl";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Section } from "@/components/shared/Section";

interface FaqItem {
  q: string;
  a: string;
}

/** Title held on the left while the questions run down the right. */
export function Faq() {
  const t = useTranslations("Home.faq");
  const items = t.raw("items") as FaqItem[];

  return (
    <Section>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="self-start lg:sticky lg:top-28 lg:col-span-5">
          <h2 className="font-display text-balance text-[44px] text-ink sm:text-[60px]">
            {t("title")}
          </h2>
          <p className="mt-4 max-w-sm text-pretty text-[16px] leading-relaxed text-ink-muted">
            {t("subtitle")}
          </p>
        </div>
        <div className="lg:col-span-7">
          <Accordion type="single" collapsible className="border-t-2 border-ink">
            {items.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-[18px] sm:text-[19px]">{item.q}</AccordionTrigger>
                <AccordionContent className="max-w-xl text-[16px] leading-relaxed">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </Section>
  );
}
