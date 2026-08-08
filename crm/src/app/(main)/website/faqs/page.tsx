import { getFaqs } from "@/actions/website"
import { FaqManager } from "@/components/website/faq-manager"

export default async function WebsiteFaqsPage() {
  const faqs = await getFaqs()

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">FAQs</h1>
        <p className="text-sm text-muted-foreground">Questions and answers shown on the public website&apos;s FAQ page.</p>
      </div>
      <FaqManager faqs={faqs} />
    </div>
  )
}
