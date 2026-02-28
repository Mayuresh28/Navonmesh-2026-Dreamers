"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { ProtectedRoute } from "@/lib/protected-route";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { useProfileData } from "@/lib/profile-hook";
import { Sun, Moon, Send, Sparkles } from "lucide-react";
import { useTheme } from "@/lib/theme-context";

/* ── Remedy Categories ── */
const CATEGORIES = [
  { key: "herbal",     icon: "🌿", label: "Herbal",      color: "ok" },
  { key: "yoga",       icon: "🧘", label: "Yoga",         color: "blue" },
  { key: "pranayama",  icon: "🫁", label: "Prāṇāyāma",   color: "ok" },
  { key: "diet",       icon: "🥗", label: "Āhāra (Diet)", color: "warn" },
  { key: "meditation", icon: "🕉",  label: "Dhyāna",       color: "blue" },
  { key: "lifestyle",  icon: "🌅", label: "Dinacharyā",   color: "ok" },
] as const;

type CategoryKey = (typeof CATEGORIES)[number]["key"];

/* ── Remedy Type ── */
type Remedy = {
  icon: string;
  name: string;
  sanskrit: string;
  desc: string;
  benefits: string[];
  when: string;
};

/* ── Remedies Data ── */
const REMEDIES: Record<CategoryKey, Remedy[]> = {
  herbal: [
    { icon: "🍵", name: "Ashwagandha", sanskrit: "अश्वगन्धा", desc: "Adaptogenic root that strengthens the body's stress response and promotes vitality.", benefits: ["Reduces cortisol & stress", "Boosts immunity", "Improves sleep quality"], when: "Take 300mg twice daily with warm milk" },
    { icon: "🌱", name: "Tulsi (Holy Basil)", sanskrit: "तुलसी", desc: "Sacred herb revered for its purifying and immune-boosting properties.", benefits: ["Respiratory health", "Blood sugar regulation", "Antimicrobial action"], when: "Brew 5-6 fresh leaves in hot water as tea" },
    { icon: "🫚", name: "Turmeric (Haldi)", sanskrit: "हरिद्रा", desc: "Golden spice with powerful anti-inflammatory and antioxidant curcuminoids.", benefits: ["Joint pain relief", "Heart health", "Cognitive support"], when: "1 tsp with warm milk and black pepper before bed" },
    { icon: "🌿", name: "Brahmi", sanskrit: "ब्राह्मी", desc: "Known as the 'herb of grace' — enhances memory, focus, and mental clarity.", benefits: ["Improved memory", "Reduced anxiety", "Neuroprotective"], when: "Take 250mg extract in the morning" },
    { icon: "🍃", name: "Triphala", sanskrit: "त्रिफला", desc: "Three-fruit formula (Amla, Haritaki, Bibhitaki) for complete digestive health.", benefits: ["Gentle detox", "Digestive regularity", "Antioxidant rich"], when: "1 tsp powder in warm water before bed" },
    { icon: "🌺", name: "Shatavari", sanskrit: "शतावरी", desc: "Rejuvenative tonic especially beneficial for hormonal balance and vitality.", benefits: ["Hormonal balance", "Digestive soothing", "Immune support"], when: "500mg twice daily with milk or water" },
  ],
  yoga: [
    { icon: "🧎", name: "Surya Namaskar", sanskrit: "सूर्य नमस्कार", desc: "12-pose salutation to the Sun — a complete body workout that energizes every organ.", benefits: ["Full body stretch", "Cardiovascular health", "Weight management"], when: "Perform 6-12 rounds at sunrise" },
    { icon: "🧘", name: "Shavasana", sanskrit: "शवासन", desc: "Corpse pose for deep relaxation — activates the parasympathetic nervous system.", benefits: ["Stress relief", "Lowers blood pressure", "Nervous system reset"], when: "5-15 minutes after yoga practice" },
    { icon: "💪", name: "Virabhadrasana", sanskrit: "वीरभद्रासन", desc: "Warrior poses that build strength, stability, and inner confidence.", benefits: ["Leg & core strength", "Improved balance", "Opens chest & lungs"], when: "Hold each warrior pose for 30s–1min" },
    { icon: "🌳", name: "Vrikshasana", sanskrit: "वृक्षासन", desc: "Tree pose develops single-pointed concentration and grounding stability.", benefits: ["Balance & focus", "Ankle strengthening", "Mental calm"], when: "Hold 30s each side, focus on a fixed point" },
  ],
  pranayama: [
    { icon: "👃", name: "Anulom Vilom", sanskrit: "अनुलोम विलोम", desc: "Alternate nostril breathing that balances the left and right energy channels (Ida & Pingala).", benefits: ["Calms the mind", "Balances doshas", "Improves lung capacity"], when: "10-15 minutes, morning & evening" },
    { icon: "🔥", name: "Kapālabhāti", sanskrit: "कपालभाति", desc: "Skull-shining breath — rapid exhalations that detoxify and energize.", benefits: ["Detoxification", "Increased metabolism", "Mental clarity"], when: "3 rounds of 30 breaths, on empty stomach" },
    { icon: "🐝", name: "Bhramari", sanskrit: "भ्रामरी", desc: "Humming bee breath for instant calm — vibrations soothe the vagus nerve.", benefits: ["Anxiety reduction", "Better sleep", "Lowers blood pressure"], when: "5-10 rounds, especially before bed" },
    { icon: "❄️", name: "Sheetali", sanskrit: "शीतली", desc: "Cooling breath — roll the tongue and inhale to cool the body and calm Pitta.", benefits: ["Reduces body heat", "Calms anger", "Quenches thirst"], when: "10 rounds during hot weather or after meals" },
  ],
  diet: [
    { icon: "🍯", name: "Golden Milk", sanskrit: "हल्दी दूध", desc: "Turmeric-infused warm milk with black pepper, cinnamon, and ghee — the ultimate Ayurvedic nightcap.", benefits: ["Anti-inflammatory", "Deep sleep support", "Joint health"], when: "One cup 30 minutes before bed" },
    { icon: "🥣", name: "Kitchari", sanskrit: "खिचड़ी", desc: "Nourishing rice-lentil porridge — the ultimate Ayurvedic cleansing food, easy to digest.", benefits: ["Digestive reset", "Balanced nutrition", "Gentle detox"], when: "As a mono-diet for 3–7 days during cleanse" },
    { icon: "🍵", name: "CCF Tea", sanskrit: "जीरक चाय", desc: "Cumin-Coriander-Fennel tea — a tri-spice digestive tonic for all doshas.", benefits: ["Bloating relief", "Appetite improvement", "Dosha balance"], when: "Sip throughout the day, esp. after meals" },
    { icon: "🥛", name: "Warm Water + Lemon", sanskrit: "उष्ण जल", desc: "Start your day with warm lemon water to ignite Agni (digestive fire).", benefits: ["Boost metabolism", "Hydration", "Toxin flushing"], when: "First thing in the morning, before food" },
  ],
  meditation: [
    { icon: "🕯", name: "Trāṭaka", sanskrit: "त्राटक", desc: "Candle-gazing meditation — strengthens concentration and cleanses the eyes.", benefits: ["Sharper focus", "Eye health", "Willpower"], when: "Gaze steadily for 2-5 minutes, then close eyes" },
    { icon: "📿", name: "Japa Meditation", sanskrit: "जप ध्यान", desc: "Mantra repetition using a mala (108 beads) — anchors the mind in sacred vibration.", benefits: ["Mental stillness", "Spiritual growth", "Reduced anxiety"], when: "108 repetitions, morning & evening" },
    { icon: "🧘", name: "Yoga Nidra", sanskrit: "योग निद्रा", desc: "Guided 'yogic sleep' — systematic relaxation that reaches the subconscious mind.", benefits: ["Deep restoration", "Trauma healing", "Improved sleep cycles"], when: "20–45 minute session, lying down" },
    { icon: "🌸", name: "Loving-Kindness", sanskrit: "मैत्री भावना", desc: "Heart-centered meditation radiating compassion to self, loved ones, and all beings.", benefits: ["Emotional balance", "Empathy growth", "Reduced anger"], when: "10-20 minutes daily, seated comfortably" },
  ],
  lifestyle: [
    { icon: "🌅", name: "Brahma Muhurta", sanskrit: "ब्रह्म मुहूर्त", desc: "Wake up 96 minutes before sunrise — the most sattvic (pure) time for spiritual practice.", benefits: ["Mental clarity", "Aligned circadian rhythm", "Spiritual receptivity"], when: "Approximately 4:30–5:30 AM" },
    { icon: "👅", name: "Jihwa Prakshalana", sanskrit: "जिह्वा प्रक्षालन", desc: "Tongue scraping removes overnight bacterial buildup and stimulates digestion.", benefits: ["Oral health", "Better taste", "Toxin removal"], when: "Every morning, before drinking water" },
    { icon: "🫒", name: "Abhyanga", sanskrit: "अभ्यंग", desc: "Self-massage with warm sesame or coconut oil — nourishes skin, calms Vata, and grounds the nervous system.", benefits: ["Joint flexibility", "Skin nourishment", "Deep calm"], when: "15-20 minutes before morning bath" },
    { icon: "🌙", name: "Early Bedtime", sanskrit: "रात्रि चर्या", desc: "Sleep by 10 PM to align with Kapha time — the body's natural window for deep restorative rest.", benefits: ["Hormonal balance", "Weight management", "Mental freshness"], when: "Wind down by 9:30 PM, sleep by 10:00 PM" },
  ],
};

