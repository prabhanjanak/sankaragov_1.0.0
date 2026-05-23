import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { BASE_PATH, INDIA_STATES } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSubmitPublicEyeCall, useListPublicUnits } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, Clock, Phone, Heart, ArrowRight, ShieldAlert, HeartHandshake,
  Award, CheckCircle2, BookOpen, Sparkles, Info, Users, Share2, Download, AlertCircle, MapPin, Building2, User, Send
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

export default function Home() {
  const { user } = useAuth();
  const isSignedIn = !!user;
  const [activeSection, setActiveSection] = useState<"guidelines" | "pledge">("guidelines");

  const { data: units } = useListPublicUnits();
  const submitCall = useSubmitPublicEyeCall();

  const emergencyForm = useForm<EmergencyValues>({
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

  const emergencySelectedState = emergencyForm.watch("state");
  const emergencyDistricts = useMemo(() => {
    const stateObj = INDIA_STATES.find(s => s.name === emergencySelectedState);
    return stateObj ? stateObj.districts : [];
  }, [emergencySelectedState]);

  const emergencyFilteredUnits = useMemo(() => {
    if (!units) return [];
    if (!emergencySelectedState) return units;
    const stateMatched = units.filter(u => u.state === emergencySelectedState);
    return stateMatched.length > 0 ? stateMatched : units;
  }, [units, emergencySelectedState]);

  const handleMobileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith("+91 ")) {
      emergencyForm.setValue("referrerMobile", "+91 ", { shouldValidate: true });
      return;
    }
    const prefix = "+91 ";
    let suffix = val.substring(prefix.length).replace(/\D/g, "");
    if (suffix.startsWith("0")) suffix = suffix.substring(1);
    emergencyForm.setValue("referrerMobile", prefix + suffix.substring(0, 10), { shouldValidate: true });
  };

  const onEmergencySubmit = (data: EmergencyValues) => {
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
        // Just redirect to whatsapp directly for simplicity on home page
        window.open(response.whatsappUrl, "_blank");
        emergencyForm.reset();
        alert("Emergency Logged! We are connecting you to WhatsApp.");
      }
    });
  };

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
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-[#fff8f2] via-white to-[#fff3e6] min-h-[85vh] py-16">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-orange-100 rounded-full blur-[160px] opacity-50 pointer-events-none -z-0" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-yellow-100 rounded-full blur-[120px] opacity-40 pointer-events-none -z-0" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-10 flex flex-col items-center text-center">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center gap-6 w-full"
          >
            {/* Urgent Badge */}
            <div className="inline-flex items-center gap-2 bg-red-600 text-white px-5 py-2 rounded-full text-xs sm:text-sm font-extrabold uppercase tracking-widest shadow-lg animate-pulse">
              <ShieldAlert className="h-4 w-4" />
              Time Critical — Act Within 6 Hours of Death
            </div>

            <div className="space-y-4 max-w-3xl">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 leading-[1.08] tracking-tight">
                Give the Miracle of <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff7a18] via-[#ff9f43] to-[#ffb347]">Sight</span>
              </h1>
              <p className="text-base md:text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
                Every eye donation restores sight to two blind individuals. Eye retrieval must happen within <strong className="text-red-600">6 hours of death</strong>.
              </p>
            </div>

            {/* Helpline */}
            <a href="tel:1919" className="flex items-center gap-4 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-2xl p-4 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer group mb-4">
              <div className="h-11 w-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0 group-hover:rotate-12 transition-transform">
                <Phone className="h-6 w-6 animate-pulse" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/80">Emergency Eye Bank Helpline</p>
                <p className="text-xl font-extrabold tracking-tight">Call Toll-Free: 1919</p>
              </div>
            </a>

            {/* WIDE EMERGENCY FORM */}
            <Card className="w-full max-w-4xl border border-red-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-3xl bg-white overflow-hidden relative text-left">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 to-orange-500" />
              <CardContent className="p-6 md:p-10 space-y-8">
                
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                      <AlertCircle className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-extrabold text-gray-900 leading-snug">Emergency Eye Donation</h2>
                      <p className="text-xs text-red-600 font-extrabold tracking-widest uppercase mt-0.5">Report a Recent Death</p>
                    </div>
                  </div>
                  <div className="bg-red-50 text-red-800 text-[10px] md:text-xs font-semibold px-4 py-2 rounded-xl text-right max-w-[200px]">
                    We will dispatch a medical team instantly. Fill out this form accurately.
                  </div>
                </div>

                <form onSubmit={emergencyForm.handleSubmit(onEmergencySubmit)} className="space-y-6">
                  {/* Row 1: Name and Phone */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-red-500" /> Your Full Name</Label>
                      <Input placeholder="e.g. Suresh Kumar" className="h-12 rounded-xl border-gray-200 bg-gray-50 focus:bg-white text-base font-medium" {...emergencyForm.register("referrerName")} />
                      {emergencyForm.formState.errors.referrerName && <p className="text-[10px] text-red-500 font-semibold">{emergencyForm.formState.errors.referrerName.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-red-500" /> Contact Number</Label>
                      <Input type="tel" className="h-12 rounded-xl border-gray-200 bg-gray-50 focus:bg-white text-base font-semibold tracking-wide" onChange={handleMobileInput} value={emergencyForm.watch("referrerMobile")} />
                      {emergencyForm.formState.errors.referrerMobile && <p className="text-[10px] text-red-500 font-semibold">{emergencyForm.formState.errors.referrerMobile.message}</p>}
                    </div>
                  </div>

                  {/* Row 2: Address */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-red-500" /> Address of Eye Collection</Label>
                    <Input placeholder="e.g. 12, Gandhi Nagar, Near City Hospital" className="h-12 rounded-xl border-gray-200 bg-gray-50 focus:bg-white text-base font-medium" {...emergencyForm.register("address")} />
                    {emergencyForm.formState.errors.address && <p className="text-[10px] text-red-500 font-semibold">{emergencyForm.formState.errors.address.message}</p>}
                  </div>

                  {/* Row 3: State, District, Unit */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-gray-700 uppercase tracking-wide">State</Label>
                      <Select onValueChange={(val) => {
                        emergencyForm.setValue("state", val, { shouldValidate: true });
                        emergencyForm.setValue("district", "", { shouldValidate: false });
                        emergencyForm.setValue("unitId", 0, { shouldValidate: false });
                      }}>
                        <SelectTrigger className="h-12 rounded-xl border-gray-200 bg-gray-50 focus:bg-white text-sm">
                          <SelectValue placeholder="Select State" />
                        </SelectTrigger>
                        <SelectContent>
                          {INDIA_STATES.map(s => <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-gray-700 uppercase tracking-wide">District</Label>
                      <Select disabled={!emergencySelectedState} onValueChange={(val) => emergencyForm.setValue("district", val, { shouldValidate: true })}>
                        <SelectTrigger className="h-12 rounded-xl border-gray-200 bg-gray-50 focus:bg-white text-sm disabled:opacity-50">
                          <SelectValue placeholder="Select District" />
                        </SelectTrigger>
                        <SelectContent>
                          {emergencyDistricts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-red-500" /> Nearest Hospital</Label>
                      <Select onValueChange={(val) => emergencyForm.setValue("unitId", Number(val), { shouldValidate: true })}>
                        <SelectTrigger className="h-12 rounded-xl border-gray-200 bg-gray-50 focus:bg-white text-sm">
                          <SelectValue placeholder="Select hospital" />
                        </SelectTrigger>
                        <SelectContent>
                          {emergencyFilteredUnits.map(u => <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {emergencyForm.formState.errors.unitId && <p className="text-[10px] text-red-500 font-semibold">{emergencyForm.formState.errors.unitId.message}</p>}
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button type="submit" disabled={submitCall.isPending} className="w-full h-14 bg-red-600 hover:bg-red-700 text-white rounded-2xl shadow-lg border-0 text-base font-extrabold flex items-center justify-center gap-2 transition-all">
                      {submitCall.isPending ? "Logging Request..." : <><Send size={18} /> Dispatch Team &amp; Call Me Back</>}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* PLEDGE EYE CTA */}
            <div className="mt-12 text-center flex flex-col items-center">
              <p className="text-sm text-gray-500 font-bold tracking-widest uppercase mb-4">Want to become a sight ambassador?</p>
              <Link href="/donate?intent=pledge">
                <button className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#ff7a18] to-[#ff9f43] p-[2px] shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="relative flex items-center justify-center gap-3 bg-gradient-to-r from-[#ff7a18] to-[#ff9f43] rounded-[14px] px-10 py-5 text-white">
                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300 rounded-[14px]" />
                    <Award className="h-7 w-7 z-10" />
                    <span className="text-xl font-extrabold z-10 tracking-tight">Pledge Your Eyes</span>
                    <ArrowRight className="h-6 w-6 z-10 group-hover:translate-x-1.5 transition-transform duration-300" />
                  </div>
                </button>
              </Link>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 mt-16 w-full max-w-4xl border-t border-gray-200/60 pt-10">
              {[
                { label: "Sight Restored", value: "2 Lives", icon: <Eye className="h-5 w-5 text-orange-500" /> },
                { label: "Critical Window", value: "6 Hours", icon: <Clock className="h-5 w-5 text-red-500" /> },
                { label: "Pledgers", value: "1 Lakh+", icon: <Users className="h-5 w-5 text-orange-500" /> },
                { label: "Retrieval Time", value: "20 Mins", icon: <Heart className="h-5 w-5 text-orange-500" /> },
              ].map((s) => (
                <div key={s.label} className="flex flex-col items-center gap-2">
                  <div className="h-10 w-10 bg-white rounded-xl shadow-sm border border-orange-50 flex items-center justify-center">
                    {s.icon}
                  </div>
                  <div className="text-center">
                    <span className="block text-lg font-extrabold text-gray-900">{s.value}</span>
                    <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider">{s.label}</span>
                  </div>
                </div>
              ))}
            </div>

          </motion.div>
        </div>
      </section>

      {/* ── BELOW FOLD: Guidelines ──────────────────────────── */}
      <section className="w-full bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 md:px-10 py-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              Essential <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff7a18] to-[#ff9f43]">Guidelines</span>
            </h2>
            <p className="text-sm text-gray-500 mt-2 max-w-xl mx-auto">
              Important clinical instructions that every family must know when considering eye donation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: <ShieldAlert size={22} className="text-orange-600" />, bg: "bg-orange-50", border: "border-orange-100", color: "from-orange-500 to-orange-400",
                title: "Switch Off Fans", desc: "Turn off all ceiling fans in the room the moment death occurs. Switch on AC if available."
              },
              {
                icon: <CheckCircle2 size={22} className="text-green-600" />, bg: "bg-green-50", border: "border-green-100", color: "from-green-500 to-emerald-400",
                title: "Close Eyes & Wet Cotton", desc: "Gently close the deceased's eyes and place clean, wet cotton pads over the closed eyelids."
              },
              {
                icon: <Info size={22} className="text-blue-600" />, bg: "bg-blue-50", border: "border-blue-100", color: "from-blue-500 to-blue-400",
                title: "Age, Sex & Religion", desc: "Anyone can donate eyes regardless of age, sex, blood group, or religion."
              },
              {
                icon: <Sparkles size={22} className="text-amber-600" />, bg: "bg-amber-50", border: "border-amber-100", color: "from-amber-500 to-yellow-400",
                title: "Zero Disfigurement", desc: "The surgical retrieval takes only 20 minutes and leaves absolutely no facial disfigurement."
              },
              {
                icon: <Heart size={22} className="text-red-600" />, bg: "bg-red-50", border: "border-red-100", color: "from-red-500 to-red-400",
                title: "Ethical & Free", desc: "Donated eyes are never sold. They are used purely to restore vision free of charge."
              },
              {
                icon: <Eye size={22} className="text-purple-600" />, bg: "bg-purple-50", border: "border-purple-100", color: "from-purple-500 to-purple-400",
                title: "Illuminate Two Lives", desc: "One donation gives sight to TWO blind individuals through corneal transplantation."
              },
            ].map((item, i) => (
              <div key={i} className={`relative bg-white ${item.border} border rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden`}>
                <div className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${item.color} group-hover:w-2 transition-all`} />
                <div className={`${item.bg} h-11 w-11 rounded-2xl flex items-center justify-center mb-4`}>{item.icon}</div>
                <h4 className="font-extrabold text-gray-900 text-[15px] mb-2">{item.title}</h4>
                <p className="text-xs text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
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
