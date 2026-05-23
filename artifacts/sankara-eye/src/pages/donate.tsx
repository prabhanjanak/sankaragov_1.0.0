import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSubmitPublicEyeCall, useListPublicUnits } from "@workspace/api-client-react";
import { INDIA_STATES, BASE_PATH } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  CheckCircle2, Phone, Send, Heart, AlertCircle, Award, 
  Download, Share2, Activity, ArrowLeft, Clock, ShieldAlert, Sparkles, MapPin, Building2, User
} from "lucide-react";
import { Link } from "wouter";

// Indian Mobile Validation Regex: starts with +91 [6-9] followed by 9 digits
const mobileRegex = /^\+91 [6-9]\d{9}$/;

// 🚨 Zod Schema for EMERGENCY quick report — now includes name, address, state, district
const emergencySchema = z.object({
  referrerName: z.string().min(2, "Your name is required"),
  referrerMobile: z.string().regex(mobileRegex, "Enter a valid 10-digit number not starting with 0"),
  address: z.string().min(5, "Address of eye collection is required"),
  state: z.string().min(2, "State is required"),
  district: z.string().min(2, "District is required"),
  unitId: z.coerce.number().min(1, "Please select the nearest hospital unit"),
});

// ✍️ Zod Schema for FUTURE eye pledge
const pledgeSchema = z.object({
  pledgerName: z.string().min(2, "Your name is required"),
  pledgerAge: z.coerce.number().min(1, "Enter a valid age").max(120, "Age must be below 120"),
  pledgerGender: z.enum(["male", "female", "other"]),
  pledgerMobile: z.string().regex(mobileRegex, "Enter a valid 10-digit number not starting with 0"),
  pledgerEmail: z.string().email("Enter a valid email").optional().or(z.literal("")),
  unitId: z.coerce.number().min(1, "Please select nearest Sankara hospital"),
  state: z.string().min(2, "State is required"),
  district: z.string().min(2, "District is required"),
});

type EmergencyValues = z.infer<typeof emergencySchema>;
type PledgeValues = z.infer<typeof pledgeSchema>;


