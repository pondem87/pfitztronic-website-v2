export type CountryCode = "bw" | "zw";

export interface SiteConfig {
  countryCode: CountryCode;
  countryName: string;
  domain: string;
  origin: string;
  locale: string;
  alternateOrigin: string;
  alternateLocale: string;
  defaultOrigin: string;
  location: string;
  phoneDisplay: string;
  phoneHref: string;
  email: string;
  mapUrl: string;
  googleAnalyticsId: string;
  contactFormEndpoint: string;
  facebookUrl: string;
  xUrl: string;
  linkedinUrl: string;
}

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} must be defined in the country environment file.`);
  return value;
}

function requiredUrl(name: string): string {
  const value = required(name);
  try {
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Unsupported URL protocol');
  } catch {
    throw new Error(`${name} must be a valid absolute HTTP(S) URL.`);
  }
  return value.replace(/\/$/, "");
}

const countryCode = required("SITE_COUNTRY");

if (countryCode !== "bw" && countryCode !== "zw") {
  throw new Error(`Unsupported SITE_COUNTRY "${countryCode}". Expected "bw" or "zw".`);
}

export const siteConfig: SiteConfig = {
  countryCode,
  countryName: required("SITE_COUNTRY_NAME"),
  domain: required("SITE_DOMAIN"),
  origin: requiredUrl("SITE_ORIGIN"),
  locale: required("SITE_LOCALE"),
  alternateOrigin: requiredUrl("SITE_ALTERNATE_ORIGIN"),
  alternateLocale: required("SITE_ALTERNATE_LOCALE"),
  defaultOrigin: requiredUrl("SITE_DEFAULT_ORIGIN"),
  location: required("SITE_LOCATION"),
  phoneDisplay: required("SITE_PHONE_DISPLAY"),
  phoneHref: required("SITE_PHONE_HREF").replace(/^tel:/i, ""),
  email: required("SITE_EMAIL"),
  mapUrl: requiredUrl("SITE_MAP_URL"),
  googleAnalyticsId: required("GOOGLE_ANALYTICS_ID"),
  contactFormEndpoint: requiredUrl("CONTACT_FORM_ENDPOINT"),
  facebookUrl: requiredUrl("FACEBOOK_URL"),
  xUrl: requiredUrl("X_URL"),
  linkedinUrl: requiredUrl("LINKEDIN_URL"),
};
