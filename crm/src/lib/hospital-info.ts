// Static fallback identity used anywhere the DB-backed ClinicSettings row
// hasn't loaded yet (e.g. synchronous contexts). The CRM's Website Content
// settings page is the source of truth — see `getClinicSettings()`.
export const CLINIC_INFO = {
  name: "Zafoor Clinic",
  address: "No. 69/70, St. Xavier Street, Broadway, Sevenwells, George Town, Chennai - 600001, Tamil Nadu, India",
  landmark: "Opposite Huda Mosque",
  phone: "8940399403",
  email: "ZafoorClinic@gmail.com",
}