/* ── Stagger animation ── */
const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.06 } } },
  item: {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const } },
  },
};

/* ═══════ Page ═══════ */
export default function RemediesPage() {
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  const { profile } = useProfileData(user?.uid);
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("herbal");
  const [diseaseInput, setDiseaseInput] = useState("");
  const [queriedDisease, setQueriedDisease] = useState<string | null>(null);
  const [aiRemedies, setAiRemedies] = useState<Remedy[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendDisease = async () => {
    if (!diseaseInput.trim() || isLoading) return;
    
    const userMessage = diseaseInput.trim();
    setQueriedDisease(userMessage);
    setDiseaseInput("");
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/remedies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ disease: userMessage }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.remedies) {
        setAiRemedies(data.remedies);
      } else {
        setAiRemedies([]);
        alert(data.error || 'Failed to get recommendations');
      }
    } catch (error) {
      console.error('Error fetching remedies:', error);
      setAiRemedies([]);
      alert('Unable to connect to the remedy service. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /* Dosha-based recommendation note */
  const doshaNote = useMemo(() => {
    if (!profile) return null;
    if (profile.bmi < 18.5) return { dosha: "Vāta", tip: "Focus on grounding, warm, nourishing remedies." };
    if (profile.bmi < 25)   return { dosha: "Balanced", tip: "Maintain equilibrium with seasonal adjustments." };
    if (profile.bmi < 30)   return { dosha: "Kapha", tip: "Prioritize stimulating, warming, and light remedies." };
    return { dosha: "Kapha", tip: "Focus on metabolism-boosting herbs and active practices." };
  }, [profile]);

  const activeRemedies = REMEDIES[activeCategory];

  return (
    <ProtectedRoute>
      <div className="min-h-screen pb-24" style={{ background: "var(--bg-base)" }}>

        {/* ── EKG Header Strip ── */}
        <div className="ekg-strip" aria-hidden="true">
          <svg className="ekg-mover" viewBox="0 0 600 44" preserveAspectRatio="none" fill="none" stroke="var(--ekg-color)" strokeWidth="1.2">
            <polyline points="0,22 40,22 50,22 55,10 60,34 65,18 70,26 75,22 120,22 160,22 170,22 175,10 180,34 185,18 190,26 195,22 240,22 280,22 290,22 295,10 300,34 305,18 310,26 315,22 360,22 400,22 410,22 415,10 420,34 425,18 430,26 435,22 480,22 520,22 530,22 535,10 540,34 545,18 550,26 555,22 600,22" />
          </svg>
        </div>

        {/* ── Top Bar ── */}
        <header className="prana-topbar">
          <div className="flex items-baseline gap-2">
            <span style={{
              fontFamily: "var(--font-playfair, 'Playfair Display', serif)",
              fontSize: "22px", fontWeight: 700, letterSpacing: "1px",
              background: "linear-gradient(135deg, var(--teal), var(--cyan))",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              Dhanvantari
            </span>
            <span style={{ fontSize: "8px", letterSpacing: "3px", color: "var(--text-faint)", textTransform: "uppercase" }}>
              Remedies
            </span>
          </div>
          <button onClick={toggle}
            className="w-8.5 h-8.5 rounded-full flex items-center justify-center transition-all"
            style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
            {theme === "dark"
              ? <Sun className="w-3.5 h-3.5" style={{ color: "var(--warn-text)" }} />
              : <Moon className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />}
          </button>
        </header>

        {/* ── Hero Banner ── */}
        <section className="remedy-hero">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="remedy-hero-inner"
          >
            <span style={{ fontSize: "48px", display: "block", marginBottom: "8px" }}>🪷</span>
            <h1 className="remedy-hero-title">Ayurvedic Remedies</h1>
            <p className="remedy-hero-sub">
              Ancient wisdom for modern wellness — personalized healing rooted in the Vedas
            </p>
            {doshaNote && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="remedy-dosha-badge"
              >
                <span style={{ fontWeight: 700 }}>{doshaNote.dosha} Prakriti</span>
                <span style={{ opacity: 0.7, fontSize: "12px" }}> — {doshaNote.tip}</span>
              </motion.div>
            )}
          </motion.div>
        </section>

        {/* ── Disease Chat Section ── */}
        <section className="px-5 pt-4 pb-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{
              background: "var(--bg-raised)",
              border: "1px solid var(--border)",
              borderRadius: "16px",
              padding: "20px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)"
            }}
          >
            {/* Chat Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Sparkles className="w-5 h-5" style={{ color: "var(--teal)" }} />
                <h2 style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "var(--text-base)",
                  letterSpacing: "0.3px"
                }}>
                  Ask About a Condition
                </h2>
              </div>
              {queriedDisease && (
                <button
                  onClick={() => {
                    setQueriedDisease(null);
                    setAiRemedies([]);
                  }}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "8px",
                    background: "var(--bg-base)",
                    border: "1px solid var(--border)",
                    color: "var(--text-muted)",
                    fontSize: "12px",
                    cursor: "pointer"
                  }}
                >
                  Clear
                </button>
              )}
            </div>

            {/* Current Query Display */}
            {queriedDisease && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, var(--teal), var(--cyan))",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: 600,
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                <span style={{ fontSize: "16px" }}>🔍</span>
                <span>Showing remedies for: {queriedDisease}</span>
              </motion.div>
            )}

            {/* Loading indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "16px",
                  padding: "12px",
                  borderRadius: "10px",
                  background: "var(--bg-base)",
                  color: "var(--text-muted)",
                  fontSize: "14px"
                }}
              >
                <div style={{
                  width: "16px",
                  height: "16px",
                  border: "2px solid var(--border)",
                  borderTopColor: "var(--teal)",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite"
                }} />
                <span>Consulting Ayurvedic wisdom...</span>
              </motion.div>
            )}

            {/* Input Box */}
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                type="text"
                value={diseaseInput}
                onChange={(e) => setDiseaseInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendDisease()}
                placeholder="Enter disease or condition (e.g., Diabetes, Stress, Insomnia)..."
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                  background: "var(--bg-base)",
                  color: "var(--text-base)",
                  fontSize: "14px",
                  outline: "none",
                  transition: "border-color 0.2s"
                }}
                onFocus={(e) => e.target.style.borderColor = "var(--teal)"}
                onBlur={(e) => e.target.style.borderColor = "var(--border)"}
              />
              <button
                onClick={handleSendDisease}
                disabled={!diseaseInput.trim() || isLoading}
                style={{
                  padding: "12px 16px",
                  borderRadius: "10px",
                  background: (diseaseInput.trim() && !isLoading)
                    ? "linear-gradient(135deg, var(--teal), var(--cyan))" 
                    : "var(--bg-raised)",
                  color: (diseaseInput.trim() && !isLoading) ? "white" : "var(--text-muted)",
                  border: "1px solid var(--border)",
                  cursor: (diseaseInput.trim() && !isLoading) ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                  opacity: (diseaseInput.trim() && !isLoading) ? 1 : 0.5
                }}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Suggestions */}
            {!queriedDisease && (
              <div style={{ marginTop: "12px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {["Diabetes", "Hypertension", "Stress", "Insomnia", "Arthritis", "Migraine"].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setDiseaseInput(suggestion)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "20px",
                      background: "var(--bg-base)",
                      border: "1px solid var(--border)",
                      color: "var(--text-muted)",
                      fontSize: "12px",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--teal)";
                      e.currentTarget.style.color = "var(--teal)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.color = "var(--text-muted)";
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </section>

        {/* ── AI-Generated Remedies Section ── */}
        {aiRemedies.length > 0 && (
          <section className="px-5 pt-4 pb-2">
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <motion.div variants={stagger.item} className="dash-sec" style={{ marginTop: "12px" }}>
                  <div className="dash-sec-title">
                    ✨ <em>AI-Powered Remedies for {queriedDisease}</em>
                  </div>
                  <div className="dash-sec-tag">{aiRemedies.length} personalized remedies</div>
                </motion.div>

                <div className="remedy-grid" style={{ marginTop: "16px" }}>
                  {aiRemedies.map((remedy, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1, duration: 0.4 }}
                      className="remedy-card"
                    >
                      <div className="remedy-card-head">
                        <span className="remedy-card-icon">{remedy.icon}</span>
                        <div>
                          <div className="remedy-card-name">{remedy.name}</div>
                          <div className="remedy-card-sanskrit">{remedy.sanskrit}</div>
                        </div>
                      </div>

                      <p className="remedy-card-desc">{remedy.desc}</p>

                      <div className="remedy-card-benefits">
                        {remedy.benefits?.map((b: string, j: number) => (
                          <span key={j} className="remedy-benefit-pill">✦ {b}</span>
                        ))}
                      </div>

                      <div className="remedy-card-when">
                        <span style={{ fontWeight: 700, color: "var(--teal)", marginRight: "4px" }}>↻</span>
                        {remedy.when}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </section>
        )}

        {/* ── Category Tabs ── */}
        {!queriedDisease && (
          <div className="remedy-tabs-wrap">
            <div className="remedy-tabs">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`remedy-tab ${activeCategory === cat.key ? "active" : ""}`}
                >
                  <span style={{ fontSize: "16px" }}>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Remedy Cards ── */}
        {!queriedDisease && (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              variants={stagger.container}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              className="px-5 pb-6"
            >
            <motion.div variants={stagger.item} className="dash-sec" style={{ marginTop: "12px" }}>
              <div className="dash-sec-title">
                {CATEGORIES.find((c) => c.key === activeCategory)?.icon}{" "}
                <em>{CATEGORIES.find((c) => c.key === activeCategory)?.label}</em>
              </div>
              <div className="dash-sec-tag">{activeRemedies.length} remedies</div>
            </motion.div>

            <div className="remedy-grid">
              {activeRemedies.map((r) => (
                <motion.div
                  key={r.name}
                  variants={stagger.item}
                  className="remedy-card"
                >
                  <div className="remedy-card-head">
                    <span className="remedy-card-icon">{r.icon}</span>
                    <div>
                      <div className="remedy-card-name">{r.name}</div>
                      <div className="remedy-card-sanskrit">{r.sanskrit}</div>
                    </div>
                  </div>

                  <p className="remedy-card-desc">{r.desc}</p>

                  <div className="remedy-card-benefits">
                    {r.benefits.map((b, j) => (
                      <span key={j} className="remedy-benefit-pill">✦ {b}</span>
                    ))}
                  </div>

                  <div className="remedy-card-when">
                    <span style={{ fontWeight: 700, color: "var(--teal)", marginRight: "4px" }}>↻</span>
                    {r.when}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* ── Vedic Wisdom Banner ── */}
            <motion.div variants={stagger.item} className="mantra-banner mt-6">
              <span style={{ fontSize: "36px", display: "block", marginBottom: "10px" }}>🪷</span>
              <div className="mantra-text">
                &ldquo;Rogāstu doṣa-vaiṣamya, doṣa-sāmyam arogatā&rdquo;
              </div>
              <div className="mantra-trans-text">
                Disease is imbalance of the doshas; health is their equilibrium
              </div>
              <div className="mantra-src-text">
                — Suśruta Saṃhitā
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
        )}

        <BottomNav />
      </div>
    </ProtectedRoute>
  );
}
