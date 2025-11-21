"use client";

import React, { useEffect, useMemo, useState } from "react";

const TRACKS = {
  A: { label: "NPI Engineer" },
  B: { label: "Product Engineer" },
  C: { label: "CNC Operator" },
};

// Keys voor localStorage
const STORAGE_KEY = "lis-keuzetool-state-v1";
const HISTORY_KEY = "lis-keuzetool-history-v1";

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

const ALL_MODULES = [
  {
    key: "designForMfg",
    label: "Design for Manufacturing (A)",
    tracks: ["A"],
    desc: "Leer ontwerpen die productieproblemen voorkomen: maakbaarheid begint bij Design for Manufacturability.",
  },
  {
    key: "ip",
    label: "Intellectueel eigendom (A+B)",
    tracks: ["A", "B"],
    desc: "Bescherm jouw ideeën: leer hoe intellectueel eigendom werkt en wat het voor technici betekent.",
  },
  {
    key: "scale",
    label: "Ontwerp voor schaalbaarheid (A+B)",
    tracks: ["A", "B"],
    desc: "Leer hoe je processen veilig en efficiënt opschaalt: van risicoanalyse tot audit en readiness assessment.",
  },
  {
    key: "teamwork",
    label: "Effectief samenwerken in technische projecten (A+B+C)",
    tracks: ["A", "B", "C"],
    desc: "Breng techniek en communicatie samen: leer hoe je een nieuw product succesvol introduceert met stakeholderanalyse en Scrum.",
  },
  {
    key: "costControl",
    label: "Kostenbeheersing in productie (A)",
    tracks: ["A"],
    desc: "Ontdek hoe je echte productkosten berekent en optimaliseert met COGA en TCO.",
  },
  {
    key: "validation",
    label: "Procesvalidatie en kwaliteitsverbetering (A+B+C)",
    tracks: ["A", "B", "C"],
    desc: "Beheers proceszekerheid: van validatie tot FMEA en SPC voor betrouwbare productie.",
  },
  {
    key: "deadlines",
    label: "Werken met strakke deadlines (A)",
    tracks: ["A"],
    desc: "Word wendbaar en efficiënt: combineer Agile, Lean en risicobeheersing voor succesvolle projecten.",
  },
  {
    key: "feedback",
    label: "Feedbackgedreven ontwikkeling (A+B+C)",
    tracks: ["A", "B", "C"],
    desc: "Versnel innovatie: leer rapid prototyping met 3D-printing, simulaties en slimme teststrategieën.",
  },
  {
    key: "cmm",
    label: "CMM meten en controleren (C)",
    tracks: ["C"],
    desc: "Meet en verbeter met precisie: leer werken met CMM voor betrouwbare kwaliteitscontrole.",
  },
  {
    key: "cncAuto",
    label: "CNC automation (C)",
    tracks: ["C"],
    desc: "Automatiseer CNC-productie: leer robotbelading en nulpuntspansystemen voor maximale efficiëntie.",
  },
  {
    key: "ncProg",
    label: "NC programmeren (C)",
    tracks: ["C"],
    desc: "Programmeer, instel en controleer: leer CNC-techniek van tekening tot foutloze productie.",
  },
  {
    key: "materials",
    label: "Technische materiaalkeuze (B)",
    tracks: ["B"],
    desc: "Kies het juiste materiaal en ontwerp slimme oplossingen: van eigenschappen tot circulair gebruik.",
  },
  {
    key: "iso",
    label: "ISO9000 en CE (A+B)",
    tracks: ["A", "B"],
    desc: "Beheers kwaliteit en veiligheid: leer ISO 9001 en CE-markering toepassen in de praktijk.",
  },
];

const LIS_BASE =
  "https://www.lis.nl/lis-voor-werkenden-maatwerkprogramma-s-hightechsector/programma-aanbod/";
const LIS_PERSONAL_BASE = LIS_BASE + "persoonlijk-advies-def/";

function makeLisFilterUrl(interests, noModules) {
  const picked = Array.isArray(interests) ? interests : [];

  const programmeSlugs = picked
    .map((code) => TRACKS[code])
    .filter(Boolean)
    .map((t) => slugifyModuleLabel(t.label));

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

function formatBulleted(labels) {
  return labels.filter(Boolean).join("\n  - ");
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

  const today
