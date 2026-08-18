"use client";

import { useState, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import DottedMap from "dotted-map";
import { useTheme } from "next-themes";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

function DottedWorldMapWithPin() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Create a clean dotted map matching MT Pocket's exact palette
  const map = new DottedMap({ height: 52, grid: "diagonal" });
  const svgMap = map.getSVG({
    radius: 0.24,
    color: isDark ? "rgba(161, 188, 152, 0.35)" : "rgba(15, 122, 83, 0.25)",
    shape: "circle",
    backgroundColor: "transparent",
  });

  // Pin coordinates (central global hub / India coordinate)
  const pinLat = 22.5937;
  const pinLng = 78.9629;
  const pinX = ((pinLng + 180) / 360) * 100;
  const pinY = ((90 - pinLat) / 180) * 100;

  return (
    <div className="relative w-full overflow-hidden rounded-2xl pt-2 pb-4 select-none">
      {/* Background radial glow behind map matching brand forest/sage */}
      <div className="pointer-events-none absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-44 bg-primary/10 blur-[60px] rounded-full" />

      {/* Dotted Map SVG */}
      <div className="relative w-full aspect-[2.1/1] opacity-80">
        <img
          src={`data:image/svg+xml;utf8,${encodeURIComponent(svgMap)}`}
          alt="World Map"
          className="w-full h-full object-contain [mask-image:linear-gradient(to_bottom,transparent,white_15%,white_85%,transparent)]"
          draggable={false}
        />

        {/* Glowing Pinpoint & Beam */}
        <div
          className="absolute z-20 -translate-x-1/2 -translate-y-full pointer-events-none flex flex-col items-center"
          style={{ left: `${pinX}%`, top: `${pinY}%` }}
        >
          {/* Tooltip Badge: "We are here" */}
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-primary-foreground border border-accent/40 text-[11px] font-bold shadow-[0_0_20px_rgba(15,122,83,0.4)] backdrop-blur-md whitespace-nowrap"
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary-foreground animate-pulse" />
            <span>We are here</span>
          </motion.div>

          {/* Tooltip Pointer Triangle */}
          <div className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-primary -mt-[1px]" />

          {/* Vertical Glowing Light Beam */}
          <div className="relative h-14 w-[2px] flex items-center justify-center my-0.5">
            <div className="absolute inset-0 bg-gradient-to-b from-primary via-accent to-transparent" />
            <div className="absolute w-4 h-full bg-gradient-to-b from-primary/50 via-accent/30 to-transparent blur-sm" />
          </div>

          {/* Pinpoint Dot & Concentric Radar Waves */}
          <div className="relative flex items-center justify-center -mt-1">
            {/* Core glowing dot */}
            <div className="w-2.5 h-2.5 rounded-full bg-primary ring-2 ring-primary-foreground shadow-[0_0_12px_var(--primary)] z-10" />

            {/* Radar Wave 1 */}
            <span className="absolute w-6 h-6 rounded-full border border-primary/80 animate-ping" />

            {/* Radar Wave 2 */}
            <span className="absolute w-10 h-10 rounded-full border border-accent/60 animate-pulse" />

            {/* Ground Glow */}
            <div className="absolute w-14 h-4 bg-primary/30 blur-md rounded-full -bottom-1" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ContactSection() {
  const { user, accessToken } = useAuth() || {};

  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    company: "",
    message: "",
  });

  const [status, setStatus] = useState({
    submitting: false,
    success: false,
    error: null,
    ticketId: null,
  });

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (status.error) setStatus((prev) => ({ ...prev, error: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email.trim() || !formData.message.trim()) {
      setStatus({
        submitting: false,
        success: false,
        error: "Please provide your email and message.",
        ticketId: null,
      });
      return;
    }

    setStatus({ submitting: true, success: false, error: null, ticketId: null });

    try {
      const payload = {
        userId: user?.id || user?.sub,
        senderEmail: formData.email.trim(),
        senderName: formData.fullName.trim() || undefined,
        category: "Contact Form",
        subject: formData.company?.trim()
          ? `Inquiry from ${formData.company.trim()} (${formData.fullName || "Member"})`
          : `Message from ${formData.fullName.trim() || formData.email.trim()}`,
        message: formData.company?.trim()
          ? `Company: ${formData.company.trim()}\n\n${formData.message.trim()}`
          : formData.message.trim(),
      };

      const res = await api.createSupportTicket(payload, accessToken);

      setStatus({
        submitting: false,
        success: true,
        error: null,
        ticketId: res?.ticketId || "Received",
      });

      // Clear form
      setFormData({
        fullName: user?.fullName || "",
        email: user?.email || "",
        company: "",
        message: "",
      });
    } catch (err) {
      console.error("Failed to send message:", err);
      setStatus({
        submitting: false,
        success: false,
        error: err.message || "Failed to send message. Please try again.",
        ticketId: null,
      });
    }
  };

  return (
    <section className="relative px-4 py-20 md:py-28 overflow-hidden bg-background">
      {/* Ambient background lighting */}
      <div className="pointer-events-none absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-primary/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 right-1/4 h-96 w-96 rounded-full bg-accent/10 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        viewport={{ once: true }}
        className="relative mx-auto max-w-7xl rounded-[32px] md:rounded-[40px] border border-border bg-card p-6 sm:p-10 lg:p-14 shadow-2xl backdrop-blur-2xl"
      >
        {/* Subtle decorative inner border highlight */}
        <div className="pointer-events-none absolute inset-0 rounded-[32px] md:rounded-[40px] border border-primary/10" />

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-14 items-center">
          {/* ── LEFT COLUMN: Text Info & Dotted World Map with Pin ── */}
          <div className="flex flex-col justify-between h-full lg:col-span-6 xl:col-span-7">
            <div>
              {/* Mail Icon Badge */}
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-lg shadow-primary/10 backdrop-blur-md">
                <Mail className="h-5 w-5" />
              </div>

              {/* Title */}
              <h2 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Contact us
              </h2>

              {/* Subheading */}
              <p className="mt-4 max-w-xl text-base sm:text-lg leading-relaxed text-muted-foreground">
                We are always looking for ways to improve our products and services.
                Contact us and let us know how we can help you.
              </p>

              {/* Contact direct metadata */}
              <div className="mt-6 flex flex-wrap items-center gap-y-2 gap-x-3 text-xs sm:text-sm font-mono text-muted-foreground">
                <a
                  href="mailto:contact@mtpocket.com"
                  className="hover:text-primary font-semibold transition-colors"
                >
                  contact@mtpocket.com
                </a>
                <span className="text-muted-foreground/40">•</span>
                <span className="text-foreground font-semibold">+1 (800) 123 XX21</span>
                <span className="text-muted-foreground/40">•</span>
                <a
                  href="mailto:support@mtpocket.com"
                  className="hover:text-primary font-semibold transition-colors"
                >
                  support@mtpocket.com
                </a>
              </div>
            </div>

            {/* Dotted World Map Positioned in Left Bottom */}
            <div className="mt-8 pt-4">
              <DottedWorldMapWithPin />
            </div>
          </div>

          {/* ── RIGHT COLUMN: Contact Us Card Form ── */}
          <div className="lg:col-span-6 xl:col-span-5">
            <div className="relative overflow-hidden rounded-[28px] border border-border bg-card p-6 sm:p-8 md:p-10 shadow-2xl">
              {/* Subtle Dot Grid Pattern */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.05]"
                style={{
                  backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
                  backgroundSize: "20px 20px",
                }}
              />

              <form onSubmit={handleSubmit} className="relative z-10 space-y-5">
                {/* Full name */}
                <div>
                  <label
                    htmlFor="fullName"
                    className="mb-2 block text-xs font-bold uppercase tracking-wider text-foreground"
                  >
                    Full name
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground shadow-2xs transition-all duration-200 focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-xs font-bold uppercase tracking-wider text-foreground"
                  >
                    Email Address <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="support@mtpocket.com"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground shadow-2xs transition-all duration-200 focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Company */}
                <div>
                  <label
                    htmlFor="company"
                    className="mb-2 block text-xs font-bold uppercase tracking-wider text-foreground"
                  >
                    Company / Organization
                  </label>
                  <input
                    id="company"
                    name="company"
                    type="text"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="MT Pocket Labs LLC"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground shadow-2xs transition-all duration-200 focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Message */}
                <div>
                  <label
                    htmlFor="message"
                    className="mb-2 block text-xs font-bold uppercase tracking-wider text-foreground"
                  >
                    Message <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    required
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Type your message here..."
                    className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground shadow-2xs transition-all duration-200 focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Status messages */}
                <AnimatePresence>
                  {status.error && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-xs font-medium text-destructive"
                    >
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{status.error}</span>
                    </motion.div>
                  )}

                  {status.success && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col gap-1 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-xs text-success"
                    >
                      <div className="flex items-center gap-2 font-bold text-success">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>Message sent successfully!</span>
                      </div>
                      <p className="text-muted-foreground pl-6 text-[11px]">
                        Ticket reference: <strong className="font-mono text-primary font-bold">{status.ticketId}</strong>. A confirmation email has been dispatched to your inbox.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={status.submitting}
                    className="group relative flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground shadow-md shadow-primary/20 transition-all duration-200 hover:bg-primary/95 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {status.submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Sending message...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}