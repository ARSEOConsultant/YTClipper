import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface FAQ {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  faqs: FAQ[];
}

export default function FAQSection({ faqs }: FAQSectionProps) {
  if (!faqs || faqs.length === 0) return null;

  return (
    <section className="w-full max-w-4xl mx-auto py-16 px-4">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 mb-4">Frequently Asked Questions</h2>
        <p className="text-zinc-500">Everything you need to know about the tool.</p>
      </div>
      <Accordion className="w-full">
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index}`} className="border-zinc-200">
            <AccordionTrigger className="text-left font-medium text-lg hover:no-underline hover:text-primary transition-colors">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-zinc-600 leading-relaxed text-base">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
