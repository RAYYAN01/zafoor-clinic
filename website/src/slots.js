// Computes bookable time slots for a doctor on a given calendar date from
// their DoctorAvailability rows + existing bookings — mirrors the logic in
// crm/src/actions/appointments.ts (getAvailableSlots) so both apps agree
// on what "available" means.
const { getDoctorAvailability, getBookedSlots } = require("./queries")

function parseTimeOnDate(date, hhmm) {
  const [h, m] = hhmm.split(":").map(Number)
  const d = new Date(date)
  d.setHours(h, m, 0, 0)
  return d
}

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function endOfDay(date) {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

async function getAvailableSlots(doctorId, dateStr) {
  const date = new Date(`${dateStr}T00:00:00`)
  const dayOfWeek = date.getDay()
  const dayStart = startOfDay(date)
  const dayEnd = endOfDay(date)

  const { availability, leaveDates } = await getDoctorAvailability(doctorId)
  const onLeave = leaveDates.some((d) => isSameDay(new Date(d), date))
  if (onLeave) return { onLeave: true, slots: [] }

  const dayRules = availability.filter((a) => a.dayOfWeek === dayOfWeek)
  if (dayRules.length === 0) return { onLeave: false, slots: [] }

  const booked = new Set(await getBookedSlots(doctorId, dayStart, dayEnd))
  const now = new Date()
  const today = isSameDay(date, now)
  const slots = []

  for (const rule of dayRules) {
    let cursor = parseTimeOnDate(date, rule.startTime)
    const end = parseTimeOnDate(date, rule.endTime)
    while (cursor < end) {
      if (!booked.has(cursor.getTime()) && (!today || cursor > now)) {
        slots.push(new Date(cursor))
      }
      cursor = new Date(cursor.getTime() + rule.slotDurationMinutes * 60000)
    }
  }

  return { onLeave: false, slots }
}

module.exports = { getAvailableSlots }
