import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search, Activity, BookOpen, ChevronRight, Loader2, AlertCircle,
  RefreshCcw, ArrowRight, Info, LineChart, Plus, History,
  Download, ExternalLink, ShieldAlert, CheckCircle2, Trash2,
  User, Timer, X, Package, LogOut
} from "lucide-react";
import {
  LineChart as ReLineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";
import { format } from "date-fns";
import { generateRehabProtocol } from "./services/protocolService";
import { supabase, supabaseEnabled } from "./lib/supabase";
import Auth from "./components/Auth";
import { cn } from "./lib/utils";
import type { RehabProtocol, ExerciseLog, LogEntry } from "./types";
import type { Session } from "@supabase/supabase-js";

// ─── Body Map Component ─────────────────────────────────────────────
const BodyMap = ({ selected, onSelect }: { selected: string; onSelect: (loc: string) => void }) => {
  const regions = [
    { id: "Head", cx: 50, cy: 8, r: 6 },
    { id: "Neck", cx: 50, cy: 16, r: 3 },
    { id: "Shoulder (L)", cx: 33, cy: 22, r: 4.5 },
    { id: "Shoulder (R)", cx: 67, cy: 22, r: 4.5 },
    { id: "Upper Arm (L)", cx: 28, cy: 32, r: 4 },
    { id: "Upper Arm (R)", cx: 72, cy: 32, r: 4 },
    { id: "Elbow (L)", cx: 24, cy: 42, r: 4 },
    { id: "Elbow (R)", cx: 76, cy: 42, r: 4 },
    { id: "Forearm (L)", cx: 20, cy: 52, r: 3.5 },
    { id: "Forearm (R)", cx: 80, cy: 52, r: 3.5 },
    { id: "Wrist (L)", cx: 16, cy: 62, r: 3 },
    { id: "Wrist (R)", cx: 84, cy: 62, r: 3 },
    { id: "Hand (L)", cx: 13, cy: 70, r: 3 },
    { id: "Hand (R)", cx: 87, cy: 70, r: 3 },
    { id: "Chest", cx: 50, cy: 30, r: 7 },
    { id: "Abdomen", cx: 50, cy: 45, r: 7 },
    { id: "Hip (L)", cx: 42, cy: 58, r: 5 },
    { id: "Hip (R)", cx: 58, cy: 58, r: 5 },
    { id: "Thigh (L)", cx: 40, cy: 72, r: 5.5 },
    { id: "Thigh (R)", cx: 60, cy: 72, r: 5.5 },
    { id: "Knee (L)", cx: 40, cy: 85, r: 4.5 },
    { id: "Knee (R)", cx: 60, cy: 85, r: 4.5 },
    { id: "Shin (L)", cx: 41, cy: 95, r: 4 },
    { id: "Shin (R)", cx: 59, cy: 95, r: 4 },
    { id: "Ankle (L)", cx: 42, cy: 104, r: 3 },
    { id: "Ankle (R)", cx: 58, cy: 104, r: 3 },
    { id: "Foot (L)", cx: 40, cy: 112, r: 3 },
    { id: "Foot (R)", cx: 60, cy: 112, r: 3 },
  ];

  const backRegions = [
    { id: "Upper Back", cx: 50, cy: 28, r: 7 },
    { id: "Mid Back", cx: 50, cy: 42, r: 6 },
    { id: "Lower Back", cx: 50, cy: 54, r: 7 },
    { id: "Glute (L)", cx: 42, cy: 65, r: 6 },
    { id: "Glute (R)", cx: 58, cy: 65, r: 6 },
    { id: "Hamstring (L)", cx: 40, cy: 78, r: 5.5 },
    { id: "Hamstring (R)", cx: 60, cy: 78, r: 5.5 },
    { id: "Calf (L)", cx: 41, cy: 95, r: 4.5 },
    { id: "Calf (R)", cx: 59, cy: 95, r: 4.5 },
    { id: "Heel (L)", cx: 42, cy: 106, r: 3 },
    { id: "Heel (R)", cx: 58, cy: 106, r: 3 },
  ];

  const bodyOutline = "M50,2 Q55,2 58,6 Q61,10 58,14 Q55,18 50,18 Q45,18 42,14 Q39,10 42,6 Q45,2 50,2 M45,18 L55,18 L68,22 L75,40 L82,65 L88,75 L85,78 L78,65 L72,40 L65,22 L35,22 L28,40 L22,65 L15,75 L12,78 L18,65 L25,40 L32,22 M40,58 L40,85 L42,110 L38,115 L45,115 L48,110 L48,58 M60,58 L60,85 L58,110 L62,115 L55,115 L52,110 L52,58";

  const jointIds = ["Shoulder (L)", "Shoulder (R)", "Elbow (L)", "Elbow (R)", "Wrist (L)", "Wrist (R)", "Knee (L)", "Knee (R)", "Ankle (L)", "Ankle (R)"];

  const renderCircle = (r: { id: string; cx: number; cy: number; r: number }, keySuffix = "") => (
    <circle
      key={r.id + keySuffix}
      cx={r.cx} cy={r.cy} r={r.r}
      className={cn(
        "cursor-pointer transition-all duration-300",
        selected === r.id
          ? "fill-blue-600 stroke-blue-200 stroke-[3px] scale-110"
          : "fill-white stroke-slate-200 stroke-[1px] hover:fill-blue-50 hover:stroke-blue-300"
      )}
      onClick={() => onSelect(r.id)}
    >
      <title>{r.id}</title>
    </circle>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-around items-start bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-inner">
        <div className="text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Anterior View</p>
          <svg viewBox="0 0 100 120" className="w-40 h-56 drop-shadow-sm">
            <path d={bodyOutline} fill="none" stroke="#e2e8f0" strokeWidth="1.5" strokeLinecap="round" />
            {regions.map((r) => renderCircle(r))}
          </svg>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Posterior View</p>
          <svg viewBox="0 0 100 120" className="w-40 h-56 drop-shadow-sm">
            <path d={bodyOutline} fill="none" stroke="#e2e8f0" strokeWidth="1.5" strokeLinecap="round" />
            {backRegions.map((r) => renderCircle(r))}
            {regions.filter(r => jointIds.includes(r.id)).map((r) => renderCircle(r, "-back"))}
          </svg>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        <div className="w-full text-center mb-2">
          <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-black uppercase rounded-full border border-blue-100">
            Selected: {selected || "None"}
          </span>
        </div>
        {["Other", "General", "Systemic"].map(loc => (
          <button
            key={loc} type="button"
            onClick={() => onSelect(loc)}
            className={cn(
              "px-4 py-1.5 rounded-xl text-[10px] font-bold border transition-all",
              selected === loc
                ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100"
                : "bg-white border-slate-200 text-slate-500 hover:border-blue-300"
            )}
          >
            {loc}
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── Main App ────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(supabaseEnabled);

  // Restore session on mount (only if Supabase is configured)
  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  // If Supabase is configured and user isn't logged in, show auth
  if (supabaseEnabled && !session) {
    return <Auth />;
  }

  return <MainApp session={session} />;
}

// ─── Authenticated Main App ──────────────────────────────────────────
function MainApp({ session }: { session: Session | null }) {
  const [injury, setInjury] = useState("");
  const [protocol, setProtocol] = useState<RehabProtocol | null>(null);
  const [activeProtocolId, setActiveProtocolId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"home" | "injury" | "protocol" | "tracker" | "profile">("home");
  const [selectedPhase, setSelectedPhase] = useState(0);

  // Saved protocols list
  const [savedProtocols, setSavedProtocols] = useState<{ id: string; injury_name: string; protocol_data: RehabProtocol; created_at: string }[]>([]);

  // Tracking State
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showLogForm, setShowLogForm] = useState(false);
  const [isSelectingPhase, setIsSelectingPhase] = useState(false);
  const [activeWorkout, setActiveWorkout] = useState<{
    phaseIndex: number;
    exercises: ExerciseLog[];
  } | null>(null);

  // Timer State
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = (seconds: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerSeconds(seconds);
    timerRef.current = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev === null || prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerSeconds(null);
  };

  const [newLog, setNewLog] = useState<Partial<LogEntry>>({
    painScore: 5, romScore: 50, completedExercises: true, notes: "", painLocation: ""
  });

  // ─── Load saved protocols & logs from Supabase ───
  useEffect(() => {
    loadProtocols();
  }, []);

  useEffect(() => {
    if (activeProtocolId) loadLogs(activeProtocolId);
  }, [activeProtocolId]);

  const loadProtocols = async () => {
    if (!supabase || !session) return;
    const { data } = await supabase
      .from("protocols")
      .select("id, injury_name, protocol_data, created_at, is_active")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (data && data.length > 0) {
      setSavedProtocols(data);
      const active = data.find((p: { is_active: boolean }) => p.is_active) || data[0];
      setActiveProtocolId(active.id);
      setProtocol(active.protocol_data as RehabProtocol);
    }
  };

  const loadLogs = async (protocolId: string) => {
    if (!supabase) return;
    const { data } = await supabase
      .from("progress_logs")
      .select("*")
      .eq("protocol_id", protocolId)
      .order("created_at", { ascending: false });

    if (data) {
      setLogs(data.map((row: { id: string; created_at: string; pain_score: number; rom_score: number; completed_exercises: boolean; notes: string; pain_location: string | null; workout_details: LogEntry["workoutDetails"] | null }) => ({
        id: row.id,
        date: row.created_at,
        painScore: row.pain_score,
        romScore: row.rom_score,
        completedExercises: row.completed_exercises,
        notes: row.notes,
        painLocation: row.pain_location || undefined,
        workoutDetails: row.workout_details || undefined,
      })));
    }
  };

  // ─── Progression Alert ───
  const progressionAlert = useMemo(() => {
    if (!protocol || logs.length < 3) return null;
    const currentPhaseLogs = logs.filter(l => l.workoutDetails?.phaseIndex === selectedPhase).slice(0, 3);
    if (currentPhaseLogs.length < 3) return null;
    const avgPain = currentPhaseLogs.reduce((acc, l) => acc + l.painScore, 0) / 3;
    const avgRom = currentPhaseLogs.reduce((acc, l) => acc + l.romScore, 0) / 3;
    if (avgPain <= 2 && avgRom >= 85 && selectedPhase < protocol.phases.length - 1) {
      return {
        nextPhase: selectedPhase + 1,
        message: `You've maintained low pain and high ROM for 3 sessions. Ready for Phase ${protocol.phases[selectedPhase + 1].phaseNumber}?`
      };
    }
    return null;
  }, [logs, protocol, selectedPhase]);

  // ─── Generate Protocol ───
  const handleGenerate = async (e?: React.FormEvent, overrideInjury?: string) => {
    if (e) e.preventDefault();
    const searchInjury = overrideInjury || injury;
    if (!searchInjury.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await generateRehabProtocol(searchInjury);

      // Save to Supabase if connected
      if (supabase && session) {
        await supabase
          .from("protocols")
          .update({ is_active: false })
          .eq("user_id", session.user.id);

        const { data: inserted } = await supabase
          .from("protocols")
          .insert({
            user_id: session.user.id,
            injury_name: result.injuryName,
            protocol_data: result,
            is_active: true,
          })
          .select("id")
          .single();

        if (inserted) {
          setActiveProtocolId(inserted.id);
        }
        await loadProtocols();
      }

      setProtocol(result);
      setSelectedPhase(0);
      setActiveTab("injury");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Workout / Logging ───
  const startWorkout = (phaseIndex: number) => {
    if (!protocol) return;
    const phase = protocol.phases[phaseIndex];
    setActiveWorkout({
      phaseIndex,
      exercises: phase.exercises.map(ex => ({
        name: ex.name, completed: false, painScore: 0, variant: "normal"
      }))
    });
    setShowLogForm(true);
  };

  const updateExerciseLog = (index: number, updates: Partial<ExerciseLog>) => {
    if (!activeWorkout) return;
    const nextExercises = [...activeWorkout.exercises];
    nextExercises[index] = { ...nextExercises[index], ...updates };
    setActiveWorkout({ ...activeWorkout, exercises: nextExercises });
  };

  const addLog = async () => {
    const newEntry: LogEntry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      painScore: newLog.painScore || 0,
      romScore: newLog.romScore || 0,
      completedExercises: activeWorkout
        ? activeWorkout.exercises.every(e => e.completed)
        : (newLog.completedExercises || false),
      notes: newLog.notes || "",
      painLocation: newLog.painLocation || undefined,
      workoutDetails: activeWorkout ? {
        phaseIndex: activeWorkout.phaseIndex,
        exercises: activeWorkout.exercises
      } : undefined,
    };

    if (supabase && session && activeProtocolId) {
      await supabase
        .from("progress_logs")
        .insert({
          user_id: session.user.id,
          protocol_id: activeProtocolId,
          pain_score: newEntry.painScore,
          rom_score: newEntry.romScore,
          completed_exercises: newEntry.completedExercises,
          notes: newEntry.notes,
          pain_location: newEntry.painLocation || null,
          workout_details: newEntry.workoutDetails || null,
        });
      await loadLogs(activeProtocolId);
    } else {
      // Local-only mode
      setLogs([newEntry, ...logs]);
    }

    setShowLogForm(false);
    setActiveWorkout(null);
    setNewLog({ painScore: 5, romScore: 50, completedExercises: true, notes: "", painLocation: "" });
  };

  const deleteLog = async (id: string) => {
    if (supabase) {
      await supabase.from("progress_logs").delete().eq("id", id);
    }
    setLogs(logs.filter(l => l.id !== id));
  };

  // ─── Computed ───
  const recoveryScore = useMemo(() => {
    if (logs.length < 2) return 0;
    const recentLogs = logs.slice(0, 5);
    const initialPain = logs[logs.length - 1].painScore;
    const currentPain = recentLogs[0].painScore;
    const painImprovement = Math.max(0, ((initialPain - currentPain) / (initialPain || 1)) * 100);
    const initialRom = logs[logs.length - 1].romScore;
    const currentRom = recentLogs[0].romScore;
    const romImprovement = Math.max(0, ((currentRom - initialRom) / (100 - initialRom || 1)) * 100);
    const adherence = (recentLogs.filter(l => l.completedExercises).length / recentLogs.length) * 100;
    const score = (painImprovement * 0.4) + (romImprovement * 0.3) + (adherence * 0.3);
    return Math.round(Math.min(100, score));
  }, [logs]);

  const chartData = useMemo(() => {
    return [...logs].reverse().map(l => ({
      date: format(new Date(l.date), "MMM d"),
      pain: l.painScore,
      rom: l.romScore,
    }));
  }, [logs]);

  const exportReportCard = () => {
    if (!protocol) return;
    const recentLogs = logs.slice(0, 5);
    const report = `
REHABILITATION PROGRESS REPORT
------------------------------
Injury: ${protocol.injuryName}
Current Recovery Score: ${recoveryScore}/100

SUMMARY OF RECENT SESSIONS:
${recentLogs.map(l => `- ${format(new Date(l.date), "MMM d")}: Pain ${l.painScore}/10, ROM ${l.romScore}%, ${l.completedExercises ? "Completed" : "Partial"}`).join("\n")}

NOTES:
${recentLogs.map(l => l.notes ? `- ${l.notes}` : "").filter(Boolean).join("\n")}

Generated by RehabProtocol AI
    `.trim();

    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Rehab_Report_${protocol.injuryName.replace(/\s+/g, "_")}.txt`;
    a.click();
  };

  const handleSignOut = async () => {
    if (supabase) await supabase.auth.signOut();
  };

  // ─── Render ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-blue-100">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-5xl">
          <div className="flex items-center gap-2">
            <button onClick={() => setActiveTab("home")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Activity size={20} />
              </div>
              <span className="font-bold text-lg tracking-tight text-slate-800">RehabProtocol AI</span>
            </button>
          </div>
          <nav className="hidden sm:flex items-center gap-4">
            {(["home", "injury", "protocol", "tracker", "profile"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-colors capitalize flex items-center gap-2",
                  activeTab === tab ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:text-blue-600"
                )}
              >
                {tab === "tracker" && <LineChart size={16} />}
                {tab === "profile" && <User size={16} />}
                {tab}
              </button>
            ))}
            <button
              onClick={handleSignOut}
              className="px-3 py-2 text-sm font-medium text-slate-400 hover:text-red-500 transition-colors"
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-5xl">
        {activeTab === "home" ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center">
            <section className="text-center mb-16 w-full">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight">
                  Evidence-Based <span className="text-blue-600">Injury Recovery</span>
                </h1>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
                  Input your injury and receive a comprehensive 12-week rehabilitation protocol synthesized from the latest clinical research.
                </p>
              </motion.div>

              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.4 }} className="max-w-2xl mx-auto">
                <form onSubmit={handleGenerate} className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Search size={20} />
                  </div>
                  <input
                    type="text"
                    placeholder="e.g., Grade 2 ACL Sprain, Tennis Elbow..."
                    className="w-full pl-12 pr-32 py-5 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xl placeholder:text-slate-400"
                    value={injury}
                    onChange={(e) => setInjury(e.target.value)}
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !injury.trim()}
                    className="absolute right-2 top-2 bottom-2 px-8 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-blue-200"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : <><span>Generate</span><ArrowRight size={20} /></>}
                  </button>
                </form>

                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  {["ACL Tear", "Rotator Cuff Strain", "Plantar Fasciitis", "Ankle Sprain"].map((s) => (
                    <button
                      key={s}
                      onClick={() => { setInjury(s); handleGenerate(undefined, s); }}
                      className="text-sm font-semibold px-4 py-2 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </motion.div>

              {error && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center max-w-lg mx-auto mt-12">
                  <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-red-900 mb-2">Generation Failed</h3>
                  <p className="text-red-700 text-sm">{error}</p>
                </motion.div>
              )}
            </section>
          </div>
        ) : activeTab === "injury" ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            {!protocol ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
                <Info size={48} className="mb-4 opacity-20" />
                <p className="text-lg font-medium">No injury selected</p>
                <p className="text-sm mt-1">Generate a protocol on the Home page to see injury details.</p>
                <button onClick={() => setActiveTab("home")} className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors">Go to Home</button>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                  <h2 className="text-3xl font-bold text-slate-900 mb-6">Understanding Your Injury</h2>
                  <div className="prose prose-slate max-w-none">
                    <h3 className="text-xl font-bold text-slate-800 mb-4">What is it?</h3>
                    <p className="text-slate-600 leading-relaxed mb-8">{protocol.laymanExplanation}</p>
                    <h3 className="text-xl font-bold text-slate-800 mb-4">Clinical Overview</h3>
                    <p className="text-slate-600 leading-relaxed">{protocol.overview}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-blue-50 border border-blue-100 rounded-3xl p-8">
                    <h3 className="text-xl font-bold text-blue-900 mb-4">The Rehab Strategy</h3>
                    <p className="text-blue-800 leading-relaxed mb-6">Our 12-week protocol is designed to safely progress you through key stages of recovery:</p>
                    <div className="grid grid-cols-2 gap-4">
                      {protocol.phases.map((phase, i) => (
                        <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-blue-100">
                          <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Phase {phase.phaseNumber}</p>
                          <p className="font-bold text-slate-800 mb-1 text-sm">{phase.phaseName}</p>
                          <p className="text-[10px] text-slate-500">{phase.weeks}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-white">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Package size={20} className="text-blue-400" /> Equipment Needed
                    </h3>
                    <p className="text-slate-400 text-sm mb-6">You'll need these tools to complete the full 12-week protocol:</p>
                    <div className="flex flex-wrap gap-2">
                      {protocol.equipment.map((item, i) => (
                        <span key={i} className="px-3 py-1.5 bg-white/10 rounded-xl text-xs font-medium border border-white/5">{item}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ) : activeTab === "protocol" ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            {!protocol ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
                <BookOpen size={48} className="mb-4 opacity-20" />
                <p className="text-lg font-medium">No protocol generated</p>
                <p className="text-sm mt-1">Generate a protocol on the Home page to see your prescription.</p>
                <button onClick={() => setActiveTab("home")} className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors">Go to Home</button>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Red Flags */}
                <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex gap-6 items-start shadow-sm">
                  <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center shrink-0">
                    <ShieldAlert size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-red-900 mb-1">When to See a Professional</h3>
                    <p className="text-sm text-red-700 mb-3 leading-relaxed">Discontinue self-rehab and consult a doctor or physical therapist immediately if you experience:</p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-xs text-red-800 font-medium list-disc pl-4">
                      {protocol.redFlags.map((flag, i) => <li key={i}>{flag}</li>)}
                    </ul>
                  </div>
                </div>

                {/* Protocol Card */}
                <div id="printable-protocol" className="bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden">
                  <div className="bg-slate-900 p-8 text-white">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <div className="flex items-center gap-2 text-blue-400 mb-2">
                          <BookOpen size={16} />
                          <span className="text-xs font-bold uppercase tracking-widest">Clinical Protocol</span>
                        </div>
                        <h2 className="text-3xl font-bold">{protocol.injuryName}</h2>
                      </div>
                      <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-sm font-semibold">
                        <Download size={18} /><span>Download PDF</span>
                      </button>
                    </div>
                  </div>

                  <div className="border-b border-slate-100 bg-slate-50/50 px-8">
                    <div className="flex gap-8">
                      {protocol.phases.map((phase, i) => (
                        <button
                          key={i} onClick={() => setSelectedPhase(i)}
                          className={cn("py-4 text-sm font-bold border-b-2 transition-all",
                            selectedPhase === i ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"
                          )}
                        >
                          Phase {phase.phaseNumber}: {phase.weeks}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-8 sm:p-12">
                    <div className="mb-10">
                      <h3 className="text-xl font-bold text-slate-900 mb-2">{protocol.phases[selectedPhase].phaseName}</h3>
                      <p className="text-slate-500 text-sm leading-relaxed">{protocol.phases[selectedPhase].description}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                      {protocol.phases[selectedPhase].exercises.map((ex, i) => (
                        <div key={i} className="group bg-slate-50 rounded-2xl p-6 border border-slate-100 hover:border-blue-200 hover:bg-white hover:shadow-lg hover:shadow-blue-500/5 transition-all">
                          <div className="flex justify-between items-start mb-4">
                            <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{ex.name}</h4>
                            <a href={ex.videoUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-white rounded-lg text-slate-400 hover:text-red-500 shadow-sm transition-colors" title="Watch Video">
                              <ExternalLink size={16} />
                            </a>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-white/50 p-3 rounded-xl">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sets x Reps</p>
                              <p className="text-sm font-bold text-slate-700">{ex.sets} x {ex.reps}</p>
                            </div>
                            <div className="bg-white/50 p-3 rounded-xl">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Rest</p>
                              <p className="text-sm font-bold text-slate-700">{ex.rest}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <RefreshCcw size={14} className="text-blue-500" />
                            <span>Frequency: {ex.frequency}</span>
                          </div>
                          {ex.instructions && (
                            <p className="mt-4 text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-4">{ex.instructions}</p>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                      <h4 className="text-sm font-bold text-blue-900 mb-4 flex items-center gap-2">
                        <CheckCircle2 size={18} /> Progression Criteria
                      </h4>
                      <ul className="space-y-2">
                        {protocol.phases[selectedPhase].progressionCriteria.map((crit, i) => (
                          <li key={i} className="text-sm text-blue-800 flex items-start gap-2">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />{crit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="bg-slate-50 border-t border-slate-100 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-xs text-slate-500">
                      <p className="font-bold mb-1">Research References:</p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {protocol.references.map((ref, i) => <li key={i}>{ref}</li>)}
                      </ul>
                    </div>
                    <button onClick={() => setActiveTab("home")} className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                      Start New Search<ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ) : activeTab === "tracker" ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-3xl font-bold text-slate-900">Recovery Progress</h2>
                <p className="text-slate-500 mt-1">Monitor your recovery journey and pain trends.</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={exportReportCard} disabled={!protocol || logs.length === 0} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 disabled:opacity-50 transition-all flex items-center gap-2">
                  <Download size={18} /><span>Report Card</span>
                </button>
                <button
                  onClick={() => { setIsSelectingPhase(true); setShowLogForm(true); }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-200"
                >
                  <Plus size={20} /><span>Start Workout</span>
                </button>
              </div>
            </div>

            {/* Progression Alert */}
            {progressionAlert && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center"><ArrowRight size={20} /></div>
                  <div>
                    <p className="text-sm font-bold text-green-900">Virtual PT Suggestion</p>
                    <p className="text-xs text-green-700">{progressionAlert.message}</p>
                  </div>
                </div>
                <button onClick={() => { setSelectedPhase(progressionAlert.nextPhase); setActiveTab("protocol"); }} className="px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition-colors">
                  View Phase {protocol?.phases[progressionAlert.nextPhase].phaseNumber}
                </button>
              </motion.div>
            )}

            {/* Recovery Score */}
            {logs.length >= 2 && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white mb-8 shadow-xl shadow-blue-200/50 relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="text-center md:text-left">
                    <h3 className="text-xl font-bold mb-2 opacity-90">Recovery Readiness Score</h3>
                    <p className="text-blue-100 text-sm max-w-md">Your score is calculated based on pain reduction, ROM improvement, and exercise adherence over your last 5 sessions.</p>
                  </div>
                  <div className="flex items-center justify-center w-32 h-32 rounded-full bg-white/10 border-4 border-white/20 backdrop-blur-sm">
                    <div className="text-center">
                      <span className="text-4xl font-black">{recoveryScore}</span>
                      <span className="block text-[10px] font-bold uppercase tracking-widest opacity-60">Percent</span>
                    </div>
                  </div>
                </div>
                <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
                <div className="absolute -left-12 -top-12 w-48 h-48 bg-blue-400/10 rounded-full blur-2xl" />
              </motion.div>
            )}

            {logs.length > 0 ? (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Pain Score (1-10)</h3>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ReLineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                          <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                          <Line type="monotone" dataKey="pain" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: '#ef4444' }} activeDot={{ r: 6 }} />
                        </ReLineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Range of Motion (%)</h3>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ReLineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                          <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                          <Line type="monotone" dataKey="rom" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
                        </ReLineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex items-center gap-2">
                    <History size={20} className="text-slate-400" />
                    <h3 className="font-bold text-slate-800">Recent Logs</h3>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {logs.map((log) => (
                      <div key={log.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-6">
                          <div className="text-center min-w-[60px]">
                            <p className="text-xs font-bold text-slate-400 uppercase">{format(new Date(log.date), "MMM")}</p>
                            <p className="text-2xl font-black text-slate-800">{format(new Date(log.date), "d")}</p>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium px-2 py-0.5 bg-red-50 text-red-600 rounded-md">Pain: {log.painScore}/10</span>
                              <span className="text-sm font-medium px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md">ROM: {log.romScore}%</span>
                              {log.painLocation && <span className="text-sm font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">Loc: {log.painLocation}</span>}
                              {log.completedExercises && (
                                <span className="flex items-center gap-1 text-xs font-bold text-green-600"><CheckCircle2 size={14} />Exercises Done</span>
                              )}
                            </div>
                            {log.workoutDetails && protocol && (
                              <div className="mt-3 space-y-2">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                  Phase {protocol.phases[log.workoutDetails.phaseIndex]?.phaseNumber} Workout
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {log.workoutDetails.exercises.map((ex, i) => (
                                    <div key={i} className={cn(
                                      "px-3 py-1.5 rounded-xl border text-[10px] font-bold flex items-center gap-2",
                                      ex.completed ? "bg-green-50 border-green-100 text-green-700" : "bg-slate-50 border-slate-100 text-slate-400"
                                    )}>
                                      {ex.completed ? <CheckCircle2 size={12} /> : <Activity size={12} />}
                                      <span>{ex.name}</span>
                                      {ex.completed && <span className="ml-1 px-1.5 py-0.5 bg-white rounded-md border border-green-200">Pain: {ex.painScore}</span>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {log.notes && <p className="text-sm text-slate-500 italic">"{log.notes}"</p>}
                          </div>
                        </div>
                        <button onClick={() => deleteLog(log.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
                <LineChart size={48} className="mb-4 opacity-20" />
                <p className="text-lg font-medium">No progress data yet</p>
                <p className="text-sm mt-1">Start logging your sessions to see your recovery trend.</p>
              </div>
            )}
          </motion.div>
        ) : activeTab === "profile" ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400"><User size={40} /></div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{session?.user?.email || "Guest"}</h2>
                  <p className="text-slate-500">Managing {savedProtocols.length} protocols</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Sessions</p>
                  <p className="text-3xl font-black text-slate-800">{logs.length}</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Current Score</p>
                  <p className="text-3xl font-black text-blue-600">{recoveryScore}%</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Active Since</p>
                  <p className="text-xl font-bold text-slate-800">
                    {logs.length > 0 ? format(new Date(logs[logs.length - 1].date), "MMM yyyy") : "N/A"}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-900 px-2">Your Protocols</h3>
              {savedProtocols.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400"><p>No protocols saved yet.</p></div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {savedProtocols.map((p) => (
                    <button
                      key={p.id}
                      onClick={async () => {
                        if (supabase && session) {
                          await supabase.from("protocols").update({ is_active: false }).eq("user_id", session.user.id);
                          await supabase.from("protocols").update({ is_active: true }).eq("id", p.id);
                        }
                        setActiveProtocolId(p.id);
                        setProtocol(p.protocol_data);
                        setActiveTab("injury");
                      }}
                      className={cn(
                        "flex items-center justify-between p-6 bg-white border rounded-2xl transition-all hover:border-blue-300 hover:shadow-md text-left",
                        activeProtocolId === p.id ? "border-blue-600 ring-1 ring-blue-600" : "border-slate-200"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Activity size={24} /></div>
                        <div>
                          <h4 className="font-bold text-slate-900">{p.injury_name}</h4>
                          <p className="text-sm text-slate-500">12-Week Protocol &bull; {(p.protocol_data as RehabProtocol).phases.length} Phases</p>
                        </div>
                      </div>
                      {activeProtocolId === p.id && <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-bold uppercase rounded-full">Active</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ) : null}
      </main>

      {/* Log Form Modal */}
      <AnimatePresence>
        {showLogForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowLogForm(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="p-8 overflow-y-auto">
                <h3 className="text-2xl font-bold text-slate-900 mb-6">
                  {isSelectingPhase ? "Select Phase" : activeWorkout ? `Phase ${protocol?.phases[activeWorkout.phaseIndex].phaseNumber} Workout` : "Log Session"}
                </h3>

                {isSelectingPhase && protocol ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {protocol.phases.map((phase, i) => (
                      <button key={i} onClick={() => { setIsSelectingPhase(false); startWorkout(i); }} className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-left hover:border-blue-500 hover:bg-blue-50 transition-all group">
                        <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-1">Phase {phase.phaseNumber}</p>
                        <p className="font-bold text-slate-800 group-hover:text-blue-700">{phase.phaseName}</p>
                        <p className="text-xs text-slate-500 mt-1">{phase.weeks}</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 flex justify-between">
                          <span>Pain Level</span><span className="text-red-600">{newLog.painScore}/10</span>
                        </label>
                        <input type="range" min="0" max="10" step="1" className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-red-500" value={newLog.painScore} onChange={(e) => setNewLog({ ...newLog, painScore: parseInt(e.target.value) })} />
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider"><span>None</span><span>Moderate</span><span>Severe</span></div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 flex justify-between">
                          <span>Range of Motion</span><span className="text-blue-600">{newLog.romScore}%</span>
                        </label>
                        <input type="range" min="0" max="100" step="5" className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-500" value={newLog.romScore} onChange={(e) => setNewLog({ ...newLog, romScore: parseInt(e.target.value) })} />
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider"><span>Limited</span><span>Normal</span></div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-3">Pain Location</label>
                        <BodyMap selected={newLog.painLocation || ""} onSelect={(loc) => setNewLog({ ...newLog, painLocation: loc })} />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Notes (Optional)</label>
                        <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm" placeholder="How did you feel today?" rows={3} value={newLog.notes} onChange={(e) => setNewLog({ ...newLog, notes: e.target.value })} />
                      </div>
                    </div>

                    {activeWorkout && protocol && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-800">Exercise Checklist & Pain</h4>
                          {timerSeconds !== null ? (
                            <div className="flex items-center gap-3 bg-blue-600 text-white px-4 py-1.5 rounded-full text-sm font-bold animate-pulse">
                              <Timer size={16} />
                              <span>{Math.floor(timerSeconds / 60)}:{String(timerSeconds % 60).padStart(2, '0')}</span>
                              <button onClick={stopTimer} className="hover:text-blue-200"><X size={14} /></button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button onClick={() => startTimer(30)} className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">30s Rest</button>
                              <button onClick={() => startTimer(60)} className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">60s Rest</button>
                            </div>
                          )}
                        </div>
                        <div className="space-y-3">
                          {activeWorkout.exercises.map((ex, i) => (
                            <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                              <div className="flex items-center justify-between mb-3">
                                <label className="flex items-center gap-3 cursor-pointer">
                                  <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" checked={ex.completed} onChange={(e) => updateExerciseLog(i, { completed: e.target.checked })} />
                                  <div>
                                    <span className="text-sm font-bold text-slate-700 block">
                                      {ex.variant === "regression" ? "Reg: " : ex.variant === "progression" ? "Prog: " : ""}
                                      {ex.variant === "regression" ? protocol.phases[activeWorkout.phaseIndex].exercises[i].regression :
                                       ex.variant === "progression" ? protocol.phases[activeWorkout.phaseIndex].exercises[i].progression :
                                       ex.name}
                                    </span>
                                    <div className="flex gap-2 mt-1">
                                      {(["regression", "normal", "progression"] as const).map(v => (
                                        <button key={v} onClick={() => updateExerciseLog(i, { variant: v })} className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded",
                                          ex.variant === v
                                            ? v === "regression" ? "bg-orange-100 text-orange-600" : v === "progression" ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
                                            : "bg-slate-100 text-slate-400"
                                        )}>
                                          {v === "regression" ? "Easier" : v === "progression" ? "Harder" : "Standard"}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </label>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  {protocol.phases[activeWorkout.phaseIndex].exercises[i].sets} x {protocol.phases[activeWorkout.phaseIndex].exercises[i].reps}
                                </span>
                              </div>
                              {ex.completed && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="pt-3 border-t border-slate-200">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-medium text-slate-500">Pain during exercise:</span>
                                    <span className={cn("text-xs font-bold px-2 py-0.5 rounded",
                                      ex.painScore <= 3 ? "bg-green-100 text-green-700" : ex.painScore <= 6 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                                    )}>{ex.painScore}/10</span>
                                  </div>
                                  <input type="range" min="0" max="10" step="1" className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500" value={ex.painScore} onChange={(e) => updateExerciseLog(i, { painScore: parseInt(e.target.value) })} />
                                </motion.div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3 mt-8">
                  <button onClick={() => { setShowLogForm(false); setIsSelectingPhase(false); }} className="flex-1 px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors">Cancel</button>
                  {!isSelectingPhase && (
                    <button onClick={addLog} className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100">Complete Session</button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 mt-20 print:hidden">
        <div className="container mx-auto px-4 max-w-5xl text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white"><Activity size={14} /></div>
            <span className="font-bold tracking-tight text-slate-800">RehabProtocol AI</span>
          </div>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Bridging the gap between clinical research and practical rehabilitation through advanced AI synthesis.
          </p>
          <div className="pt-8 mt-8 border-t border-slate-100 text-xs text-slate-400">
            &copy; {new Date().getFullYear()} RehabProtocol AI. All rights reserved. Not medical advice.
          </div>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: white; }
          .print\\:hidden { display: none !important; }
          #printable-protocol { border: none !important; box-shadow: none !important; }
          @page { margin: 2cm; }
        }
      `}} />
    </div>
  );
}
