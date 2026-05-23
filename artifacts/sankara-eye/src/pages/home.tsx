import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSubmitPublicEyeCall, useListPublicUnits } from "@workspace/api-client-react";
import { INDIA_STATES } from "@/lib/constants";
import {
  Eye, Clock, Phone, Heart, ArrowRight, ShieldAlert, HeartHandshake,
  Award, CheckCircle2, BookOpen, Sparkles, Info, Send, AlertCircle,
  Activity, MapPin, User, Building2, ChevronRight, Star, Users, Download, Share2
} from "lucide-react";

// ─── Validation ──────────────────────────────────────────────────────────────
const mobileRegex = /^\+91 [6-9]\d{9}$/;

const emergencySchema = z.object({
  referrerName: z.string().min(2, "Your name is required"),
  referrerMobile: z.string().regex(mobileRegex, "Enter a valid 10-digit number not starting with 0"),
  address: z.string().min(5, "Address of eye collection is required"),
  state: z.string().min(2, "State is required"),
  district: z.string().min(2, "District is required"),
  unitId: z.coerce.number().min(1, "Please select the nearest Sankara hospital unit"),
});

type EmergencyValues = z.infer<typeof emergencySchema>;

// ─── Success overlay ──────────────────────────────────────────────────────────
function SuccessView({ callId, whatsappUrl, onReset }: { callId: string; whatsappUrl: string; onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-6 py-4 text-center"
    >
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center shadow-inner">
        <CheckCircle2 className="w-10 h-10 text-green-600" />
      </div>
      <div>
        <h3 className="text-2xl font-extrabold text-gray-900">Emergency Request Logged!</h3>
        <p className="text-sm text-gray-500 mt-2 max-w-sm">
          Reference ID: <span className="font-mono font-bold text-gray-800">{callId}</span>. Our coordinator will call you back immediately.
        </p>
      </div>
      <div className="bg-red-50 border border-red-100 rounded-2xl p-4 w-full text-left space-y-2">
        <h4 className="text-xs font-extrabold text-red-800 uppercase tracking-wide flex items-center gap-1.5">
          <Activity size={14} className="animate-pulse" /> Urgent Instructions — Do This Now
        </h4>
        <ul className="text-[11px] text-red-950 space-y-1 leading-relaxed">
          <li>• Switch off all ceiling fans in the room immediately.</li>
          <li>• Gently close the deceased's eyes and place wet cotton over the eyelids.</li>
          <li>• Turn on AC if available to keep the room cool.</li>
          <li>• A medical coordinator is preparing to call you back instantly.</li>
        </ul>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <Button
          className="flex-1 h-12 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-2xl font-bold flex items-center justify-center gap-2"
          onClick={() => window.open(whatsappUrl, "_blank")}
        >
          <Phone size={18} /> Ping Coordinator on WhatsApp
        </Button>
        <Button
          variant="outline"
          className="flex-1 h-12 rounded-2xl border-gray-200 font-semibold"
          onClick={onReset}
        >
          Submit Another
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Home() {
  const { user } = useAuth();
  const isSignedIn = !!user;
  const [activeSection, setActiveSection] = useState<"guidelines" | "pledge">("guidelines");
  const [successData, setSuccessData] = useState<{ whatsappUrl: string; callId: string } | null>(null);

  const { data: units } = useListPublicUnits();
  const submitCall = useSubmitPublicEyeCall();

  const form = useForm<EmergencyValues>({
    resolver: zodResolver(emergencySchema),
    defaultValues: {
      referrerName: "",
      referrerMobile: "+91 ",
      address: "",
      state: "",
      district: "",
      unitId: 0,
    },
  });

  const selectedState = form.watch("state");
  const selectedDistrict = form.watch("district");

  const districts = useMemo(() => {
    const stateObj = INDIA_STATES.find(s => s.name === selectedState);
    return stateObj ? stateObj.districts : [];
  }, [selectedState]);

  // Smart filter: only show units whose state matches the selected state
  const filteredUnits = useMemo(() => {
    if (!units) return [];
    if (!selectedState) return units;
    const stateMatched = units.filter(u => u.state === selectedState);
    return stateMatched.length > 0 ? stateMatched : units;
  }, [units, selectedState]);

  const handleMobileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith("+91 ")) {
      form.setValue("referrerMobile", "+91 ", { shouldValidate: true });
      return;
    }
    const prefix = "+91 ";
    let suffix = val.substring(prefix.length).replace(/\D/g, "");
    if (suffix.startsWith("0")) suffix = suffix.substring(1);
    form.setValue("referrerMobile", prefix + suffix.substring(0, 10), { shouldValidate: true });
  };

  const onSubmit = (data: EmergencyValues) => {
    const selectedUnit = units?.find(u => u.id === data.unitId);
    const payload = {
      referrerName: data.referrerName,
      referrerMobile: data.referrerMobile,
      referrerRelationship: "Relative / Family",
      donorName: "Deceased Relative (Emergency Callback)",
      donorAge: 0,
      donorGender: "other" as const,
      timeOfDeath: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) + " (Today)",
      causeOfDeath: "Not Specified (Emergency Mode)",
      state: data.state,
      district: data.district,
      pincode: "000000",
      address: data.address,
      unitId: data.unitId,
    };

    submitCall.mutate({ data: payload }, {
      onSuccess: (response) => {
        setSuccessData({ whatsappUrl: response.whatsappUrl, callId: response.eyeCall.callId });
        window.open(response.whatsappUrl, "_blank");
      }
    });
  };

  return (
    <div className="min-h-screen w-full bg-white font-sans select-none overflow-x-hidden">

      {/* ── Top Nav ──────────────────────────────────────────────────────── */}
      <header className="h-16 border-b border-gray-100 flex items-center justify-between px-4 md:px-10 bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <img src="/logo.png" alt="Sankara Eye Foundation" className="h-10 md:h-11 w-auto object-contain" />
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
          <Link href="/donate">
            <Button size="sm" className="bg-gradient-to-r from-[#ff7a18] to-[#ff9f43] text-white border-0 rounded-xl font-semibold text-xs px-4 shadow-md hover:shadow-lg">
              Pledge Eyes
            </Button>
          </Link>
        </div>
      </header>

      {/* ── HERO SECTION ─────────────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-[#fff8f2] via-white to-[#fff3e6]">

        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-100 rounded-full blur-[160px] opacity-50 pointer-events-none -z-0" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-yellow-100 rounded-full blur-[120px] opacity-40 pointer-events-none -z-0" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-10 pt-12 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

          {/* ── LEFT: Hero Copy ─────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-6"
          >
            {/* Urgent Badge */}
            <div className="inline-flex items-center gap-2 self-start bg-red-600 text-white px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-widest shadow-lg animate-pulse">
              <ShieldAlert className="h-3.5 w-3.5" />
              Time Critical — Act Within 6 Hours of Death
            </div>

            <div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 leading-[1.08] tracking-tight">
                Give the
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff7a18] via-[#ff9f43] to-[#ffb347]">
                  Miracle of Sight
                </span>
              </h1>
              <p className="mt-5 text-base md:text-lg text-gray-600 leading-relaxed max-w-lg">
                Every eye donation restores sight to <span className="font-bold text-gray-900">two blind individuals</span>. Fill in the details below to notify our nearest medical team instantly — retrieval must happen within <span className="font-bold text-red-600">6 hours of death</span>.
              </p>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Sight Restored", value: "2 Lives", icon: <Eye className="h-5 w-5 text-orange-500" /> },
                { label: "Critical Window", value: "6 Hours", icon: <Clock className="h-5 w-5 text-red-500" /> },
                { label: "Pledgers", value: "1 Lakh+", icon: <Users className="h-5 w-5 text-orange-500" /> },
              ].map((s) => (
                <div key={s.label} className="bg-white border border-orange-100 rounded-2xl p-3 flex flex-col items-center gap-1 shadow-sm">
                  {s.icon}
                  <span className="text-lg font-extrabold text-gray-900">{s.value}</span>
                  <span className="text-[10px] text-gray-500 font-semibold text-center leading-tight">{s.label}</span>
                </div>
              ))}
            </div>

            {/* Helpline */}
            <a href="tel:1919" className="flex items-center gap-4 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-2xl p-4 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer group">
              <div className="h-11 w-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0 group-hover:rotate-12 transition-transform">
                <Phone className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/80">Emergency Eye Bank Helpline • 24/7</p>
                <p className="text-xl font-extrabold tracking-tight">Call Toll-Free: 1919</p>
              </div>
            </a>

            {/* Big CTA Button */}
            <Link href="/donate?intent=emergency">
              <button className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-[#ff7a18] to-[#ff9f43] p-[2px] shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="relative flex items-center justify-between bg-gradient-to-r from-[#ff7a18] to-[#ff9f43] rounded-[14px] px-6 py-4 text-white">
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300 rounded-[14px]" />
                  <div className="flex items-center gap-3 z-10">
                    <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                      <HeartHandshake className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/80">Eye Donation — Within 6 Hours of Death</p>
                      <p className="text-lg font-extrabold leading-tight">Click Now — Notify Our Team</p>
                    </div>
                  </div>
                  <ChevronRight className="h-6 w-6 z-10 group-hover:translate-x-1.5 transition-transform duration-300" />
                </div>
              </button>
            </Link>
          </motion.div>

          {/* ── RIGHT: Emergency Form ────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="bg-white border border-orange-100 rounded-3xl shadow-2xl overflow-hidden">
              {/* Card header bar */}
              <div className="bg-gradient-to-r from-red-600 to-orange-500 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-white font-extrabold text-base leading-tight">Emergency Eye Donation Request</h2>
                    <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest">Fill form — Our team will call you back immediately</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <AnimatePresence mode="wait">
                  {successData ? (
                    <SuccessView
                      key="success"
                      callId={successData.callId}
                      whatsappUrl={successData.whatsappUrl}
                      onReset={() => { setSuccessData(null); form.reset(); }}
                    />
                  ) : (
                    <motion.form
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="space-y-4"
                    >
                      {/* Name */}
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-extrabold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-orange-500" /> Your Full Name
                        </Label>
                        <Input
                          placeholder="e.g. Suresh Kumar"
                          className="h-11 rounded-xl border-gray-200 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-orange-400 font-medium shadow-sm"
                          {...form.register("referrerName")}
                        />
                        {form.formState.errors.referrerName && (
                          <p className="text-[10px] font-semibold text-red-500 flex items-center gap-1">
                            <AlertCircle size={11} /> {form.formState.errors.referrerName.message}
                          </p>
                        )}
                      </div>

                      {/* Contact Number */}
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-extrabold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-orange-500" /> Contact Number
                        </Label>
                        <Input
                          type="tel"
                          className="h-11 rounded-xl border-gray-200 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-orange-400 font-semibold tracking-wide shadow-sm"
                          {...form.register("referrerMobile", { onChange: handleMobileInput })}
                        />
                        {form.formState.errors.referrerMobile ? (
                          <p className="text-[10px] font-semibold text-red-500 flex items-center gap-1">
                            <AlertCircle size={11} /> {form.formState.errors.referrerMobile.message}
                          </p>
                        ) : (
                          <p className="text-[10px] text-gray-400">Include +91, 10 digits, not starting with 0</p>
                        )}
                      </div>

                      {/* Address of Eye Collection */}
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-extrabold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-orange-500" /> Address of Eye Collection
                        </Label>
                        <Input
                          placeholder="e.g. 12, Gandhi Nagar, Near City Hospital"
                          className="h-11 rounded-xl border-gray-200 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-orange-400 font-medium shadow-sm"
                          {...form.register("address")}
                        />
                        {form.formState.errors.address && (
                          <p className="text-[10px] font-semibold text-red-500 flex items-center gap-1">
                            <AlertCircle size={11} /> {form.formState.errors.address.message}
                          </p>
                        )}
                      </div>

                      {/* State & District */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-[11px] font-extrabold text-gray-700 uppercase tracking-wide">State</Label>
                          <Select onValueChange={(val) => {
                            form.setValue("state", val, { shouldValidate: true });
                            form.setValue("district", "", { shouldValidate: false });
                            form.setValue("unitId", 0, { shouldValidate: false });
                          }}>
                            <SelectTrigger className="h-11 rounded-xl border-gray-200 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-orange-400 shadow-sm text-sm font-medium">
                              <SelectValue placeholder="Select State" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                              {INDIA_STATES.map(s => (
                                <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {form.formState.errors.state && (
                            <p className="text-[10px] font-semibold text-red-500">{form.formState.errors.state.message}</p>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-[11px] font-extrabold text-gray-700 uppercase tracking-wide">District</Label>
                          <Select
                            disabled={!selectedState}
                            onValueChange={(val) => form.setValue("district", val, { shouldValidate: true })}
                          >
                            <SelectTrigger className="h-11 rounded-xl border-gray-200 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-orange-400 shadow-sm text-sm font-medium disabled:opacity-50">
                              <SelectValue placeholder={selectedState ? "Select District" : "Select State first"} />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                              {districts.map(d => (
                                <SelectItem key={d} value={d}>{d}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {form.formState.errors.district && (
                            <p className="text-[10px] font-semibold text-red-500">{form.formState.errors.district.message}</p>
                          )}
                        </div>
                      </div>

                      {/* Nearest Sankara Unit — filtered by state */}
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-extrabold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-orange-500" /> Nearest Sankara Hospital Unit
                        </Label>
                        {selectedState && filteredUnits.length > 0 && filteredUnits.length < (units?.length ?? 99) && (
                          <p className="text-[10px] text-green-700 font-bold bg-green-50 border border-green-100 rounded-lg px-2 py-1 flex items-center gap-1">
                            <CheckCircle2 size={11} /> Showing {filteredUnits.length} Sankara unit(s) in {selectedState}
                          </p>
                        )}
                        <Select onValueChange={(val) => form.setValue("unitId", Number(val), { shouldValidate: true })}>
                          <SelectTrigger className="h-11 rounded-xl border-gray-200 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-orange-400 shadow-sm text-sm font-medium">
                            <SelectValue placeholder="Select closest hospital unit" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {filteredUnits.map(u => (
                              <SelectItem key={u.id} value={u.id.toString()}>
                                {u.name} — {u.district}, {u.state}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {form.formState.errors.unitId && (
                          <p className="text-[10px] font-semibold text-red-500 flex items-center gap-1">
                            <AlertCircle size={11} /> {form.formState.errors.unitId.message}
                          </p>
                        )}
                      </div>

                      {/* Submit */}
                      <Button
                        type="submit"
                        disabled={submitCall.isPending}
                        className="w-full h-14 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white rounded-2xl shadow-lg border-0 text-base font-extrabold flex items-center justify-center gap-2 mt-2 transition-all"
                      >
                        {submitCall.isPending ? (
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Logging Emergency...
                          </div>
                        ) : (
                          <>
                            <Send size={18} />
                            Dispatch Team &amp; Call Me Back
                          </>
                        )}
                      </Button>

                      <p className="text-[10px] text-gray-400 text-center">
                        By submitting, you authorize Sankara Eye Bank to contact you for eye retrieval coordination.
                      </p>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
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
