import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { BASE_PATH } from "@/lib/constants";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, Clock, Phone, Heart, ArrowRight, ShieldAlert, HeartHandshake,
  Award, CheckCircle2, BookOpen, Sparkles, Info, Users, Share2, Download
} from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  const isSignedIn = !!user;
  const [activeSection, setActiveSection] = useState<"guidelines" | "pledge">("guidelines");

  return (
    <div className="min-h-screen w-full bg-white font-sans select-none overflow-x-hidden">

      {/* ── Top Nav ──────────────────────────────────────────────────────── */}
      <header className="h-16 border-b border-gray-100 flex items-center justify-between px-4 md:px-10 bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <img src={`${BASE_PATH}/logo.png`} alt="Sankara Eye Foundation" className="h-10 md:h-11 w-auto object-contain" />
        <div className="flex items-center gap-2">
          {isSignedIn ? (
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="text-orange-600 border-orange-200 hover:bg-orange-50 rounded-xl text-xs font-semibold">
                Dashboard
              </Button>
            </Link>
          ) : (
            <Link href="/sign-in">
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900 rounded-xl text-xs font-medium">
                Coordinator Login
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* ── HERO SECTION ─────────────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-[#fff8f2] via-white to-[#fff3e6] min-h-[80vh] flex flex-col justify-center">

        {/* Decorative blobs */}
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-orange-100 rounded-full blur-[160px] opacity-50 pointer-events-none -z-0" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-yellow-100 rounded-full blur-[120px] opacity-40 pointer-events-none -z-0" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-10 pt-16 pb-20 flex flex-col items-center text-center">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center gap-8 w-full"
          >
            {/* Urgent Badge */}
            <div className="inline-flex items-center gap-2 bg-red-600 text-white px-5 py-2 rounded-full text-xs sm:text-sm font-extrabold uppercase tracking-widest shadow-lg animate-pulse">
              <ShieldAlert className="h-4 w-4" />
              Time Critical — Act Within 6 Hours of Death
            </div>

            <div className="space-y-6 max-w-3xl">
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-gray-900 leading-[1.08] tracking-tight">
                Give the
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff7a18] via-[#ff9f43] to-[#ffb347]">
                  Miracle of Sight
                </span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
                Every eye donation restores sight to <span className="font-bold text-gray-900">two blind individuals</span>. 
                Time is of the essence. Eye retrieval must happen within <span className="font-bold text-red-600">6 hours of death</span>.
              </p>
            </div>

            {/* Helpline */}
            <div className="flex justify-center my-2">
              <a href="tel:1919" className="flex items-center gap-4 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-2xl p-4 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer group">
                <div className="h-11 w-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0 group-hover:rotate-12 transition-transform">
                  <Phone className="h-6 w-6 animate-pulse" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/80">Emergency Eye Bank Helpline • 24/7</p>
                  <p className="text-xl font-extrabold tracking-tight">Call Toll-Free: 1919</p>
                </div>
              </a>
            </div>

            {/* Huge CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full max-w-2xl mt-4">
              <Link href="/donate?intent=emergency" className="w-full sm:w-1/2">
                <button className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 to-red-500 p-[2px] shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                  <div className="relative flex flex-col items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-500 rounded-[14px] px-6 py-6 text-white h-full">
                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300 rounded-[14px]" />
                    <HeartHandshake className="h-8 w-8 z-10 animate-bounce" />
                    <div className="text-center z-10">
                      <p className="text-lg md:text-xl font-extrabold leading-tight">Emergency Donation</p>
                      <p className="text-xs font-bold text-white/80 mt-1 uppercase tracking-widest">Someone has passed away</p>
                    </div>
                  </div>
                </button>
              </Link>

              <Link href="/donate?intent=pledge" className="w-full sm:w-1/2">
                <button className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-[#ff7a18] to-[#ff9f43] p-[2px] shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                  <div className="relative flex flex-col items-center justify-center gap-2 bg-gradient-to-r from-[#ff7a18] to-[#ff9f43] rounded-[14px] px-6 py-6 text-white h-full">
                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300 rounded-[14px]" />
                    <Award className="h-8 w-8 z-10" />
                    <div className="text-center z-10">
                      <p className="text-lg md:text-xl font-extrabold leading-tight">Pledge Your Eyes</p>
                      <p className="text-xs font-bold text-white/80 mt-1 uppercase tracking-widest">Get your digital certificate</p>
                    </div>
                  </div>
                </button>
              </Link>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-3 gap-6 sm:gap-12 mt-12 w-full max-w-4xl border-t border-gray-200/60 pt-10">
              {[
                { label: "Sight Restored", value: "2 Lives", icon: <Eye className="h-6 w-6 text-orange-500" /> },
                { label: "Critical Window", value: "6 Hours", icon: <Clock className="h-6 w-6 text-red-500" /> },
                { label: "Pledgers", value: "1 Lakh+", icon: <Users className="h-6 w-6 text-orange-500" /> },
              ].map((s) => (
                <div key={s.label} className="flex flex-col items-center gap-2">
                  <div className="h-12 w-12 bg-white rounded-2xl shadow-sm border border-orange-50 flex items-center justify-center">
                    {s.icon}
                  </div>
                  <div className="text-center">
                    <span className="block text-xl md:text-2xl font-extrabold text-gray-900">{s.value}</span>
                    <span className="block text-[11px] md:text-xs text-gray-500 font-semibold uppercase tracking-wider">{s.label}</span>
                  </div>
                </div>
              ))}
            </div>

          </motion.div>
        </div>
      </section>

      {/* ── BELOW FOLD: Guidelines & Eye Pledge ──────────────────────────── */}
      <section className="w-full bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 md:px-10 py-16">

          {/* Section Toggle */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex bg-gray-100 rounded-2xl p-1.5 gap-1">
              {[
                { key: "guidelines", label: "Eye Donation Guidelines", icon: <BookOpen className="h-4 w-4" /> },
                { key: "pledge", label: "Pledge Your Eyes", icon: <Award className="h-4 w-4" /> },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveSection(tab.key as any)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                    activeSection === tab.key
                      ? "bg-gradient-to-r from-[#ff7a18] to-[#ff9f43] text-white shadow-md"
                      : "text-gray-600 hover:text-gray-900 hover:bg-white"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">

            {/* ── GUIDELINES TAB ── */}
            {activeSection === "guidelines" && (
              <motion.div
                key="guidelines"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-10">
                  <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
                    Essential <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff7a18] to-[#ff9f43]">Guidelines</span>
                  </h2>
                  <p className="text-sm text-gray-500 mt-2 max-w-xl mx-auto">
                    Important clinical instructions that every family must know when considering eye donation.
                  </p>
                </div>

                {/* Critical Alert */}
                <div className="bg-red-600 text-white rounded-3xl p-6 mb-8 flex items-start gap-4 shadow-xl">
                  <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                    <Clock className="h-7 w-7 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold">CRITICAL: Eye Retrieval Must Happen Within 6 Hours of Death</h3>
                    <p className="text-white/85 text-sm mt-1 leading-relaxed">
                      The corneas begin to deteriorate rapidly after death. Immediate notification to our eye bank is absolutely essential to ensure the restoration of sight.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[
                    {
                      icon: <ShieldAlert size={22} className="text-orange-600" />,
                      bg: "bg-orange-50",
                      border: "border-orange-100",
                      color: "from-orange-500 to-orange-400",
                      title: "Switch Off Fans Immediately",
                      desc: "Turn off all ceiling fans in the room the moment death occurs. This prevents the corneas from drying out. Switch on AC if available to maintain a cool environment."
                    },
                    {
                      icon: <CheckCircle2 size={22} className="text-green-600" />,
                      bg: "bg-green-50",
                      border: "border-green-100",
                      color: "from-green-500 to-emerald-400",
                      title: "Close Eyes & Wet Cotton",
                      desc: "Gently close the deceased's eyes and place clean, wet cotton pads or a damp cloth over the closed eyelids. This keeps the corneas moist and viable."
                    },
                    {
                      icon: <Info size={22} className="text-blue-600" />,
                      bg: "bg-blue-50",
                      border: "border-blue-100",
                      color: "from-blue-500 to-blue-400",
                      title: "Age, Sex & Religion — No Bar",
                      desc: "Anyone can donate eyes regardless of age, sex, blood group, or religion. Even those who wear spectacles or have had cataract surgery are eligible donors."
                    },
                    {
                      icon: <Sparkles size={22} className="text-amber-600" />,
                      bg: "bg-amber-50",
                      border: "border-amber-100",
                      color: "from-amber-500 to-yellow-400",
                      title: "Zero Disfigurement",
                      desc: "The surgical retrieval takes only 20 minutes, is performed in any clean room (home or hospital), is completely free of charge, and leaves absolutely no facial disfigurement."
                    },
                    {
                      icon: <Heart size={22} className="text-red-600" />,
                      bg: "bg-red-50",
                      border: "border-red-100",
                      color: "from-red-500 to-red-400",
                      title: "Ethical & Free",
                      desc: "Donated eyes are never sold. They are used purely to restore vision for blind individuals free of charge, in strict accordance with the Transplantation of Human Organs Act."
                    },
                    {
                      icon: <Eye size={22} className="text-purple-600" />,
                      bg: "bg-purple-50",
                      border: "border-purple-100",
                      color: "from-purple-500 to-purple-400",
                      title: "Illuminate Two Lives",
                      desc: "One donation = sight restored to TWO blind individuals. Corneal blindness is curable through transplantation. Your decision can transform two lives plunged in darkness."
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className={`relative bg-white ${item.border} border rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden`}
                    >
                      <div className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${item.color} group-hover:w-2 transition-all`} />
                      <div className={`${item.bg} h-11 w-11 rounded-2xl flex items-center justify-center mb-4`}>{item.icon}</div>
                      <h4 className="font-extrabold text-gray-900 text-[15px] mb-2">{item.title}</h4>
                      <p className="text-xs text-gray-600 leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── PLEDGE TAB ── */}
            {activeSection === "pledge" && (
              <motion.div
                key="pledge"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
              >
                <div className="max-w-4xl mx-auto">
                  {/* Hero pledge card */}
                  <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#ff7a18] via-[#ff9f43] to-[#ffb347] p-1 shadow-2xl">
                    <div className="rounded-[22px] bg-white p-8 md:p-12">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        {/* Left: copy */}
                        <div className="space-y-5">
                          <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-100 px-4 py-1.5 rounded-full text-xs font-extrabold text-orange-600 uppercase tracking-widest">
                            <Award className="h-3.5 w-3.5" /> Sight Ambassador
                          </div>
                          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
                            Pledge Your Eyes.<br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff7a18] to-[#ff9f43]">Change Two Lives.</span>
                          </h2>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            A simple pledge today secures sight for two blind individuals tomorrow. Register your commitment, get a beautiful digital certificate, and inspire your family.
                          </p>
                          <div className="space-y-3">
                            {[
                              { icon: <Users className="h-4 w-4 text-orange-500" />, text: "Join 1 Lakh+ Sight Ambassadors across India" },
                              { icon: <Download className="h-4 w-4 text-orange-500" />, text: "Receive a printable Certificate of Appreciation" },
                              { icon: <Share2 className="h-4 w-4 text-orange-500" />, text: "Share on WhatsApp and inspire your loved ones" },
                              { icon: <Heart className="h-4 w-4 text-orange-500" />, text: "One donation = Two lives restored permanently" },
                            ].map((item, i) => (
                              <div key={i} className="flex items-center gap-3">
                                <div className="h-7 w-7 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">{item.icon}</div>
                                <span className="text-sm text-gray-700 font-medium">{item.text}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        {/* Right: CTA */}
                        <div className="flex flex-col items-center gap-5">
                          <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-orange-400 to-amber-300 flex items-center justify-center shadow-xl">
                            <Award className="h-14 w-14 text-white drop-shadow" />
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-1">Official Eye Pledge</p>
                            <h3 className="text-xl font-extrabold text-gray-900">Register & Get Certificate</h3>
                            <p className="text-xs text-gray-400 mt-1">Takes less than 2 minutes • Completely free</p>
                          </div>
                          <Link href="/donate?intent=pledge" className="w-full">
                            <button className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-[#ff7a18] to-[#ff9f43] p-[2px] shadow-lg hover:shadow-xl transition-all duration-300">
                              <div className="relative flex items-center justify-center gap-3 bg-gradient-to-r from-[#ff7a18] to-[#ff9f43] rounded-[14px] px-6 py-4 text-white">
                                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300 rounded-[14px]" />
                                <HeartHandshake className="h-5 w-5 z-10" />
                                <span className="text-base font-extrabold z-10">Pledge Your Eyes Now</span>
                                <ArrowRight className="h-5 w-5 z-10 group-hover:translate-x-1 transition-transform duration-300" />
                              </div>
                            </button>
                          </Link>
                          <p className="text-[10px] text-gray-400 text-center">
                            By pledging, you authorize Sankara Eye Bank to record your commitment. You will receive a digital certificate instantly.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Info strip below */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    {[
                      { value: "1 Lakh+", label: "Pledgers" },
                      { value: "2 Lives", label: "Per Donation" },
                      { value: "Free", label: "Certificate" },
                      { value: "20 Min", label: "Retrieval Time" },
                    ].map((s, i) => (
                      <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm">
                        <div className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#ff7a18] to-[#ff9f43]">{s.value}</div>
                        <div className="text-xs text-gray-500 font-semibold mt-0.5">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 bg-white py-5 px-4 md:px-10 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold">
          <Heart className="h-3.5 w-3.5 text-[#ff7a18] fill-[#ff7a18] animate-pulse" />
          Sankara Eye Foundation — India
        </div>
        <p className="text-[10px] text-gray-400 font-medium">
          © {new Date().getFullYear()} Sri Kanchi Kamakoti Medical Trust. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
}
