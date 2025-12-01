"use client";

import React, { useEffect, useMemo, useState } from "react";

// Nieuwe interessegebieden
const INTERESTS = [
  { key: "ontwerp", label: "Ontwerp" },
  { key: "techniek", label: "Techniek" },
  { key: "kwaliteit", label: "Kwaliteit" },
  { key: "ethiek", label: "Ethiek" },
  { key: "kostenefficient", label: "Kostenefficient" },
  { key: "samenwerking", label: "Samenwerking" },
  { key: "innovatie", label: "Innovatie" },
  { key: "digitalisering", label: "Digitalisering" },
  { key: "leiderschap", label: "Leiderschap" },
  { key: "organisatie", label: "Organisatie" },
];

// Handige lookup-tabel op key
const INTEREST_MAP = INTERESTS.reduce((acc, it) => {
  acc[it.key] = it;
  return acc;
}, {});

// Keys voor localStorage
const STORAGE_KEY = "lis-keuzetool-state-v2";
const HISTORY_KEY = "lis-keuzetool-history-v2";

// Helper: verwijdert stuk tussen haakjes, incl. haakjes zelf
function stripParens(label) {
  return (label || "").replace(/\s*\([^)]*\)\s*/g, " ").trim();
}

// Helper: maakt van labels nette URL-slugs
function slugifyModuleLabel(label) {
  return (label || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // verwijder accenten
    .replace(/[^a-z0-9]+/g, "-") // vervang alles dat geen letter/cijfer is
    .replace(/^-+|-+$/g, ""); // trim streepjes
}

// Alle modules met koppeling naar interessegebieden
const ALL_MODULES = [
  {
    key: "designForMfg",
    label: "Design for Manufacturing",
    interests: ["ontwerp", "innovatie", "digitalisering"],
    desc: "Leer ontwerpen die productieproblemen voorkomen: maakbaarheid begint bij Design for Manufacturability.",
  },
  {
    key: "teamwork",
    label: "Effectief samenwerken in technische projecten",
    interests: ["kwaliteit", "kostenefficient", "samenwerking", "digitalisering"],
    desc: "Breng techniek en communicatie samen: leer hoe je een nieuw product succesvol introduceert met stakeholderanalyse en Scrum.",
  },
  {
    key: "feedback",
    label: "Feedbackgedreven ontwikkeling",
    interests: ["ontwerp", "kwaliteit", "samenwerking", "innovatie", "leiderschap"],
    desc: "Versnel innovatie: leer rapid prototyping met 3D-printing, simulaties en slimme teststrategieën.",
  },
  {
    key: "ip",
    label: "Intellectueel eigendom",
    interests: ["techniek", "ethiek", "kostenefficient"],
    desc: "Bescherm jouw ideeën: leer hoe intellectueel eigendom werkt en wat het voor technici betekent.",
  },
  {
    key: "scale",
    label: "Ontwerp voor schaalbaarheid",
    interests: ["ontwerp", "techniek", "innovatie", "leiderschap"],
    desc: "Leer hoe je processen veilig en efficiënt opschaalt: van risicoanalyse tot audit en readiness assessment.",
  },
  {
    key: "iso",
    label: "ISO 9000 en CE",
    interests: ["ontwerp", "kostenefficient"],
    desc: "Beheers kwaliteit en veiligheid: leer ISO 9001 en CE-markering toepassen in de praktijk.",
  },
  {
    key: "costControl",
    label: "Kostenbeheersing in productie",
    interests: ["ontwerp", "kostenefficient", "samenwerking", "leiderschap"],
    desc: "Ontdek hoe je echte productkosten berekent en optimaliseert met COGA en TCO.",
  },
  {
    key: "materials",
    label: "Technische materiaalkeuzes",
    interests: ["ontwerp", "kostenefficient"],
    desc: "Kies het juiste materiaal en ontwerp slimme oplossingen: van eigenschappen tot circulair gebruik.",
  },
  {
    key: "deadlines",
    label: "Werken met strakke deadlines",
    interests: ["kostenefficient", "samenwerking", "leiderschap"],
    desc: "Word wendbaar en efficiënt: combineer Agile, Lean en risicobeheersing voor succesvolle projecten.",
  },
  {
    key: "validation",
    label: "Procesvalidatie en kwaliteitsborging",
    interests: ["kwaliteit", "innovatie", "organisatie"],
    desc: "Beheers proceszekerheid: van validatie tot FMEA en SPC voor betrouwbare productie.",
  },
  {
    key: "cncAuto",
    label: "CNC automation",
    interests: ["techniek", "digitalisering", "organisatie"],
    desc: "Automatiseer CNC-productie: leer robotbelading en nulpuntspansystemen voor maximale efficiëntie.",
  },
  {
    key: "cmm",
    label: "CMM meten en controleren",
    interests: ["techniek", "kwaliteit", "organisatie"],
    desc: "Meet en verbeter met precisie: leer werken met CMM voor betrouwbare kwaliteitscontrole.",
  },
  {
    key: "ncProg",
    label: "NC-programmeren",
    interests: ["techniek"],
    desc: "Programmeer, stel in en controleer: leer CNC-techniek van tekening tot foutloze productie.",
  },
  {
    key: "maakbaarheid",
    label: "Maakbaarheid",
    interests: ["ontwerp", "kostenefficient"],
    desc: "Ontwerp met maakbaarheid in gedachten: beperk fouten en verspillingen in het productieproces.",
  },
  {
    key: "turnBasic",
    label: "Basiscursus draaien",
    interests: ["ontwerp", "techniek"],
    desc: "Leer de basis van draaien: instellingen, gereedschapkeuze en veilige machinebediening.",
  },
  {
    key: "turnAdvanced",
    label: "Gevorderde cursus draaien",
    interests: ["ontwerp", "techniek"],
    desc: "Verdiep je in complex draaiwerk, toleranties en efficiënte bewerkingsstrategieën.",
  },
  {
    key: "millBasic",
    label: "Basiscursus frezen",
    interests: ["ontwerp", "techniek"],
    desc: "Maak de stap naar frezen: van tekening naar nauwkeurige freesbewerkingen.",
  },
  {
    key: "millAdvanced",
    label: "Gevorderde cursus frezen",
    interests: ["ontwerp", "techniek"],
    desc: "Leer geavanceerde freesstrategieën, 3D-bewerkingen en optimale procesinstellingen.",
  },
];

const LIS_BASE =
  "https://www.lis.nl/lis-voor-werkenden-maatwerkprogramma-s-hightechsector/programma-aanbod/";
const LIS_PERSONAL_BASE = LIS_BASE + "persoonlijk-advies-2/";

// Bouw de filter-URL, zelfde structuur als v1, andere pad
function makeLisFilterUrl(interests, noModules) {
  const picked = Array.isArray(interests) ? interests : [];

  const programmeSlugs = picked
    .map((code) => INTEREST_MAP[code])
    .filter(Boolean)
    .map((i) => slugifyModuleLabel(i.label));

  const moduleSlugs = (noModules || []).map((m) =>
    slugifyModuleLabel(
      typeof m === "string" ? stripParens(m) : stripParens(m.label)
    )
  );

  if (programmeSlugs.length === 0 && moduleSlugs.length === 0) {
    return LIS_BASE;
  }

  const parts = [];
  if (programmeSlugs.length) {
    parts.push("programma-s:" + programmeSlugs.join(","));
  }
  if (moduleSlugs.length) {
    parts.push("losse-modules:" + moduleSlugs.join(","));
  }

  return `${LIS_PERSONAL_BASE}?filter=${parts.join(";")}`;
}

function encodeAdviceForUrl(obj) {
  try {
    return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
  } catch {
    return "";
  }
}

function decodeAdviceFromUrl(str) {
  try {
    return JSON.parse(decodeURIComponent(escape(atob(str))));
  } catch {
    return null;
  }
}

export default function LiSKeuzetool() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [background, setBackground] = useState("");
  const [role, setRole] = useState("");
  const [interests, setInterests] = useState([]);
  const [competences, setCompetences] = useState({});
  const [wantsContact, setWantsContact] = useState(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [adviceHistory, setAdviceHistory] = useState([]);
  const [isComposing, setIsComposing] = useState(false);
  const [dots, setDots] = useState(0);

  const today = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString("nl-NL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.name) setName(saved.name);
        if (saved.email) setEmail(saved.email);
        if (saved.background) setBackground(saved.background);
        if (saved.role) setRole(saved.role);
        if (Array.isArray(saved.interests)) setInterests(saved.interests);
      }
      const hist = localStorage.getItem(HISTORY_KEY);
      if (hist) setAdviceHistory(JSON.parse(hist));
    } catch {}

    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("advice");
    if (encoded) {
      const data = decodeAdviceFromUrl(encoded);
      if (data) {
        setName(data.name || "");
        setEmail(data.email || "");
        setBackground(data.background || "");
        setRole(data.role || "");
        if (Array.isArray(data.interests)) setInterests(data.interests);
        if (Array.isArray(data.modules)) {
          const map = {};
          data.modules.forEach((m) => {
            if (m && m.key) map[m.key] = m.answer;
          });
          setCompetences(map);
        }
        setWantsContact(
          typeof data.wantsContact === "boolean" ? data.wantsContact : null
        );
        setStep(4);
      }
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ name, email, background, role, interests })
      );
    } catch {}
  }, [name, email, background, role, interests]);

  useEffect(() => {
    if (!isComposing) return;
    const id = setInterval(() => {
      setDots((d) => (d + 1) % 4);
    }, 500);
    return () => clearInterval(id);
  }, [isComposing]);

  const composingText = useMemo(() => {
    if (!isComposing) return "";
    const count = dots === 0 ? 1 : dots;
    const base = "Even geduld, je advies wordt samengesteld";
    return base + ".".repeat(count);
  }, [isComposing, dots]);

  const filteredModules = useMemo(() => {
    const picked = Array.isArray(interests) ? interests : [];
    if (picked.length === 0) return [];
    return ALL_MODULES.filter(
      (m) =>
        Array.isArray(m.interests) &&
        m.interests.some((i) => picked.includes(i))
    );
  }, [interests]);

  const handledModulesYes = useMemo(
    () => filteredModules.filter((m) => competences[m.key] === true),
    [filteredModules, competences]
  );

  const handledModulesNo = useMemo(
    () => filteredModules.filter((m) => competences[m.key] === false),
    [filteredModules, competences]
  );

  const canGoStep1 = useMemo(
    () => name.trim() && /.+@.+\..+/.test(email),
    [name, email]
  );

  const canGoStep2 = useMemo(
    () => filteredModules.length > 0,
    [filteredModules]
  );

  const canShowAdvice = useMemo(() => wantsContact !== null, [wantsContact]);

  function toggleInterest(code) {
    setInterests((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      if (list.includes(code)) return list.filter((c) => c !== code);
      if (list.length >= 3) return list; // max 3 interesses
      return [...list, code];
    });
  }

  function setCompetenceFor(moduleKey, value) {
    setCompetences((p) => ({ ...p, [moduleKey]: value }));
  }

  function toStep(n) {
    setStep(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const dynamicLisUrl = useMemo(
    () => makeLisFilterUrl(interests, handledModulesNo),
    [interests, handledModulesNo]
  );

  function buildAdviceText() {
    const lines = [];

    lines.push("Persoonlijk Advies");
    lines.push("");
    lines.push("1. Persoonlijke gegevens");
    lines.push(`• Naam: ${name}`);
    lines.push(`• Datum advies: ${today}`);
    if (background.trim()) {
      lines.push(`• Achtergrond: ${background.trim()}`);
    }
    lines.push(`• Wat is je huidige functie: ${role}`);
    lines.push("");
    lines.push("2. Doorgroei kansen");

    if (Array.isArray(interests) && interests.length > 0) {
      // alfabetisch op label
      const sortedInterests = [...interests].sort((a, b) => {
        const la = INTEREST_MAP[a]?.label || "";
        const lb = INTEREST_MAP[b]?.label || "";
        return la.localeCompare(lb, "nl");
      });

      sortedInterests.forEach((code) => {
        const interest = INTEREST_MAP[code];
        if (!interest) return;
        lines.push("");
        lines.push(`Binnen het interessegebied: ${interest.label}`);

        const yesForInterest = handledModulesYes.filter(
          (m) => Array.isArray(m.interests) && m.interests.includes(code)
        );
        const noForInterest = handledModulesNo.filter(
          (m) => Array.isArray(m.interests) && m.interests.includes(code)
        );

        lines.push("Ik beheers:");
        if (yesForInterest.length > 0) {
          yesForInterest.forEach((m) =>
            lines.push(`  - ${stripParens(m.label)}`)
          );
        } else {
          lines.push(
            "  - (geen ingevulde JA-antwoorden binnen dit interessegebied)"
          );
        }

        lines.push("Ik wil leren:");
        if (noForInterest.length > 0) {
          noForInterest.forEach((m) =>
            lines.push(`  - ${stripParens(m.label)}`)
          );
        } else {
          lines.push(
            "  - (geen ingevulde NEE-antwoorden binnen dit interessegebied)"
          );
        }
      });
    } else {
      lines.push("Er zijn geen interessegebieden geselecteerd in stap 1.");
    }

    lines.push("");
    lines.push("3. Link");
    lines.push(`• ${dynamicLisUrl}`);

    return lines.join("\n");
  }

  function buildAdviceObject() {
    return {
      name,
      email,
      background: background.trim() || null,
      role,
      interests,
      modules: filteredModules.map((m) => ({
        key: m.key,
        label: m.label,
        answer: competences[m.key],
      })),
      wantsContact,
      adviceDate: today,
      advicePlain: buildAdviceText(),
    };
  }

  function buildAdviceHtml() {
    const clean = (s) => (s || "").replace(/</g, "&lt;");
    const url = makeLisFilterUrl(interests, handledModulesNo);

    const blocks =
      Array.isArray(interests) && interests.length > 0
        ? [...interests]
            .sort((a, b) => {
              const la = INTEREST_MAP[a]?.label || "";
              const lb = INTEREST_MAP[b]?.label || "";
              return la.localeCompare(lb, "nl");
            })
            .map((code) => {
              const interest = INTEREST_MAP[code];
              if (!interest) return "";

              const yesForInterest = handledModulesYes.filter(
                (m) => Array.isArray(m.interests) && m.interests.includes(code)
              );
              const noForInterest = handledModulesNo.filter(
                (m) => Array.isArray(m.interests) && m.interests.includes(code)
              );

              const yesHtml =
                yesForInterest.length > 0
                  ? yesForInterest
                      .map(
                        (m) => `<li>${clean(stripParens(m.label))}</li>`
                      )
                      .join("")
                  : '<li style="color:#666">(geen ingevulde JA-antwoorden binnen dit interessegebied)</li>';

              const noHtml =
                noForInterest.length > 0
                  ? noForInterest
                      .map(
                        (m) => `<li>${clean(stripParens(m.label))}</li>`
                      )
                      .join("")
                  : '<li style="color:#666">(geen ingevulde NEE-antwoorden binnen dit interessegebied)</li>';

              return `
        <div style="margin-top:16px; padding:12px; border:1px solid #e5e7eb; border-radius:12px; background:#ffffff;">
          <p style="margin:0 0 4px 0; font-size:13px; color:#4b5563;">Binnen het interessegebied:</p>
          <p style="margin:0 0 8px 0; font-weight:600; color:#111827;">${clean(
            interest.label
          )}</p>
          <div style="display:flex; gap:24px; flex-wrap:wrap;">
            <div style="min-width:180px;">
              <p style="margin:0 0 4px 0; font-weight:500;">Ik beheers</p>
              <ul style="margin:0 0 8px 20px; padding:0;">${yesHtml}</ul>
            </div>
            <div style="min-width:180px;">
              <p style="margin:0 0 4px 0; font-weight:500;">Ik wil leren</p>
              <ul style="margin:0 0 8px 20px; padding:0;">${noHtml}</ul>
            </div>
          </div>
        </div>`;
            })
            .join("")
        : '<p style="margin:4px 0; color:#666;">Er zijn geen interessegebieden geselecteerd in stap 1.</p>';

    return `
      <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color:#111;">
        <h2 style="margin:0 0 12px 0; font-size:20px;">Persoonlijk Advies</h2>
        <h3 style="margin:16px 0 8px 0; font-size:16px;">1. Persoonlijke gegevens</h3>
        <p style="margin:4px 0;">Naam: <strong>${clean(name)}</strong></p>
        <p style="margin:4px 0;">Datum advies: <strong>${clean(today)}</strong></p>
        ${
          background.trim()
            ? `<p style="margin:4px 0;">Achtergrond: ${clean(background)}</p>`
            : ""
        }
        <p style="margin:4px 0;">Wat is je huidige functie: <strong>${clean(
          role
        )}</strong></p>
        <h3 style="margin:16px 0 8px 0; font-size:16px;">2. Doorgroei kansen</h3>
        ${blocks}
        <p style="margin:16px 0;">Bekijk het voor u geselecteerde aanbod: <a href="${url}" target="_blank" rel="noreferrer">Bekijk het voor u geselecteerde aanbod</a></p>
        <hr style="margin:24px 0; border:none; border-top:1px solid #eee;"/>
        <p style="margin:0 0 4px 0; font-weight:600;">Leidse instrumentmakers School</p>
        <p style="margin:0;">Einsteinweg 61<br/>2333 CC Leiden<br/>Nederland</p>
        <p style="margin:8px 0 0 0;">071-5681168<br/>info@lis.nl<br/><a href="https://www.lis.nl" target="_blank" rel="noreferrer">www.lis.nl</a></p>
      </div>`;
  }

  function buildAdviceHtmlForRob() {
    const html = buildAdviceHtml();
    const contact =
      wantsContact === true
        ? "Ja, graag"
        : wantsContact === false
        ? "Nee, niet nodig"
        : "Onbekend";
    return html.replace(
      "</div>",
      `<p style="margin-top:12px;font-size:14px;">Persoonlijk contact gewenst: <strong>${contact}</strong></p></div>`
    );
  }

  async function sendToRob() {
    setIsComposing(true);
    setStatusMsg("");
    const adviceObj = buildAdviceObject();
    try {
      const res = await fetch("/api/send-lis-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...adviceObj, adviceHtml: buildAdviceHtmlForRob() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatusMsg(
          `Verzenden mislukt: ${data?.error || res.statusText} (${data?.code || res.status})`
        );
        return true;
      }
      setStatusMsg("Uw advies is opgeslagen");
      return true;
    } catch (e) {
      setStatusMsg(`Verzenden mislukt (network): ${e.message}`);
      return true;
    } finally {
      setIsComposing(false);
      setDots(0);
    }
  }

  async function emailVisitor() {
    const adviceObj = buildAdviceObject();
    const html = buildAdviceHtml();
    setStatusMsg("Advies mailen naar bezoeker…");
    try {
      const res = await fetch("/api/send-lis-advice-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email,
          subject: `Uw persoonlijk LiS-advies – ${adviceObj.name || "Bezoeker"}`,
          html,
          text: adviceObj.advicePlain,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatusMsg(
          `Mailen naar bezoeker mislukt: ${data?.error || res.statusText}`
        );
        return;
      }
      setStatusMsg("Advies gemaild naar jouw e-mailadres.");
    } catch (e) {
      setStatusMsg(`Mailen naar bezoeker mislukt (network): ${e.message}`);
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#3489c2" }}>
      <header className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-3xl font-bold text-black">
          Keuzetool LiS voor Werkenden
        </h1>
        <p className="mt-2 text-white">
          Beantwoord enkele vragen en ontvang een persoonlijk advies met modules
          van de Leidse instrumentmakers School.
        </p>
        <div className="mt-4 h-2 bg-white/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
        {!!statusMsg && (
          <p className="text-sm mt-2 text-white" role="status">
            {statusMsg}
          </p>
        )}
        {isComposing && (
          <p className="text-sm mt-1 text-white">{composingText}</p>
        )}
      </header>

      <main className="mx-auto max-w-4xl bg-white rounded-2xl shadow-lg p-8">
        {/* Stap 1 */}
        {step === 1 && (
          <section>
            <h2 className="text-xl font-semibold text-black mb-2">
              1. Persoonlijke gegevens
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-black">
                  Naam <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Voornaam Achternaam"
                  className="mt-1 border rounded-lg p-2"
                  required
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-black">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="naam@voorbeeld.nl"
                  className="mt-1 border rounded-lg p-2"
                  required
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-black">
                  Datum advies
                </label>
                <input
                  type="text"
                  value={today}
                  readOnly
                  className="mt-1 border rounded-lg p-2 bg-gray-50"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-black">
                  Wat is je huidige functie?
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Bijv. Productie-operator"
                  className="mt-1 border rounded-lg p-2"
                />
              </div>
              <div className="md:col-span-2 flex flex-col">
                <label className="text-sm font-medium text-black">
                  Achtergrond
                  <span className="text-gray-500 font-normal">
                    {" "}(optioneel, max. 250 woorden)
                  </span>
                </label>
                <textarea
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                  placeholder="Vertel iets over je achtergrond, sector/branche, ervaring, etc."
                  className="mt-1 border rounded-lg p-2 min-h-[120px]"
                  maxLength={2000}
                />
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm font-medium text-black mb-2">
                Maak een keuze uit maximaal 3 interessegebieden:
              </p>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleInterest(key)}
                    className={`px-3 py-2 rounded-2xl border text-sm transition-colors duration-300 ${
                      Array.isArray(interests) && interests.includes(key)
                        ? "bg-[#3489c2] text-white border-[#3489c2] hover:bg-black"
                        : "bg-white border-gray-300 hover:bg-black hover:text-white"
                    }`}
                    disabled={
                      !Array.isArray(interests)
                        ? false
                        : !interests.includes(key) && interests.length >= 3
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 flex items-center gap-3">
              <button
                className={`px-5 py-2 rounded-xl text-white shadow transition-colors duration-300 ${
                  canGoStep1
                    ? "bg-[#3489c2] hover:bg-black"
                    : "bg-[#3489c2]/50 cursor-not-allowed"
                }`}
                disabled={!canGoStep1}
                onClick={() => toStep(2)}
              >
                Start keuzetool
              </button>
            </div>
          </section>
        )}

        {/* Stap 2 */}
        {step === 2 && (
          <section>
            <h2 className="text-xl font-semibold text-black mb-2">
              2. Startpunt keuzetool
            </h2>
            <p className="text-gray-600 mb-4">
              Geef per onderwerp aan of je er ervaring mee hebt.
            </p>
            {filteredModules.length === 0 && (
              <p className="text-gray-600">
                Geen modules om te tonen. Ga terug en kies één of meer
                interessegebieden.
              </p>
            )}
            <ul className="space-y-3">
              {filteredModules.map((m) => (
                <li
                  key={m.key}
                  className="flex items-center justify-between gap-4 border rounded-xl p-3"
                >
                  <div>
                    <p className="font-medium text-black">
                      {stripParens(m.label)}
                    </p>
                    <p className="text-xs text-gray-500">{m.desc}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCompetenceFor(m.key, true)}
                      className={`px-3 py-2 rounded-lg border transition-colors duration-300 ${
                        competences[m.key] === true
                          ? "bg-[#3489c2] border-[#3489c2] text-white hover:bg-black"
                          : "bg-white border-gray-300 hover:bg-black hover:text-white"
                      }`}
                      aria-pressed={competences[m.key] === true}
                    >
                      Ja
                    </button>
                    <button
                      type="button"
                      onClick={() => setCompetenceFor(m.key, false)}
                      className={`px-3 py-2 rounded-lg border transition-colors duration-300 ${
                        competences[m.key] === false
                          ? "bg-[#3489c2] border-[#3489c2] text-white hover:bg-black"
                          : "bg-white border-gray-300 hover:bg-black hover:text-white"
                      }`}
                      aria-pressed={competences[m.key] === false}
                    >
                      Nee
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex items-center gap-3">
              <button
                className="px-4 py-2 rounded-xl border transition-colors duration-300 hover:bg-black hover:text-white"
                onClick={() => toStep(1)}
              >
                Terug
              </button>
              <button
                className={`px-5 py-2 rounded-xl text-white shadow transition-colors duration-300 ${
                  canGoStep2
                    ? "bg-[#3489c2] hover:bg-black"
                    : "bg-[#3489c2]/50 cursor-not-allowed"
                }`}
                disabled={!canGoStep2}
                onClick={() => toStep(3)}
              >
                Verder
              </button>
            </div>
          </section>
        )}

        {/* Stap 3 */}
        {step === 3 && (
          <section>
            <h2 className="text-xl font-semibold text-black mb-2">
              3. Aanvullende vragen
            </h2>
            <p className="mb-4 text-black">
              Bedankt voor het invullen! Wil je persoonlijk en vrijblijvend
              contact/advies van de LiS?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className={`px-3 py-2 rounded-xl border transition-colors duration-300 ${
                  wantsContact === true
                    ? "bg-[#3489c2] border-[#3489c2] text-white hover:bg-black"
                    : "bg-white border-gray-300 hover:bg-black hover:text-white"
                }`}
                onClick={() => setWantsContact(true)}
              >
                Ja, graag
              </button>
              <button
                type="button"
                className={`px-3 py-2 rounded-xl border transition-colors duration-300 ${
                  wantsContact === false
                    ? "bg-[#3489c2] border-[#3489c2] text-white hover:bg-black"
                    : "bg-white border-gray-300 hover:bg-black hover:text-white"
                }`}
                onClick={() => setWantsContact(false)}
              >
                Nee, niet nodig
              </button>
            </div>

            <div className="mt-8 flex items-center gap-3">
              <button
                className="px-4 py-2 rounded-xl border transition-colors duration-300 hover:bg-black hover:text-white"
                onClick={() => toStep(2)}
              >
                Terug
              </button>
              <button
                className={`px-5 py-2 rounded-xl text-white shadow transition-colors duration-300 ${
                  canShowAdvice
                    ? "bg-[#3489c2] hover:bg-black"
                    : "bg-[#3489c2]/50 cursor-not-allowed"
                }`}
                disabled={!canShowAdvice}
                onClick={async () => {
                  const ok = await sendToRob();
                  if (ok) toStep(4);
                }}
              >
                Toon mij advies
              </button>
            </div>
          </section>
        )}

        {/* Stap 4 */}
        {step === 4 && (
          <section>
            <h2 className="text-xl font-semibold text-black mb-2">
              4. Persoonlijk Advies
            </h2>
            <div className="border rounded-2xl p-5 bg-gray-50">
              <h3 className="text-lg font-semibold text-black mb-3">
                1. Persoonlijke gegevens
              </h3>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-gray-600">Naam</dt>
                  <dd className="font-medium text-black">{name}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Datum advies</dt>
                  <dd className="font-medium text-black">{today}</dd>
                </div>
                {background.trim() && (
                  <div className="md:col-span-2">
                    <dt className="text-sm text-gray-600">Achtergrond</dt>
                    <dd className="font-medium whitespace-pre-wrap text-black">
                      {background}
                    </dd>
                  </div>
                )}
                <div className="md:col-span-2">
                  <dt className="text-sm text-gray-600">
                    Wat is je huidige functie
                  </dt>
                  <dd className="font-medium text-black">{role}</dd>
                </div>
              </dl>
            </div>

            <div className="border rounded-2xl p-5 bg-gray-50 mt-6">
              <h3 className="text-lg font-semibold text-black mb-3">
                2. Doorgroei kansen
              </h3>

              {Array.isArray(interests) && interests.length > 0 ? (
                [...interests]
                  .sort((a, b) => {
                    const la = INTEREST_MAP[a]?.label || "";
                    const lb = INTEREST_MAP[b]?.label || "";
                    return la.localeCompare(lb, "nl");
                  })
                  .map((code) => {
                    const interest = INTEREST_MAP[code];
                    if (!interest) return null;

                    const yesForInterest = handledModulesYes.filter(
                      (m) =>
                        Array.isArray(m.interests) &&
                        m.interests.includes(code)
                    );
                    const noForInterest = handledModulesNo.filter(
                      (m) =>
                        Array.isArray(m.interests) &&
                        m.interests.includes(code)
                    );

                    return (
                      <div
                        key={code}
                        className="mt-4 border rounded-xl bg-white p-4 last:mb-0"
                      >
                        <p className="text-sm text-gray-600">
                          Binnen het interessegebied:
                        </p>
                        <p className="font-semibold text-black mb-3">
                          {interest.label}
                        </p>

                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <p className="font-medium text-black mb-2">
                              Ik beheers
                            </p>
                            <ul className="list-disc pl-5 space-y-1">
                              {yesForInterest.length > 0 ? (
                                yesForInterest.map((m) => (
                                  <li key={m.key} className="text-black">
                                    {stripParens(m.label)}
                                  </li>
                                ))
                              ) : (
                                <li className="text-gray-500">
                                  (geen ingevulde JA-antwoorden binnen dit
                                  interessegebied)
                                </li>
                              )}
                            </ul>
                          </div>
                          <div>
                            <p className="font-medium text-black mb-2">
                              Ik wil leren
                            </p>
                            <ul className="list-disc pl-5 space-y-1">
                              {noForInterest.length > 0 ? (
                                noForInterest.map((m) => (
                                  <li key={m.key} className="text-black">
                                    {stripParens(m.label)}
                                  </li>
                                ))
                              ) : (
                                <li className="text-gray-500">
                                  (geen ingevulde NEE-antwoorden binnen dit
                                  interessegebied)
                                </li>
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <p className="text-gray-600">
                  Er zijn geen interessegebieden geselecteerd in stap 1.
                </p>
              )}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={dynamicLisUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2 rounded-xl border bg-[#3489c2] text-white transition-colors duration-300 hover:bg-black hover:text-white"
              >
                Bekijk het voor u geselecteerde aanbod
              </a>
              <button
                className="px-5 py-2 rounded-xl border transition-colors duration-300 hover:bg-black hover:text-white"
                onClick={() => {
                  try {
                    const next = [...adviceHistory, buildAdviceObject()];
                    setAdviceHistory(next);
                    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
                  } catch {}
                  toStep(1);
                }}
              >
                Nieuw advies starten
              </button>
              <button
                className="px-5 py-2 rounded-xl border transition-colors duration-300 hover:bg-black hover:text-white"
                onClick={emailVisitor}
              >
                Mail mijn persoonlijk advies
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
