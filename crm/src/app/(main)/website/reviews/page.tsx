import { getReviews } from "@/actions/website"
import { getServices } from "@/actions/services"
import { ReviewManager } from "@/components/website/review-manager"

export default async function WebsiteReviewsPage() {
  const [reviews, services] = await Promise.all([getReviews(), getServices(true)])

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reviews</h1>
        <p className="text-sm text-muted-foreground">
          Patient testimonials shown on the public website. Only add reviews from real patients — nothing here is generated.
        </p>
      </div>
      <ReviewManager reviews={reviews} services={services} />
    </div>
  )
}
