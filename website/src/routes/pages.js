const express = require("express")
const {
  getClinicSettings,
  getActiveServices,
  getServiceBySlug,
  getActiveFaqs,
  getPublishedReviews,
  getActiveDoctors,
} = require("../queries")

const router = express.Router()

// Shared clinic settings on every request, so partials (nav/footer) always
// have current phone/timings/etc. without every route re-fetching it.
router.use(async (req, res, next) => {
  try {
    res.locals.clinic = await getClinicSettings()
    res.locals.currentPath = req.path
    next()
  } catch (err) {
    next(err)
  }
})

router.get("/", async (req, res, next) => {
  try {
    const [services, reviews, faqs] = await Promise.all([
      getActiveServices(),
      getPublishedReviews(),
      getActiveFaqs(),
    ])
    res.render("home", {
      title: "Zafoor Clinic — Trusted Healthcare in George Town, Chennai",
      description:
        "Book a consultation at Zafoor Clinic, George Town, Chennai. Hairfall, acne, thyroid, skin, diabetes and general health reviews, Monday to Saturday, 6–10 PM.",
      services: services.slice(0, 6),
      reviews: reviews.slice(0, 4),
      faqs: faqs.slice(0, 5),
    })
  } catch (err) {
    next(err)
  }
})

router.get("/about", (req, res) => {
  res.render("about", {
    title: "About Zafoor Clinic",
    description: "Learn about Zafoor Clinic, a neighbourhood clinic in George Town, Chennai offering evening consultations Monday to Saturday.",
  })
})

router.get("/services", async (req, res, next) => {
  try {
    const services = await getActiveServices()
    res.render("services/index", {
      title: "Services — Zafoor Clinic",
      description: "Explore consultations offered at Zafoor Clinic: hairfall, acne, thyroid, skin, diabetes and general health reviews.",
      services,
    })
  } catch (err) {
    next(err)
  }
})

router.get("/services/:slug", async (req, res, next) => {
  try {
    const service = await getServiceBySlug(req.params.slug)
    if (!service) return res.status(404).render("404", { title: "Service not found" })
    res.render("services/show", {
      title: `${service.name} — Zafoor Clinic`,
      description: service.shortDescription || `Book a ${service.name} consultation at Zafoor Clinic, George Town, Chennai.`,
      service,
    })
  } catch (err) {
    next(err)
  }
})

router.get("/doctors", async (req, res, next) => {
  try {
    const doctors = await getActiveDoctors()
    res.render("doctors", {
      title: "Doctors & Specialists — Zafoor Clinic",
      description: "Meet the doctors seeing patients at Zafoor Clinic, George Town, Chennai.",
      doctors,
    })
  } catch (err) {
    next(err)
  }
})

router.get("/book", async (req, res, next) => {
  try {
    const [services, doctors] = await Promise.all([getActiveServices(), getActiveDoctors()])
    res.render("book", {
      title: "Book an Appointment — Zafoor Clinic",
      description: "Book your consultation at Zafoor Clinic online in a few steps.",
      services,
      doctors,
      preselectedSlug: req.query.service || "",
    })
  } catch (err) {
    next(err)
  }
})

router.get("/reviews", async (req, res, next) => {
  try {
    const reviews = await getPublishedReviews()
    res.render("reviews", {
      title: "Patient Reviews — Zafoor Clinic",
      description: "Read reviews from patients of Zafoor Clinic, George Town, Chennai.",
      reviews,
    })
  } catch (err) {
    next(err)
  }
})

router.get("/contact", (req, res) => {
  res.render("contact", {
    title: "Contact Zafoor Clinic",
    description: "Contact Zafoor Clinic in George Town, Chennai — phone, email, and directions.",
  })
})

router.get("/location", (req, res) => {
  res.render("location", {
    title: "Location & Directions — Zafoor Clinic",
    description: "Find Zafoor Clinic in George Town, Chennai, opposite Huda Mosque.",
  })
})

router.get("/faq", async (req, res, next) => {
  try {
    const faqs = await getActiveFaqs()
    res.render("faq", {
      title: "Frequently Asked Questions — Zafoor Clinic",
      description: "Answers to common questions about visiting Zafoor Clinic.",
      faqs,
    })
  } catch (err) {
    next(err)
  }
})

router.get("/privacy", (req, res) => {
  res.render("privacy", { title: "Privacy Policy — Zafoor Clinic", description: "How Zafoor Clinic handles your information." })
})

router.get("/terms", (req, res) => {
  res.render("terms", { title: "Terms & Conditions — Zafoor Clinic", description: "Terms and conditions for using Zafoor Clinic's services." })
})

module.exports = router
