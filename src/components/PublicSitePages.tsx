import React, { useState } from "react";
import {
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  FileText,
  HelpCircle,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  ArrowLeft,
  Clock,
  Home,
} from "lucide-react";

export type PublicPageRoute = "booking" | "support" | "privacy" | "tc";

interface PublicSitePagesProps {
  activePage: PublicPageRoute;
  onSelectPage: (page: PublicPageRoute) => void;
  onBackToStudio: () => void;
  phoneNumber: string;
  locationName: string;
}

export const PublicSitePages: React.FC<PublicSitePagesProps> = ({
  activePage,
  onSelectPage,
  onBackToStudio,
  phoneNumber = "587-742-2500",
  locationName = "Edmonton & Area",
}) => {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Booking Form State (/booking)
  const [serviceType, setServiceType] = useState<
    "Move-Out / End of Tenancy" | "Deep Cleaning" | "Standard Home Clean"
  >("Move-Out / End of Tenancy");
  const [bedrooms, setBedrooms] = useState(3);
  const [bathrooms, setBathrooms] = useState(2);
  const [extras, setExtras] = useState<string[]>([
    "Inside Oven & Fridge",
    "Baseboards & Door Frames",
  ]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [serviceAddress, setServiceAddress] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [bookingSubmitted, setBookingSubmitted] = useState(false);

  // Support Form State (/support)
  const [supportName, setSupportName] = useState("");
  const [supportContact, setSupportContact] = useState("");
  const [supportTopic, setSupportTopic] = useState(
    "Move-Out Inspection Guarantee"
  );
  const [supportMessage, setSupportMessage] = useState("");
  const [supportSubmitted, setSupportSubmitted] = useState(false);

  const routeMap: {
    id: PublicPageRoute;
    path: string;
    label: string;
    fullUrl: string;
  }[] = [
    {
      id: "booking",
      path: "/booking",
      label: "Online Booking (/booking)",
      fullUrl: "https://ads.tidyupscleaning.com/booking",
    },
    {
      id: "support",
      path: "/support",
      label: "Customer Support (/support)",
      fullUrl: "https://ads.tidyupscleaning.com/support",
    },
    {
      id: "privacy",
      path: "/privacy",
      label: "Privacy Policy (/privacy)",
      fullUrl: "https://ads.tidyupscleaning.com/privacy",
    },
    {
      id: "tc",
      path: "/T&C",
      label: "Terms & Conditions (/T&C)",
      fullUrl: "https://ads.tidyupscleaning.com/T&C",
    },
  ];

  const currentRouteObj =
    routeMap.find((r) => r.id === activePage) || routeMap[0];

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch {
      // ignore
    }
  };

  // Estimate quote calculation for /booking
  const basePrice =
    serviceType === "Move-Out / End of Tenancy"
      ? 219
      : serviceType === "Deep Cleaning"
      ? 189
      : 139;
  const estimatedTotal =
    basePrice +
    Math.max(0, bedrooms - 1) * 30 +
    Math.max(0, bathrooms - 1) * 25 +
    extras.length * 25;

  const toggleExtra = (item: string) => {
    setExtras((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Fire Google Ads Conversion Event (AW-18539302675)
    if (
      typeof window !== "undefined" &&
      typeof (window as any).gtag === "function"
    ) {
      (window as any).gtag("event", "conversion", {
        send_to: "AW-18539302675",
        value: estimatedTotal,
        currency: "CAD",
      });
    }
    setBookingSubmitted(true);
  };

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSupportSubmitted(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Route Switcher Bar for ads.tidyupscleaning.com */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToStudio}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Ads Studio
            </button>
            <div>
              <div className="text-[11px] font-semibold text-teal-700 uppercase tracking-wider">
                Live Public Endpoint · ads.tidyupscleaning.com
              </div>
              <div className="text-xs font-mono text-slate-800 flex items-center gap-2 mt-0.5">
                <span>{currentRouteObj.fullUrl}</span>
                <button
                  type="button"
                  onClick={() => handleCopyUrl(currentRouteObj.fullUrl)}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[11px] font-sans font-medium text-slate-700 inline-flex items-center gap-1"
                >
                  {copiedUrl === currentRouteObj.fullUrl ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      Copied URL
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy Link
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {routeMap.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => onSelectPage(r.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activePage === r.id
                    ? "bg-teal-700 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {r.path}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* PAGE 1: /booking — Instant Quote & Customer Booking Page */}
      {activePage === "booking" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                  <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                  TidyUps Cleaning · {locationName}
                </span>
                <h1 className="text-xl font-bold text-slate-900 mt-1.5">
                  Book Your Move-Out or Deep Cleaning Online
                </h1>
                <p className="text-xs text-slate-600 mt-0.5">
                  Get an instant flat-rate estimate and reserve your cleaning
                  date, or call us directly at{" "}
                  <a
                    href={`tel:${phoneNumber.replace(/[^0-9+]/g, "")}`}
                    className="font-semibold text-teal-700 underline"
                  >
                    {phoneNumber}
                  </a>
                  .
                </p>
              </div>

              <a
                href="https://app.tidyupscleaning.com/booking"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 shrink-0"
              >
                <span>Open Full Booking Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {bookingSubmitted ? (
              <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h2 className="text-base font-bold text-emerald-950">
                  Your TidyUps Cleaning Quote & Booking Request is Confirmed!
                </h2>
                <p className="text-xs text-emerald-900 max-w-md mx-auto leading-relaxed">
                  Thank you, <strong>{customerName || "Valued Customer"}</strong>!
                  We have received your request for{" "}
                  <strong>{serviceType}</strong> ({bedrooms} Bed · {bathrooms}{" "}
                  Bath — Est. <strong>${estimatedTotal} CAD</strong>). Our team
                  will confirm shortly, or you can reach us immediately at{" "}
                  <strong>{phoneNumber}</strong>.
                </p>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setBookingSubmitted(false)}
                    className="px-4 py-2 rounded-lg bg-white border border-emerald-300 text-emerald-900 text-xs font-semibold hover:bg-emerald-100"
                  >
                    Modify Booking Details
                  </button>
                  <a
                    href="https://app.tidyupscleaning.com/booking"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 inline-flex items-center gap-1.5"
                  >
                    <span>Continue to app.tidyupscleaning.com/booking</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-5">
                {/* Step 1: Service Type */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-800">
                    1. Select Cleaning Package
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {(
                      [
                        {
                          id: "Move-Out / End of Tenancy",
                          sub: "Landlord & inspection ready",
                        },
                        {
                          id: "Deep Cleaning",
                          sub: "Baseboards, grime & buildup",
                        },
                        {
                          id: "Standard Home Clean",
                          sub: "Recurring or fresh upkeep",
                        },
                      ] as const
                    ).map((pkg) => (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => setServiceType(pkg.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          serviceType === pkg.id
                            ? "border-teal-700 bg-teal-50/70 ring-1 ring-teal-700"
                            : "border-slate-200 bg-slate-50/60 hover:bg-slate-100"
                        }`}
                      >
                        <div className="text-xs font-bold text-slate-900">
                          {pkg.id}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {pkg.sub}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 2: Bedrooms & Bathrooms */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                      2. Bedrooms ({bedrooms})
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setBedrooms(n)}
                          className={`flex-1 py-2 rounded-lg text-xs font-mono font-semibold border ${
                            bedrooms === n
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {n} {n === 5 ? "+" : ""} Bed
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                      3. Bathrooms ({bathrooms})
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setBathrooms(n)}
                          className={`flex-1 py-2 rounded-lg text-xs font-mono font-semibold border ${
                            bathrooms === n
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {n} {n === 4 ? "+" : ""} Bath
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Step 3: Detail Add-Ons */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-800">
                    4. Detail Extras Included
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Inside Oven & Fridge",
                      "Baseboards & Door Frames",
                      "Inside Kitchen Cabinets",
                      "Interior Windows & Tracks",
                      "Wall Spot Washing",
                    ].map((item) => {
                      const active = extras.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleExtra(item)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            active
                              ? "bg-teal-700 text-white border-teal-700"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {active ? "✓ " : "+ "}
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Step 4: Contact & Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Your name"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="e.g. 587-555-0199"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Preferred Cleaning Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Property Address ({locationName})
                    </label>
                    <input
                      type="text"
                      value={serviceAddress}
                      onChange={(e) => setServiceAddress(e.target.value)}
                      placeholder="Street address, apartment/unit #, city"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <Calendar className="w-4 h-4" />
                  Request Quote & Reserve Cleaning (${estimatedTotal} CAD Est.)
                </button>
              </form>
            )}
          </div>

          {/* Right Summary Column */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Instant TidyUps Quote Summary
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Selected Package:</span>
                <span className="font-semibold text-slate-900">
                  {serviceType}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Home Size:</span>
                <span className="font-mono font-semibold text-slate-900">
                  {bedrooms} Bed · {bathrooms} Bath
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Detail Add-Ons:</span>
                <span className="font-mono font-semibold text-slate-900">
                  {extras.length} selected
                </span>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
                <span className="font-bold text-slate-900">
                  Estimated Flat Rate:
                </span>
                <span className="text-xl font-bold font-mono text-teal-700">
                  ${estimatedTotal} CAD
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-700">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-700" />
                <span>100% Move-Out & Deep Clean Guarantee</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                All supplies and commercial-grade equipment included. If
                anything is missed on your landlord checklist, let us know
                within 24 hours and we will re-clean it free of charge.
              </p>
              <div className="pt-1 font-mono text-xs font-bold text-teal-800 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                <span>Call {phoneNumber}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PAGE 2: /support — Customer Support & Help Center */}
      {activePage === "support" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="border-b border-slate-100 pb-4">
              <div className="text-xs font-semibold text-teal-700 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>ads.tidyupscleaning.com/support</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 mt-1">
                TidyUps Cleaning Customer Support & Help Center
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                Need help with an existing booking, move-out inspection
                checklist, or billing question? Reach our local {locationName}{" "}
                team below.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-teal-700" />
                  <span>Direct Dispatch Phone</span>
                </div>
                <a
                  href={`tel:${phoneNumber.replace(/[^0-9+]/g, "")}`}
                  className="block text-sm font-bold font-mono text-slate-900 hover:text-teal-700"
                >
                  {phoneNumber}
                </a>
                <div className="text-[11px] text-slate-500">
                  7 Days a Week · 8am – 8pm
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-teal-700" />
                  <span>Support Email</span>
                </div>
                <a
                  href="mailto:cleaningserviceyeg@gmail.com"
                  className="block text-xs font-bold font-mono text-slate-900 hover:text-teal-700 truncate"
                >
                  cleaningserviceyeg@gmail.com
                </a>
                <div className="text-[11px] text-slate-500">
                  Fast response under 2 hours
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-teal-700" />
                  <span>Service Area</span>
                </div>
                <div className="text-xs font-bold text-slate-900">
                  {locationName}
                </div>
                <div className="text-[11px] text-slate-500">
                  Residential & Move-Out Pros
                </div>
              </div>
            </div>

            {supportSubmitted ? (
              <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-2">
                <div className="font-bold text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Support Ticket Received!</span>
                </div>
                <p>
                  We have logged your message regarding{" "}
                  <strong>{supportTopic}</strong>. For urgent same-day booking
                  updates, please call us directly at{" "}
                  <strong>{phoneNumber}</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => setSupportSubmitted(false)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-emerald-300 font-semibold text-emerald-900"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSupportSubmit} className="space-y-3.5 pt-2">
                <h2 className="text-sm font-bold text-slate-900">
                  Send a Support Message
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={supportName}
                      onChange={(e) => setSupportName(e.target.value)}
                      placeholder="Full name"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Phone or Email *
                    </label>
                    <input
                      type="text"
                      required
                      value={supportContact}
                      onChange={(e) => setSupportContact(e.target.value)}
                      placeholder="587-555-0199 or email"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Support Topic
                  </label>
                  <select
                    value={supportTopic}
                    onChange={(e) => setSupportTopic(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="Move-Out Inspection Guarantee">
                      Move-Out Inspection Guarantee
                    </option>
                    <option value="Reschedule or Update Booking">
                      Reschedule or Update Existing Booking
                    </option>
                    <option value="Custom Deep Cleaning Quote">
                      Custom Deep Cleaning Quote
                    </option>
                    <option value="Billing & Receipt Request">
                      Billing & Receipt Request
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    How can we help? *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    placeholder="Include your property address or booking date if applicable..."
                    className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold"
                >
                  Submit Support Request
                </button>
              </form>
            )}
          </div>

          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Frequently Asked Questions
            </h3>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="font-semibold text-slate-900">
                  What is included in Move-Out / End of Tenancy Cleaning?
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Full kitchen and bathroom sanitization, inside cabinets and
                  drawers, baseboards, floors, fixtures, and optional inside
                  oven and fridge detailing to pass your landlord or property
                  manager inspection.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="font-semibold text-slate-900">
                  Do I need to provide cleaning supplies or vacuum equipment?
                </div>
                <p className="text-slate-600 leading-relaxed">
                  No—our TidyUps Cleaning crews bring all professional supplies,
                  microfiber cloths, disinfectants, and commercial vacuums.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="font-semibold text-slate-900">
                  How do I reschedule or cancel a booking?
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Please call{" "}
                  <strong className="font-mono">{phoneNumber}</strong> or email{" "}
                  <strong className="font-mono">
                    cleaningserviceyeg@gmail.com
                  </strong>{" "}
                  at least 24 hours prior to your appointment for free
                  rescheduling.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PAGE 3: /privacy — Privacy Policy */}
      {activePage === "privacy" && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 max-w-4xl mx-auto space-y-5 text-xs text-slate-700 leading-relaxed">
          <div className="border-b border-slate-200 pb-4">
            <div className="text-xs font-semibold text-teal-700 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>https://ads.tidyupscleaning.com/privacy</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              Privacy Policy — TidyUps Cleaning
            </h1>
            <p className="text-slate-500 mt-0.5">
              Effective Date: October 27, 2026 · Domain:{" "}
              <code className="font-mono">ads.tidyupscleaning.com</code> &{" "}
              <code className="font-mono">app.tidyupscleaning.com</code>
            </p>
          </div>

          <section className="space-y-1.5">
            <h2 className="text-sm font-bold text-slate-900">
              1. Information We Collect
            </h2>
            <p>
              When you request a cleaning quote, book a service, or use the
              TidyUps Cleaning platform, we collect information you provide
              directly, including your name, phone number, email address,
              service property address, home size, and cleaning preferences.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-sm font-bold text-slate-900">
              2. How We Use Your Information
            </h2>
            <p>
              We use the collected information solely to provide residential
              move-out, move-in, and deep cleaning quotes, schedule and dispatch
              cleaning crews in {locationName}, send booking confirmations and
              receipts, and provide customer support via{" "}
              <strong>{phoneNumber}</strong> or{" "}
              <strong>cleaningserviceyeg@gmail.com</strong>.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-sm font-bold text-slate-900">
              3. Google Ads Conversion Tracking & Google AdSense Cookies
            </h2>
            <p>
              Our website uses Google Tag (<code className="font-mono">AW-18539302675</code>)
              for conversion measurement and Google AdSense (
              <code className="font-mono">ca-pub-8415242080067854</code>).
              Third-party vendors, including Google, use cookies to serve and
              measure ads based on a user&apos;s prior visits to our website or
              other websites. Users may opt out of personalized advertising by
              visiting{" "}
              <a
                href="https://www.google.com/settings/ads"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-700 underline"
              >
                Google Ads Settings
              </a>
              .
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-sm font-bold text-slate-900">
              4. Google Workspace & Google Ads API Data Usage
            </h2>
            <p>
              When authorized administrators sign in with Google on{" "}
              <code className="font-mono">ads.tidyupscleaning.com</code>, our
              application accesses Google Ads, Google Drive, and Google Sheets
              strictly with explicit user permission to create campaign assets,
              upload project archive backups to the designated folder (such as{" "}
              <code className="font-mono">Leads-Creator</code>), and format
              campaign spreadsheets. Access tokens are held strictly in memory
              for the active session and are never sold or shared with third
              parties.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-sm font-bold text-slate-900">
              5. Contact Us Regarding Privacy
            </h2>
            <p>
              If you have any questions or requests regarding your personal data
              or this Privacy Policy, please contact TidyUps Cleaning at{" "}
              <strong>{phoneNumber}</strong> or email{" "}
              <strong>cleaningserviceyeg@gmail.com</strong>.
            </p>
          </section>
        </div>
      )}

      {/* PAGE 4: /T&C — Terms & Conditions */}
      {activePage === "tc" && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 max-w-4xl mx-auto space-y-5 text-xs text-slate-700 leading-relaxed">
          <div className="border-b border-slate-200 pb-4">
            <div className="text-xs font-semibold text-teal-700 flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              <span>https://ads.tidyupscleaning.com/T&amp;C</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              Terms &amp; Conditions — TidyUps Cleaning
            </h1>
            <p className="text-slate-500 mt-0.5">
              Last Updated: October 27, 2026 · Applies to{" "}
              <code className="font-mono">ads.tidyupscleaning.com</code> &{" "}
              <code className="font-mono">app.tidyupscleaning.com</code>
            </p>
          </div>

          <section className="space-y-1.5">
            <h2 className="text-sm font-bold text-slate-900">
              1. Scope of Cleaning Services
            </h2>
            <p>
              TidyUps Cleaning provides residential move-out, move-in, end-of-tenancy,
              deep cleaning, and standard home cleaning services across{" "}
              {locationName}. Quotes generated online are based on the bedroom,
              bathroom, and condition details submitted at the time of booking.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-sm font-bold text-slate-900">
              2. Property Access, Utilities & Preparation
            </h2>
            <p>
              For move-out and deep cleaning appointments, the client agrees to
              provide safe access to the property along with running hot water
              and electricity so our crew can operate cleaning equipment and
              complete thorough kitchen, bathroom, baseboard, and floor
              detailing.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-sm font-bold text-slate-900">
              3. Rescheduling & Cancellation Policy
            </h2>
            <p>
              Appointments may be rescheduled or cancelled free of charge with
              at least 24 hours&apos; notice by calling{" "}
              <strong>{phoneNumber}</strong> or emailing{" "}
              <strong>cleaningserviceyeg@gmail.com</strong>. Same-day
              cancellations or lockouts upon crew arrival may incur a dispatch
              fee.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-sm font-bold text-slate-900">
              4. 24-Hour Satisfaction Guarantee
            </h2>
            <p>
              We stand behind our work. If any area covered in your booking
              checklist is overlooked, please notify TidyUps Cleaning within 24
              hours of service completion and our team will return to touch up
              the area at no additional cost.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-sm font-bold text-slate-900">
              5. Contact Information
            </h2>
            <p>
              TidyUps Cleaning · Phone: <strong>{phoneNumber}</strong> · Email:{" "}
              <strong>cleaningserviceyeg@gmail.com</strong> · Booking:{" "}
              <a
                href="https://ads.tidyupscleaning.com/booking"
                className="text-teal-700 underline"
              >
                https://ads.tidyupscleaning.com/booking
              </a>
            </p>
          </section>
        </div>
      )}
    </div>
  );
};
