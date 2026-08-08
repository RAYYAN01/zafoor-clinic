// Drives the 5-step appointment booking flow on /book. No framework —
// plain DOM + fetch against /api/availability and /api/appointments.
(function () {
  const app = document.getElementById("booking-app");
  if (!app) return;

  const state = {
    service: null, // { id, slug, name, durationMinutes }
    doctorId: null,
    date: null, // "YYYY-MM-DD"
    slotIso: null,
  };

  const panels = Array.from(document.querySelectorAll("[data-step-panel]"));
  const dots = Array.from(document.querySelectorAll("[data-step-dot]"));

  function showStep(n) {
    panels.forEach((p) => p.classList.toggle("hidden", p.dataset.stepPanel !== String(n)));
    dots.forEach((d) => {
      const dotNum = Number(d.dataset.stepDot);
      const circle = d.querySelector("span");
      if (dotNum <= n) {
        circle.classList.remove("bg-line", "text-muted");
        circle.classList.add("bg-primary", "text-white");
      } else {
        circle.classList.add("bg-line", "text-muted");
        circle.classList.remove("bg-primary", "text-white");
      }
    });
    window.scrollTo({ top: app.getBoundingClientRect().top + window.scrollY - 96, behavior: "smooth" });
  }

  document.querySelectorAll("[data-back]").forEach((btn) => {
    btn.addEventListener("click", () => showStep(Number(btn.dataset.back)));
  });

  // ── Step 1: service selection ─────────────────────────────────────────
  const serviceButtons = Array.from(document.querySelectorAll(".service-option"));
  function selectService(btn) {
    serviceButtons.forEach((b) => b.classList.remove("border-primary", "ring-2", "ring-primary/20", "bg-accent/20"));
    btn.classList.add("border-primary", "ring-2", "ring-primary/20", "bg-accent/20");
    state.service = {
      id: btn.dataset.serviceId,
      slug: btn.dataset.serviceSlug,
      name: btn.dataset.serviceName,
      durationMinutes: Number(btn.dataset.serviceDuration),
    };
    fetchDoctors().then(() => showStep(2));
  }
  serviceButtons.forEach((btn) => btn.addEventListener("click", () => selectService(btn)));

  const preselected = app.dataset.preselected;
  if (preselected) {
    const match = serviceButtons.find((b) => b.dataset.serviceSlug === preselected);
    if (match) selectService(match);
  }

  // ── Step 2: doctor + date ──────────────────────────────────────────────
  const doctorPicker = document.getElementById("doctor-picker");
  const doctorSelect = document.getElementById("doctor-select");
  const dateInput = document.getElementById("date-input");
  const dateError = document.getElementById("date-error");

  const today = new Date();
  dateInput.min = today.toISOString().slice(0, 10);

  let doctorsLoaded = false;
  function fetchDoctors() {
    if (doctorsLoaded) return Promise.resolve();
    return fetch("/api/doctors")
      .then((r) => r.json())
      .then((doctors) => {
        doctorsLoaded = true;
        if (Array.isArray(doctors) && doctors.length > 1) {
          doctorPicker.classList.remove("hidden");
        }
        if (Array.isArray(doctors) && doctors.length > 0 && !state.doctorId) {
          state.doctorId = doctorSelect.value || doctors[0].id;
        }
      })
      .catch(() => {});
  }
  doctorSelect.addEventListener("change", () => {
    state.doctorId = doctorSelect.value;
  });

  document.getElementById("to-step-3").addEventListener("click", () => {
    dateError.classList.add("hidden");
    if (!dateInput.value) {
      dateError.textContent = "Please choose a date.";
      dateError.classList.remove("hidden");
      return;
    }
    const chosen = new Date(`${dateInput.value}T00:00:00`);
    if (chosen.getDay() === 0) {
      dateError.textContent = "The clinic is closed on Sundays. Please choose Monday–Saturday.";
      dateError.classList.remove("hidden");
      return;
    }
    state.date = dateInput.value;
    loadSlots();
    showStep(3);
  });

  // ── Step 3: time slots ─────────────────────────────────────────────────
  const timeSlotsEl = document.getElementById("time-slots");
  const timeEmpty = document.getElementById("time-empty");
  const timeLoading = document.getElementById("time-loading");
  const timeSubtitle = document.getElementById("time-subtitle");
  const toStep4 = document.getElementById("to-step-4");

  function formatDateLabel(dateStr) {
    return new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }

  function loadSlots() {
    timeSlotsEl.innerHTML = "";
    timeEmpty.classList.add("hidden");
    timeLoading.classList.remove("hidden");
    toStep4.disabled = true;
    state.slotIso = null;
    timeSubtitle.textContent = `Available times for ${formatDateLabel(state.date)}`;

    const params = new URLSearchParams({ doctorId: state.doctorId, date: state.date });
    fetch(`/api/availability?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        timeLoading.classList.add("hidden");
        if (data.onLeave || !data.slots || data.slots.length === 0) {
          timeEmpty.classList.remove("hidden");
          return;
        }
        data.slots.forEach((iso) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "time-slot rounded-lg border border-line px-3 py-2 text-sm transition-colors hover:border-primary/50";
          btn.textContent = new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
          btn.addEventListener("click", () => {
            document.querySelectorAll(".time-slot").forEach((b) => b.classList.remove("border-primary", "bg-accent/20", "ring-2", "ring-primary/20"));
            btn.classList.add("border-primary", "bg-accent/20", "ring-2", "ring-primary/20");
            state.slotIso = iso;
            toStep4.disabled = false;
          });
          timeSlotsEl.appendChild(btn);
        });
      })
      .catch(() => {
        timeLoading.classList.add("hidden");
        timeEmpty.textContent = "Could not load availability. Please try again.";
        timeEmpty.classList.remove("hidden");
      });
  }

  toStep4.addEventListener("click", () => showStep(4));

  // ── Step 4: submit ──────────────────────────────────────────────────────
  const form = document.getElementById("patient-form");
  const formError = document.getElementById("form-error");
  const submitBtn = document.getElementById("submit-booking");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    formError.classList.add("hidden");
    submitBtn.disabled = true;
    submitBtn.textContent = "Booking…";

    const fd = new FormData(form);
    fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: fd.get("firstName"),
        phone: fd.get("phone"),
        email: fd.get("email"),
        gender: fd.get("gender"),
        reason: fd.get("reason"),
        serviceId: state.service.id,
        doctorId: state.doctorId,
        scheduledAt: state.slotIso,
      }),
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Could not book appointment");
        return data;
      })
      .then((data) => {
        document.getElementById("confirm-code").textContent = data.appointmentCode;
        document.getElementById("confirm-service").textContent = data.service;
        document.getElementById("confirm-date").textContent = formatDateLabel(state.date);
        document.getElementById("confirm-time").textContent = new Date(state.slotIso).toLocaleTimeString(undefined, {
          hour: "numeric",
          minute: "2-digit",
        });

        const start = new Date(state.slotIso);
        const end = new Date(start.getTime() + (state.service.durationMinutes || 30) * 60000);
        const fmt = (d) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
        const calendarUrl =
          "https://www.google.com/calendar/render?action=TEMPLATE" +
          `&text=${encodeURIComponent("Zafoor Clinic — " + data.service)}` +
          `&dates=${fmt(start)}/${fmt(end)}` +
          `&location=${encodeURIComponent("Zafoor Clinic, George Town, Chennai")}`;
        document.getElementById("add-to-calendar").href = calendarUrl;
        document.getElementById("add-to-calendar").target = "_blank";
        document.getElementById("add-to-calendar").rel = "noopener";

        showStep(5);
      })
      .catch((err) => {
        formError.textContent = err.message || "Something went wrong. Please try again or call the clinic.";
        formError.classList.remove("hidden");
      })
      .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = "Confirm Appointment";
      });
  });
})();
