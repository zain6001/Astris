export const protocols = {
  "PROT-CARDIO-01": {
    id: "PROT-CARDIO-01", category: "Cardiovascular",
    title: "Lower Body Negative Pressure & Fluid-Shift Countermeasure", urgency: "HIGH",
    estimatedDurationMin: 25,
    rationale: "Counteracts cephalad fluid shifts and elevated cardiovascular workload.",
    steps: ["Move to the LBNP restraint station.", "Apply the prescribed negative-pressure profile.", "Maintain the protocol for 15 minutes while monitoring SpO2.", "Record symptoms and return to nominal activity."]
  },
  "PROT-RAD-01": {
    id: "PROT-RAD-01", category: "Radiation",
    title: "Module 4 Polyethylene Storm Shelter Relocation & Dosimeter Audit", urgency: "CRITICAL",
    estimatedDurationMin: 15,
    rationale: "Reduces acute exposure during a solar particle event and verifies personal dosimetry.",
    steps: ["Notify crew and relocate to Module 4.", "Secure food, water, and medical kits.", "Verify dosimeter telemetry and battery state.", "Remain sheltered until the radiation trend is nominal."]
  },
  "PROT-MUSC-01": {
    id: "PROT-MUSC-01", category: "Musculoskeletal",
    title: "ARED Resistive Loading & Bone-Density Countermeasure", urgency: "MEDIUM",
    estimatedDurationMin: 45,
    rationale: "Restores the daily loading stimulus required to preserve bone and muscle in altered gravity.",
    steps: ["Inspect ARED hardware and harness.", "Complete the prescribed lower-body loading set.", "Complete upper-body pulls and pushes.", "Log duration, perceived exertion, and equipment status."]
  },
  "PROT-BEHAV-01": {
    id: "PROT-BEHAV-01", category: "Behavioral",
    title: "Circadian Blue-Enriched Light Therapy & Cognitive Reset", urgency: "MEDIUM",
    estimatedDurationMin: 20,
    rationale: "Supports circadian alignment and cognitive recovery during isolation and confinement.",
    steps: ["Enter the quiet recovery zone.", "Start blue-enriched light therapy.", "Complete paced breathing and hydration.", "Repeat the cognitive check after recovery."]
  },
  "PROT-IMMUNE-01": {
    id: "PROT-IMMUNE-01", category: "Immune",
    title: "Cabin CO2 Scrubber Verification & Immune Quarantine Check", urgency: "HIGH",
    estimatedDurationMin: 15,
    rationale: "Limits environmental stress and identifies early immune symptoms before deterioration.",
    steps: ["Verify cabin CO2 scrubber flow and filter status.", "Move to the medical station for a symptom review.", "Check temperature and repeat SpO2 measurement.", "Notify the flight surgeon and follow isolation guidance."]
  }
};