export default function Donate() {
  const [successData, setSuccessData] = useState<{ 
    whatsappUrl: string; 
    callId: string; 
    pledgerName?: string;
    pledgeDate?: string;
    unitName?: string;
  } | null>(null);

  const { data: units } = useListPublicUnits();
  const submitCall = useSubmitPublicEyeCall();

  // Scroll to section based on intent
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const intent = params.get("intent");
    if (intent === "pledge") {
      document.getElementById("pledge-section")?.scrollIntoView({ behavior: "smooth" });
    } else if (intent === "emergency") {
      document.getElementById("emergency-section")?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // 1. Emergency Form Hook
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

  // 2. Pledge Form Hook
  const pledgeForm = useForm<PledgeValues>({
    resolver: zodResolver(pledgeSchema),
    defaultValues: {
      pledgerName: "",
      pledgerAge: undefined as any,
      pledgerGender: "male",
      pledgerMobile: "+91 ",
      pledgerEmail: "",
      unitId: 0,
      state: "",
      district: "",
    },
  });

  // Emergency form state/district watchers
  const emergencySelectedState = emergencyForm.watch("state");
  const emergencyDistricts = useMemo(() => {
    const stateObj = INDIA_STATES.find(s => s.name === emergencySelectedState);
    return stateObj ? stateObj.districts : [];
  }, [emergencySelectedState]);

  // Smart unit filter for emergency form: filter by state if Sankara has units there
  const emergencyFilteredUnits = useMemo(() => {
    if (!units) return [];
    if (!emergencySelectedState) return units;
    const matched = units.filter(u => u.state === emergencySelectedState);
    return matched.length > 0 ? matched : units;
  }, [units, emergencySelectedState]);

  // Pledge form state/district watchers
  const selectedState = pledgeForm.watch("state");
  const districts = useMemo(() => {
    const state = INDIA_STATES.find(s => s.name === selectedState);
    return state ? state.districts : [];
  }, [selectedState]);

  // Smart unit filter for pledge form
  const pledgeFilteredUnits = useMemo(() => {
    if (!units) return [];
    if (!selectedState) return units;
    const matched = units.filter(u => u.state === selectedState);
    return matched.length > 0 ? matched : units;
  }, [units, selectedState]);

  // Handle +91 Input Locking
  const handleMobileInput = (e: React.ChangeEvent<HTMLInputElement>, setValueFn: (val: string) => void) => {
    let val = e.target.value;
    if (!val.startsWith("+91 ")) {
      e.target.value = "+91 ";
      setValueFn("+91 ");
      return;
    }

    const prefix = "+91 ";
    let suffix = val.substring(prefix.length).replace(/\D/g, "");
    
    // Enforce first digit cannot be 0
    if (suffix.startsWith("0")) {
      suffix = suffix.substring(1);
    }
    
    const formatted = prefix + suffix.substring(0, 10);
    e.target.value = formatted;
    setValueFn(formatted);
  };

  // Submit Emergency Call — now includes name, address, state, district
  const onEmergencySubmit = (data: EmergencyValues) => {
    const payload = {
      referrerName: data.referrerName,
      referrerMobile: data.referrerMobile,
      referrerRelationship: "Relative / Family",
      donorName: "Deceased Relative (Emergency Callback)",
      donorAge: 0,
      donorGender: "other" as const,
      timeOfDeath: new Date().toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' }) + " (Today)",
      causeOfDeath: "Not Specified (Emergency Mode)",
      state: data.state,
      district: data.district,
      pincode: "000000",
      address: data.address,
      unitId: data.unitId,
    };

    submitCall.mutate({ data: payload }, {
      onSuccess: (response) => {
        setSuccessData({ 
          whatsappUrl: response.whatsappUrl, 
          callId: response.eyeCall.callId 
        });
        window.open(response.whatsappUrl, "_blank");
        window.scrollTo(0, 0);
      }
    });
  };

  // Submit Future Pledge Form
  const onPledgeSubmit = (data: PledgeValues) => {
    const selectedUnit = units?.find(u => u.id === data.unitId);
    
    // Background compliance values mapping for future pledges
    const payload = {
      referrerName: data.pledgerName,
      referrerMobile: data.pledgerMobile,
      referrerRelationship: "Self",
      donorName: data.pledgerName,
      donorAge: data.pledgerAge,
      donorGender: data.pledgerGender,
      timeOfDeath: "Pledge (Future Donation)",
      causeOfDeath: "Pledge (Future Donation)",
      state: data.state,
      district: data.district,
      pincode: "000000",
      address: "Pledge registered online. Certificate generated.",
      unitId: data.unitId,
    };

    submitCall.mutate({ data: payload }, {
      onSuccess: (response) => {
        setSuccessData({
          whatsappUrl: response.whatsappUrl,
          callId: response.eyeCall.callId,
          pledgerName: data.pledgerName,
          pledgeDate: new Date().toLocaleDateString("en-IN", { day: '2-digit', month: 'long', year: 'numeric' }),
          unitName: selectedUnit?.name || "Sankara Eye Hospital"
        });
        window.scrollTo(0, 0);
      }
    });
  };


  // WhatsApp sharing helper for Certificate
  const shareCertificateOnWhatsApp = () => {
    if (!successData) return;
    const message = `*My Eye Donation Pledge — Sankara Eye Foundation*\n\n` +
      `I have proudly pledged to donate my eyes at *${successData.unitName}*!\n` +
      `This noble decision will give the miracle of sight to two blind individuals.\n\n` +
      `🏥 Certificate ID: *${successData.callId}*\n` +
      `📅 Pledge Date: ${successData.pledgeDate}\n\n` +
      `Be a Sight Ambassador too — pledge here: ${window.location.origin}/donate?intent=pledge`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  // Success view
  if (successData) {
    const isPledgeSuccess = !!successData.pledgerName;

    return (
      <div className="min-h-[100dvh] bg-gradient-to-br from-orange-50/20 via-white to-orange-100/10 flex flex-col items-center justify-center p-4 print:p-0 select-none">
        
        {/* ── Premium Landscape Print CSS ── */}
        <style>{`
          @page {
            size: A4 landscape;
            margin: 0;
          }
          @media print {
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
              width: 297mm !important;
              height: 210mm !important;
            }
            .print-hide { display: none !important; }
            #pledge-certificate-wrapper {
              position: fixed !important;
              top: 0 !important; left: 0 !important;
              width: 297mm !important; height: 210mm !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              background: white !important;
              padding: 8mm !important;
              box-sizing: border-box !important;
            }
            #pledge-certificate {
              width: 281mm !important; height: 194mm !important;
              border: 6px double #b8860b !important;
              outline: 2px solid #d4af37 !important;
              outline-offset: -10px !important;
              border-radius: 0 !important;
              box-shadow: none !important;
              background: white !important;
              display: flex !important;
              flex-direction: column !important;
              overflow: hidden !important;
            }
          }
        `}</style>

        {isPledgeSuccess ? (
          <div id="pledge-certificate-wrapper" className="flex flex-col items-center w-full max-w-5xl">
            {/* ── Controls (hidden on print) ── */}
            <div className="print-hide text-center mb-6 max-w-md">
              <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3 mx-auto shadow-inner">
                <CheckCircle2 size={28} />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900">🎉 Pledge Registered!</h2>
              <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                Thank you for your noble commitment, <strong>{successData.pledgerName}</strong>.<br />
                Your Certificate of Appreciation is ready below.
              </p>
            </div>

            {/* ── THE CERTIFICATE ── */}
            <div
              id="pledge-certificate"
              className="w-full border-[6px] border-double border-[#b8860b] outline outline-2 outline-offset-[-10px] outline-[#d4af37] bg-white shadow-2xl overflow-hidden flex flex-col"
              style={{ aspectRatio: "297/210", maxWidth: "900px" }}
            >
              {/* === HEADER BAND === */}
              <div className="bg-gradient-to-r from-[#7b0000] via-[#a30000] to-[#7b0000] px-8 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4 bg-white/90 rounded-xl px-3 py-1.5">
                  <img src={`${BASE_PATH}/logo.png`} alt="Sankara Eye Foundation" className="h-10 object-contain" />
                </div>
                <div className="text-center">
                  <p className="text-white/80 text-[10px] font-bold uppercase tracking-[0.3em]">Official Document</p>
                  <p className="text-white text-xs font-extrabold tracking-widest uppercase">Eye Donation Pledge Registry</p>
                </div>
                <div className="text-right text-[10px] text-white/70 font-mono">
                  <p className="font-bold text-white">{successData.callId}</p>
                  <p>{successData.pledgeDate}</p>
                </div>
              </div>

              {/* === CERTIFICATE BODY === */}
              <div className="flex-1 flex flex-col items-center justify-center px-12 py-4 text-center relative">
                {/* Watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04]">
                  <img src={`${BASE_PATH}/logo.png`} alt="" className="w-64 h-64 object-contain" />
                </div>

                {/* Decorative top flourish */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-[1px] w-16 bg-gradient-to-r from-transparent to-[#d4af37]" />
                  <Award className="h-8 w-8 text-[#b8860b]" />
                  <div className="h-[1px] w-16 bg-gradient-to-l from-transparent to-[#d4af37]" />
                </div>

                <p className="text-[11px] uppercase tracking-[0.25em] text-[#8b6914] font-bold mb-1">
                  Sankara Eye Foundation — India
                </p>

                <h1 className="font-serif text-4xl md:text-5xl font-black text-gray-900 tracking-wide uppercase leading-tight mb-2">
                  Certificate of Appreciation
                </h1>

                <div className="flex items-center gap-3 mb-3">
                  <div className="h-[1.5px] w-24 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />
                  <div className="h-2 w-2 rounded-full bg-[#d4af37]" />
                  <div className="h-[1.5px] w-24 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />
                </div>

                <p className="text-xs text-gray-500 italic mb-2">
                  This certificate is proudly and gratefully presented to our esteemed Sight Ambassador
                </p>

                <h2 className="font-serif text-3xl md:text-4xl font-black text-gray-900 border-b-2 border-[#d4af37] pb-2 px-8 tracking-wide mb-3">
                  {successData.pledgerName}
                </h2>

                <p className="text-sm text-gray-700 font-medium max-w-2xl leading-relaxed mb-1">
                  who has solemnly and compassionately pledged to donate their eyes, bestowing the{" "}
                  <span
                    className="font-black tracking-wide"
                    style={{ background: "linear-gradient(90deg, #b8860b 0%, #f5c842 40%, #d4af37 70%, #a0720a 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
                  >GIFT OF VISION</span>{" "}
                  upon two blind individuals — a gift that transcends life itself.
                </p>

                <p className="text-[11px] text-gray-400 italic">
                  "Do not deny them sight — let your eyes illuminate lives even after yours."
                </p>
              </div>

              {/* === FOOTER BAND === */}
              <div className="bg-[#fdf8ec] border-t-2 border-[#d4af37] px-10 py-3 flex items-center justify-between shrink-0">
                <div className="text-left">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#8b6914]">Registered Hospital Unit</p>
                  <p className="text-xs font-extrabold text-gray-800">{successData.unitName || "Sankara Eye Hospital"}</p>
                </div>
                <div className="text-center flex flex-col items-center gap-0.5">
                  <img src={`${BASE_PATH}/logo.png`} alt="Sankara" className="h-9 object-contain opacity-60" />
                  <p className="text-[8px] text-[#8b6914] font-semibold tracking-wide">Sri Kanchi Kamakoti Medical Trust</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#8b6914]">Certificate ID</p>
                  <p className="text-xs font-mono font-extrabold text-gray-800 mt-0.5">{successData.callId}</p>
                </div>
              </div>
            </div>

            {/* ── Action Buttons ── */}
            <div className="print-hide flex flex-col sm:flex-row gap-3 w-full max-w-lg mt-6">
              <Button
                onClick={() => window.print()}
                className="flex-1 h-12 bg-gray-950 hover:bg-gray-800 text-white rounded-2xl shadow-md border-0 text-sm font-bold flex items-center justify-center gap-2"
              >
                <Download size={18} /> Download / Print Certificate
              </Button>
              <Button
                onClick={shareCertificateOnWhatsApp}
                className="flex-1 h-12 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-2xl shadow-md border-0 text-sm font-bold flex items-center justify-center gap-2"
              >
                <Share2 size={18} /> Share on WhatsApp
              </Button>
            </div>

            <div className="print-hide flex gap-3 mt-3">
              <Button onClick={() => setSuccessData(null)} variant="ghost" className="text-gray-500 hover:text-gray-900 text-xs font-semibold">
                Register Another Pledge
              </Button>
              <Link href="/">
                <Button variant="ghost" className="text-gray-400 hover:text-gray-900 text-xs font-semibold">
                  Return to Home
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* Emergency success */
          <div className="w-full max-w-md text-center">
            <Card className="border-0 shadow-2xl rounded-3xl bg-white overflow-hidden p-8 flex flex-col items-center">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-5 shadow-inner">
                <CheckCircle2 size={36} />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 leading-snug">Emergency Request Logged</h2>
              <p className="text-sm text-gray-500 mt-2 max-w-sm leading-relaxed">
                Reference ID: <span className="font-mono font-bold text-gray-900">{successData.callId}</span>.<br/>
                Our coordinator will call you back immediately.
              </p>
              <div className="bg-red-50 border border-red-100 rounded-2xl p-5 w-full text-left my-6 space-y-2">
                <h4 className="text-xs font-extrabold text-red-800 uppercase tracking-wide flex items-center gap-1.5">
                  <Activity size={14} className="animate-pulse" /> Do This Immediately
                </h4>
                <ul className="text-[12px] text-red-950 space-y-1.5 leading-snug">
                  <li className="flex gap-2"><span className="text-red-500 font-bold">①</span> Switch off ALL ceiling fans in the room right now.</li>
                  <li className="flex gap-2"><span className="text-red-500 font-bold">②</span> Gently close the deceased's eyes and place wet cotton over the eyelids.</li>
                  <li className="flex gap-2"><span className="text-red-500 font-bold">③</span> Turn on AC if available to keep the room cool.</li>
                  <li className="flex gap-2"><span className="text-red-500 font-bold">④</span> Our coordinator will arrive within the 6-hour window.</li>
                </ul>
              </div>
              <div className="flex flex-col gap-3 w-full">
                <Button
                  className="w-full h-12 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-2xl shadow-md font-bold flex items-center justify-center gap-2"
                  onClick={() => window.open(successData.whatsappUrl, "_blank")}
                >
                  <Phone size={18} /> Ping Coordinator on WhatsApp
                </Button>
                <Link href="/">
                  <Button variant="outline" className="w-full h-12 rounded-2xl border-gray-200 text-gray-600 font-semibold hover:bg-gray-50">
                    Return to Home
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#FAFAFA] flex flex-col select-none relative overflow-x-hidden">
      
      {/* Premium Header */}
      <header className="h-16 md:h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-4 md:px-12 sticky top-0 z-50">
        <Link href="/">
          <img src={`${BASE_PATH}/logo.png`} alt="Sankara Eye Foundation" className="h-10 md:h-12 object-contain cursor-pointer hover:scale-[1.01] transition-transform duration-300" />
        </Link>
        <Link href="/">
          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900 rounded-xl h-9 md:h-10 text-xs font-semibold gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
          </Button>
        </Link>
      </header>

      {/* Hero Header */}
      <div className="w-full pt-12 pb-8 px-4 text-center relative">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full h-64 bg-gradient-to-b from-orange-100/50 to-transparent blur-3xl pointer-events-none -z-10" />
        <div className="inline-flex items-center gap-1 bg-orange-50 border border-orange-100 px-3 py-1 rounded-full text-[10px] md:text-xs font-extrabold text-orange-600 uppercase tracking-widest mb-4 shadow-sm">
          <Activity className="h-3.5 w-3.5 animate-pulse" /> Official Eye Bank Portal
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight mb-4">
          Give the Miracle of <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff7a18] to-[#ff9f43]">Sight</span>
        </h1>
        <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Every eye donation restores sight to two blind individuals. Whether you need to report an emergency retrieval within the critical 6-hour window, or wish to pledge your eyes for the future, use the forms below.
        </p>
      </div>

      {/* Main Multi-Form Container (Side-by-Side Grid) */}
      <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 pb-16 gap-8 md:gap-12 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start w-full">
          
          {/* ========================================================
              🚨 LEFT COLUMN: EMERGENCY FORM
              ======================================================== */}
          <div id="emergency-section" className="flex flex-col">
            <Card className="border border-red-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl bg-gradient-to-b from-red-50/40 to-white overflow-hidden relative transition-all duration-300 hover:shadow-[0_8px_40px_rgb(239,68,68,0.12)]">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 to-orange-500" />
              <CardContent className="p-6 md:p-8 space-y-6">
                
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 leading-snug">Report Recent Death</h2>
                    <p className="text-[10px] md:text-xs text-red-600 font-extrabold tracking-widest uppercase">Emergency Callback Request</p>
                  </div>
                </div>

                {/* Big Glowing Helpline */}
                <a href="tel:1919" className="flex items-center gap-4 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-2xl p-4 md:p-5 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer text-left border-0 w-full decoration-none group">
                  <div className="h-11 w-11 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0 shadow-inner group-hover:rotate-12 transition-transform">
                    <Phone className="h-6 w-6 animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/90">Time Critical: Retrieval inside 6h</p>
                    <p className="text-lg md:text-2xl font-extrabold tracking-tight">Call 1919 Toll-Free</p>
                  </div>
                </a>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-gray-200"></div>
                  <span className="flex-shrink mx-4 text-gray-400 text-[10px] font-bold tracking-widest uppercase font-mono">OR LOG REQUEST</span>
                  <div className="flex-grow border-t border-gray-200"></div>
                </div>
                  <form onSubmit={emergencyForm.handleSubmit(onEmergencySubmit)} className="space-y-4">

                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-red-500" /> Your Full Name</Label>
                    <Input
                      placeholder="e.g. Suresh Kumar"
                      className="h-12 rounded-xl border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-red-500 text-base shadow-sm font-medium"
                      {...emergencyForm.register("referrerName")}
                    />
                    {emergencyForm.formState.errors.referrerName && (
                      <p className="text-xs font-semibold text-red-500 flex items-center gap-1 mt-1"><AlertCircle size={12} /> {emergencyForm.formState.errors.referrerName.message}</p>
                    )}
                  </div>

                  {/* Contact Number */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-red-500" /> Contact Number</Label>
                    <Input
                      type="tel"
                      className="h-12 rounded-xl border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-red-500 text-base font-semibold transition-all shadow-sm tracking-wide"
                      {...emergencyForm.register("referrerMobile", {
                        onChange: (e) => handleMobileInput(e, (v) => emergencyForm.setValue("referrerMobile", v, { shouldValidate: true }))
                      })}
                    />
                    {emergencyForm.formState.errors.referrerMobile ? (
                      <p className="text-xs font-semibold text-red-500 flex items-center gap-1 mt-1"><AlertCircle size={12} /> {emergencyForm.formState.errors.referrerMobile.message}</p>
                    ) : (
                      <p className="text-[10px] text-gray-400">Include +91, 10 digits, not starting with 0</p>
                    )}
                  </div>

                  {/* Address of Eye Collection */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-red-500" /> Address of Eye Collection</Label>
                    <Input
                      placeholder="e.g. 12, Gandhi Nagar, Near City Hospital"
                      className="h-12 rounded-xl border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-red-500 text-base shadow-sm font-medium"
                      {...emergencyForm.register("address")}
                    />
                    {emergencyForm.formState.errors.address && (
                      <p className="text-xs font-semibold text-red-500 flex items-center gap-1 mt-1"><AlertCircle size={12} /> {emergencyForm.formState.errors.address.message}</p>
                    )}
                  </div>

                  {/* State & District */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-gray-700 uppercase tracking-wide">State</Label>
                      <Select onValueChange={(val) => {
                        emergencyForm.setValue("state", val, { shouldValidate: true });
                        emergencyForm.setValue("district", "", { shouldValidate: false });
                        emergencyForm.setValue("unitId", 0, { shouldValidate: false });
                      }}>
                        <SelectTrigger className="h-12 rounded-xl border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-red-500 shadow-sm text-sm">
                          <SelectValue placeholder="Select State" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {INDIA_STATES.map(s => (
                            <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {emergencyForm.formState.errors.state && (
                        <p className="text-[10px] font-semibold text-red-500">{emergencyForm.formState.errors.state.message}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-gray-700 uppercase tracking-wide">District</Label>
                      <Select
                        disabled={!emergencySelectedState}
                        onValueChange={(val) => emergencyForm.setValue("district", val, { shouldValidate: true })}
                      >
                        <SelectTrigger className="h-12 rounded-xl border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-red-500 shadow-sm text-sm disabled:opacity-50">
                          <SelectValue placeholder={emergencySelectedState ? "Select District" : "State first"} />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {emergencyDistricts.map(d => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {emergencyForm.formState.errors.district && (
                        <p className="text-[10px] font-semibold text-red-500">{emergencyForm.formState.errors.district.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Nearest Hospital — smart filtered by state */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-red-500" /> Nearest Sankara Hospital</Label>
                    {emergencySelectedState && emergencyFilteredUnits.length > 0 && emergencyFilteredUnits.length < (units?.length ?? 99) && (
                      <p className="text-[10px] text-green-700 font-bold bg-green-50 border border-green-100 rounded-lg px-2 py-1 flex items-center gap-1">
                        <CheckCircle2 size={10} /> Showing {emergencyFilteredUnits.length} Sankara unit(s) in {emergencySelectedState}
                      </p>
                    )}
                    <Select onValueChange={(val) => emergencyForm.setValue("unitId", Number(val), { shouldValidate: true })}>
                      <SelectTrigger className="h-12 rounded-xl border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-red-500 text-sm shadow-sm">
                        <SelectValue placeholder="Select closest hospital unit" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {emergencyFilteredUnits.map(u => (
                          <SelectItem key={u.id} value={u.id.toString()}>{u.name} — {u.district}, {u.state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {emergencyForm.formState.errors.unitId && (
                      <p className="text-xs font-semibold text-red-500 flex items-center gap-1 mt-1"><AlertCircle size={12} /> {emergencyForm.formState.errors.unitId.message}</p>
                    )}
                  </div>

                  <Button type="submit" disabled={submitCall.isPending} className="w-full h-14 bg-gray-900 hover:bg-black text-white rounded-2xl shadow-lg border-0 text-sm md:text-base font-extrabold flex items-center justify-center gap-2 mt-2 transition-all">
                    {submitCall.isPending ? "Logging Emergency Request..." : <><Send size={18} /> Dispatch Team &amp; Call Me Back</>}
                  </Button>
                </form>

              </CardContent>
            </Card>
          </div>

          {/* ========================================================
              ✍️ RIGHT COLUMN: PLEDGE FORM
              ======================================================== */}
          <div id="pledge-section" className="flex flex-col">
            <Card className="border border-orange-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl bg-white overflow-hidden relative transition-all duration-300 hover:shadow-[0_8px_40px_rgb(255,122,24,0.12)]">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-400 to-yellow-400" />
              <CardContent className="p-6 md:p-8 space-y-6">
                
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                    <Heart className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 leading-snug">Pledge Your Eyes</h2>
                    <p className="text-[10px] md:text-xs text-orange-600 font-extrabold tracking-widest uppercase">Register Future Donation</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed border-b border-gray-50 pb-4">Join 100,000+ ambassadors. Submit your details below to instantly generate your personalized digital Sight Certificate.</p>

                <form onSubmit={pledgeForm.handleSubmit(onPledgeSubmit)} className="space-y-4 pt-2">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Full Name</Label>
                      <Input placeholder="Your Name" className="h-11 rounded-xl border-gray-200 bg-gray-50/50 text-gray-900 focus:ring-2 focus:ring-orange-500 shadow-sm font-medium" {...pledgeForm.register("pledgerName")} />
                      {pledgeForm.formState.errors.pledgerName && <p className="text-[10px] font-semibold text-red-500 mt-1">{pledgeForm.formState.errors.pledgerName.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Age</Label>
                        <Input type="number" placeholder="Age" className="h-11 rounded-xl border-gray-200 bg-gray-50/50 text-gray-900 focus:ring-2 focus:ring-orange-500 shadow-sm font-medium" {...pledgeForm.register("pledgerAge")} />
                        {pledgeForm.formState.errors.pledgerAge && <p className="text-[10px] font-semibold text-red-500 mt-1">{pledgeForm.formState.errors.pledgerAge.message}</p>}
                      </div>
                      
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Gender</Label>
                        <Select onValueChange={(val) => pledgeForm.setValue("pledgerGender", val as any)} defaultValue="male">
                          <SelectTrigger className="h-11 rounded-xl border-gray-200 bg-gray-50/50 text-gray-900 focus:ring-2 focus:ring-orange-500 shadow-sm font-medium">
                            <SelectValue placeholder="Sex" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Mobile Number</Label>
                      <Input 
                        type="tel"
                        className="h-11 rounded-xl border-gray-200 bg-gray-50/50 text-gray-900 focus:ring-2 focus:ring-orange-500 shadow-sm font-semibold tracking-wide"
                        {...pledgeForm.register("pledgerMobile", {
                          onChange: (e) => handleMobileInput(e, (v) => pledgeForm.setValue("pledgerMobile", v, { shouldValidate: true }))
                        })} 
                      />
                      {pledgeForm.formState.errors.pledgerMobile && <p className="text-[10px] font-semibold text-red-500 mt-1">{pledgeForm.formState.errors.pledgerMobile.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Email (Optional)</Label>
                      <Input type="email" placeholder="name@email.com" className="h-11 rounded-xl border-gray-200 bg-gray-50/50 text-gray-900 focus:ring-2 focus:ring-orange-500 shadow-sm font-medium" {...pledgeForm.register("pledgerEmail")} />
                      {pledgeForm.formState.errors.pledgerEmail && <p className="text-[10px] font-semibold text-red-500 mt-1">{pledgeForm.formState.errors.pledgerEmail.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5"><Building2 className="h-3 w-3 text-orange-500" /> Nearest Sankara Hospital Unit</Label>
                    {selectedState && pledgeFilteredUnits.length > 0 && pledgeFilteredUnits.length < (units?.length ?? 99) && (
                      <p className="text-[10px] text-green-700 font-bold bg-green-50 border border-green-100 rounded-lg px-2 py-1 flex items-center gap-1">
                        <CheckCircle2 size={10} /> Showing {pledgeFilteredUnits.length} Sankara unit(s) in {selectedState}
                      </p>
                    )}
                    <Select onValueChange={(val) => pledgeForm.setValue("unitId", Number(val))}>
                      <SelectTrigger className="h-11 rounded-xl border-gray-200 bg-gray-50/50 text-gray-900 focus:ring-2 focus:ring-orange-500 text-sm shadow-sm font-medium">
                        <SelectValue placeholder="Select closest hospital unit" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {pledgeFilteredUnits.map(u => <SelectItem key={u.id} value={u.id.toString()}>{u.name} — {u.district}, {u.state}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {pledgeForm.formState.errors.unitId && <p className="text-[10px] font-semibold text-red-500 mt-1">{pledgeForm.formState.errors.unitId.message}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">State</Label>
                      <Select onValueChange={(val) => { pledgeForm.setValue("state", val); pledgeForm.setValue("district", ""); }}>
                        <SelectTrigger className="h-11 rounded-xl border-gray-200 bg-gray-50/50 text-gray-900 focus:ring-2 focus:ring-orange-500 shadow-sm font-medium">
                          <SelectValue placeholder="Select State" />
                        </SelectTrigger>
                        <SelectContent>{INDIA_STATES.map(s => <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
                      </Select>
                      {pledgeForm.formState.errors.state && <p className="text-[10px] font-semibold text-red-500 mt-1">{pledgeForm.formState.errors.state.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">District</Label>
                      <Select disabled={!selectedState} onValueChange={(val) => pledgeForm.setValue("district", val)}>
                        <SelectTrigger className="h-11 rounded-xl border-gray-200 bg-gray-50/50 text-gray-900 focus:ring-2 focus:ring-orange-500 shadow-sm font-medium">
                          <SelectValue placeholder="Select District" />
                        </SelectTrigger>
                        <SelectContent>{districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                      </Select>
                      {pledgeForm.formState.errors.district && <p className="text-[10px] font-semibold text-red-500 mt-1">{pledgeForm.formState.errors.district.message}</p>}
                    </div>
                  </div>

                  <Button type="submit" disabled={submitCall.isPending} className="w-full h-14 bg-gradient-to-r from-[#ff7a18] to-[#ff9f43] hover:from-[#ff9f43] hover:to-[#ffb347] text-white rounded-2xl shadow-lg border-0 font-extrabold flex items-center justify-center gap-2 mt-4 transition-all">
                    {submitCall.isPending ? "Registering Pledge..." : <><CheckCircle2 size={18} /> Complete Eye Pledge & Get Certificate</>}
                  </Button>
                </form>

              </CardContent>
            </Card>
          </div>

        </div>
        
        {/* ========================================================
            FULL PAGE GUIDELINES & PROTOCOLS (To fill the page beautifully)
            ======================================================== */}
        <div className="mt-12">
          <div className="text-center mb-10">
            <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Essential Guidelines & Protocols</h3>
            <p className="text-sm text-gray-500 mt-2 font-medium">Important clinical instructions regarding the eye donation procedure</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <div className="bg-white border border-red-100/60 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-red-500 to-red-400 group-hover:w-2 transition-all"></div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-red-50 rounded-xl text-red-600"><Clock size={20} className="animate-pulse" /></div>
                <h4 className="font-extrabold text-gray-900 text-[15px]">Critical 6-Hour Window</h4>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                Eye retrieval must be performed strictly within 6 hours of death. Immediate notification to our hotline is absolutely crucial to guarantee the restoration of sight.
              </p>
            </div>

            <div className="bg-white border border-orange-100/60 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-orange-400 to-amber-400 group-hover:w-2 transition-all"></div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-orange-50 rounded-xl text-orange-600"><ShieldAlert size={20} /></div>
                <h4 className="font-extrabold text-gray-900 text-[15px]">Immediate Actions Required</h4>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                As soon as a death occurs, switch off all ceiling fans in the room immediately to prevent the corneas from drying out. Close the eyelids and cover them with a clean, damp cloth or wet cotton.
              </p>
            </div>

            <div className="bg-white border border-amber-100/60 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-amber-400 to-yellow-400 group-hover:w-2 transition-all"></div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600"><Sparkles size={20} /></div>
                <h4 className="font-extrabold text-gray-900 text-[15px]">Zero Disfigurement</h4>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                The surgical retrieval is clean, completely free of charge, and takes only 20 minutes in a standard room. It leaves absolutely no scars, ensuring full respect for the deceased.
              </p>
            </div>

            <div className="bg-white border border-green-100/60 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-green-400 to-emerald-400 group-hover:w-2 transition-all"></div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-green-50 rounded-xl text-green-600"><CheckCircle2 size={20} /></div>
                <h4 className="font-extrabold text-gray-900 text-[15px]">Age & Cataracts Allowed</h4>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                Anyone can donate their eyes. Poor eyesight, wearing spectacles, history of cataract surgery, religion, and blood group do not restrict an individual from giving the gift of sight.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-orange-50/50 to-orange-100/20 border border-orange-200/50 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden md:col-span-2 lg:col-span-2 group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#ff7a18] to-[#ff9f43] group-hover:w-2 transition-all"></div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-white rounded-xl text-orange-600 shadow-sm"><Heart size={20} className="animate-pulse" /></div>
                <h4 className="font-extrabold text-gray-900 text-[15px]">Illuminate Two Lives</h4>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed font-medium">
                Corneal blindness causes severe suffering, but it is curable through transplantation. Your noble decision restores the miracle of sight to <span className="font-bold text-gray-950">not one, but two blind individuals</span> plunged into darkness. Do not deny them life—let your eyes live even after you.
              </p>
            </div>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-10 md:h-12 border-t border-gray-100 flex items-center justify-between px-4 md:px-8 bg-white z-10 shrink-0">
        <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-gray-500 font-bold tracking-wide">
          <Heart className="h-3.5 w-3.5 text-[#ff7a18] fill-[#ff7a18] animate-pulse" />
          <span>Sankara Eye Foundation - India</span>
        </div>
        <p className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-wider">
          © {new Date().getFullYear()} Sri Kanchi Kamakoti Medical Trust. All Rights Reserved.
        </p>
      </footer>

    </div>
  );
}
