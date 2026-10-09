import { useTranslations } from "next-intl";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Section, SectionHeader } from "@/components/shared/Section";

interface FaqItem {
  q: string;
  a: string;
}

export function Faq() {
  const t = useTranslations("Home.faq");
  const items = t.raw("items") as FaqItem[];

  return (
    <Section>
      <SectionHeader title={t("title")} subtitle={t("subtitle")} />
      <div className="max-w-2xl">
        <Accordion type="single" collapsible>
          {items.map((item, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-[16px]">{item.q}</AccordionTrigger>
              <AccordionContent className="max-w-xl text-[15px] leading-relaxed">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
  );
}
