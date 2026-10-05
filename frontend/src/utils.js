export function formatRWF(amount) {
  return new Intl.NumberFormat("en-RW", {
    style: "currency",
    currency: "RWF",
    maximumFractionDigits: 0
  }).format(amount);
}

// Rwandan mobile money numbers: 10 digits total. MTN Mobile Money numbers
// start with 078 or 079; Airtel Money numbers start with 072 or 073. Accepts
// the number with or without spaces (customers type it either way).
const PHONE_PATTERNS = {
  momo: /^(078|079)\d{7}$/,
  airtel: /^(072|073)\d{7}$/
};

export function isValidRwandaPhone(method, phone) {
  const digitsOnly = (phone || "").replace(/\s+/g, "");
  const pattern = PHONE_PATTERNS[method];
  return pattern ? pattern.test(digitsOnly) : true;
}
