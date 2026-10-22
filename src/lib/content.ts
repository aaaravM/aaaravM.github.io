// Every word and link on the site lives here. Facts come from the résumé;
// keep it short — the visuals carry the home page, project pages hold the detail.

export const LINKS = {
  resume:
    "https://docs.google.com/document/d/1Aha1dEOM008CIKbDt0Fu6IAPXcs5nhoQvsqGJhiISZs/edit?usp=sharing",
  email: "mailto:muttanapalliAarav26@gmail.com",
  emailLabel: "muttanapalliaarav26@gmail.com",
  github: "https://github.com/aaaravM",
  devpost: "https://devpost.com/muttanapalliaarav26",
  discord: "https://discord.com/users/1007483499000889484",
  logrthm: "https://logrthm.ai",
  apex: "https://www.theapexrobotics.com",
} as const;

export const PROFILE = {
  first: "AARAV",
  last: "MUTTANAPALLI",
  name: "Aarav Muttanapalli",
  tagline: "Intelligent systems, end to end.",
  taglineDim: "Agents, models, and the products people trust.",
  roles: ["AI / ML Engineer", "Founder, logrthm.ai", "FTC Code Lead"],
} as const;

export const NAV = [
  { label: "Work", id: "work" },
  { label: "Experience", id: "experience" },
  { label: "Stack", id: "stack" },
  { label: "About", id: "about" },
  { label: "Contact", id: "contact" },
] as const;

// ─────────────────────────────────────────────────────────── projects

export type Project = {
  slug: string;
  name: string;
  kind: string;
  /** one line for cards */
  blurb: string;
  award?: string;
  /** detail page */
  summary: string;
  points: string[];
  models: string[];
  stack?: string[];
  team?: boolean;
  media?: string;
  links: { label: string; href: string }[];
  /** particle formation shown for this project */
  formation: string;
  /** dot-matrix still of the formation (cards) */
  thumb: string;
};

export const PROJECTS: Project[] = [
  {
    slug: "mentolab",
    name: "MentoLab",
    kind: "Adaptive AI coding tutor",
    blurb: "Teaches coding and ML with challenges picked by a deep-RL agent.",
    award: "1st Place + Best AI · Sierra Hacks",
    summary: "A personalized platform that teaches coding and machine learning through adaptive, community-informed challenges.",
    points: [
      "A policy-gradient deep RL agent selects each learner's next challenge.",
      "A GRU / BiLSTM models learning style, debugging habits and pace.",
      "A GNN similarity graph transfers effective learning paths between learners with different backgrounds.",
      "A RAG task generator turns anonymized real mistakes into debugging exercises; an AI reasoning panel explains every recommendation.",
    ],
    models: ["Deep RL", "GRU / BiLSTM", "GNN", "RAG"],
    stack: ["Python", "Flask", "Node.js", "HTML", "CSS"],
    media: "/media/mentolab.webp",
    links: [{ label: "Devpost", href: "https://devpost.com/software/mentolab" }],
    formation: "graph",
    thumb: "/media/formations/graph.webp",
  },
  {
    slug: "pathlearn",
    name: "PathLearn",
    kind: "Career-aligned AI tutor",
    blurb: "Builds a curriculum from your course and the career you want.",
    award: "2nd Overall · Studiio Hacks",
    summary:
      "An adaptive AI tutor that builds a personalized curriculum by combining a student's course — AP Calculus, Physics Honors, Biology — with their target career.",
    points: [
      "An RNN memory model tracks pace, retention and misconceptions.",
      "A deep RL teacher agent adjusts topic order, difficulty and pacing.",
      "A RAG pipeline on Arch-Router-1.5B generates grounded explanations and practice problems.",
      "Also Top 23 and a Participation Prize at Student HackPad 2025.",
    ],
    models: ["RNN memory", "Deep RL", "RAG"],
    stack: ["Python", "PyTorch", "React", "Node.js", "Tailwind CSS", "sentence-transformers"],
    media: "/media/pathlearn.webp",
    links: [
      { label: "Devpost", href: "https://devpost.com/software/pathlearn" },
      { label: "GitHub", href: "https://github.com/aaaravM/PathLearnAI" },
    ],
    formation: "tree",
    thumb: "/media/formations/tree.webp",
  },
  {
    slug: "neuroflow",
    name: "NeuroFlow",
    kind: "Real-time cognitive biofeedback",
    blurb: "Turns a webcam feed into live focus, emotion and fatigue signals.",
    summary:
      "Uses CNNs and computer vision to convert webcam input into real-time tracking of focus, emotion and fatigue, delivering private, adaptive biofeedback.",
    points: ["CNN-based vision models read focus, emotion and fatigue from a webcam in real time.", "Feedback stays private and adapts to the person using it."],
    models: ["CNN", "Computer vision"],
    team: true,
    media: "/media/neuroflow.webp",
    links: [{ label: "Devpost", href: "https://devpost.com/software/neuroflow-qbn59t" }],
    formation: "eye",
    thumb: "/media/formations/eye.webp",
  },
  {
    slug: "exoml",
    name: "ExoML",
    kind: "Exoplanet detection",
    blurb: "Finds exoplanets in telescope data with a hybrid deep model.",
    summary: "Integrates CNN, RNN and deep RL models to classify telescope data for exoplanet discovery, with a web interface for the model.",
    points: ["A hybrid of CNN, RNN and deep RL models classifies telescope signals.", "Reaches 95%+ accuracy.", "Ships with a web interface for running the model."],
    models: ["CNN", "RNN", "Deep RL"],
    links: [{ label: "GitHub", href: "https://github.com/aaaravM/HTML-for-ExoML" }],
    formation: "transit",
    thumb: "/media/formations/transit.webp",
  },
  {
    slug: "mindecho",
    name: "MindEcho.ai",
    kind: "Adaptive mental-wellness AI",
    blurb: "A memory-aware companion whose self-care adapts over time.",
    summary: "A memory-aware mental-wellness chatbot that delivers personalized self-care and adapts to each user over time.",
    points: ["LSTM emotion modeling with reinforcement learning.", "Personalizes self-care to each user over time, with 95%+ accuracy."],
    models: ["LSTM", "Reinforcement learning"],
    links: [],
    formation: "wave",
    thumb: "/media/formations/wave.webp",
  },
  {
    slug: "smartflow",
    name: "SmartFlow",
    kind: "Context-aware clipboard AI",
    blurb: "Reformats whatever you paste for the app you paste it into.",
    summary:
      "A desktop app that uses machine learning to automatically reformat pasted content based on the destination app — like Grammarly, but for everything you copy and paste.",
    points: ["Detects where you're pasting and transforms the content to fit.", "Runs as a desktop app."],
    models: ["Machine learning"],
    media: "/media/smartflow.webp",
    links: [{ label: "Devpost", href: "https://devpost.com/software/smartflow-zaboij" }],
    formation: "flow",
    thumb: "/media/formations/flow.webp",
  },
  {
    slug: "colorectal",
    name: "Colorectal CNN",
    kind: "Medical deep learning",
    blurb: "Classifies biopsy images to support early cancer diagnosis.",
    summary: "CNNs trained to classify colorectal biopsy images to support early cancer diagnosis and research workflows.",
    points: ["Convolutional networks label biopsy tissue images.", "Reaches 95%+ accuracy."],
    models: ["CNN"],
    links: [],
    formation: "tissue",
    thumb: "/media/formations/tissue.webp",
  },
];

/** smrthire gets a detail page too, reached from Experience. */
export const SMRTHIRE: Project = {
  slug: "smrthire",
  name: "smrthire",
  kind: "Multi-agent hiring platform · QualiZeal internship",
  blurb: "An autonomous multi-agent platform that replaces the ATS.",
  summary:
    "Built during an AI engineering internship at QualiZeal: an autonomous LangGraph platform that replaces a traditional applicant tracking system. It parses job descriptions and résumés, scores every candidate with cited evidence, flags gaps, writes tailored interview questions, ranks the pool and drafts outreach.",
  points: [
    "Six specialized agents with schema-validated outputs, coordinated through parallel map-reduce with per-candidate failure isolation.",
    "A human-in-the-loop gate (LangGraph interrupts): recruiters approve or edit weights and re-rank instantly without re-running the LLM.",
    "FastAPI with live streaming, a Next.js dashboard, and one Postgres + pgvector database for RAG, memory, checkpointing and audit logs.",
    "A provider-neutral LLM layer — OpenAI, Anthropic, AWS Bedrock, Google Vertex, Ollama — so models can be switched without code changes.",
    "Safety by design: prompt-injection and hidden-text detection, PII redaction and encryption, protected attributes kept out of scoring.",
    "82 automated tests in CI: shortlists matched human recruiters on a labeled golden set, and swapping names and genders changed no scores.",
  ],
  models: ["LangGraph", "Multi-agent", "RAG", "Human-in-the-loop"],
  stack: ["Python", "FastAPI", "Next.js", "PostgreSQL", "pgvector", "GitHub Actions"],
  media: "/media/smrthire.webp",
  links: [
    { label: "Live demo", href: "https://smarthire-frontend-flame.vercel.app" },
    { label: "GitHub", href: "https://github.com/aaaravM/smrthire" },
  ],
  formation: "agents",
  thumb: "/media/formations/agents.webp",
};

export const ALL_PROJECTS: Project[] = [SMRTHIRE, ...PROJECTS];

export function getProject(slug: string) {
  return ALL_PROJECTS.find((p) => p.slug === slug);
}

// ─────────────────────────────────────────────────────────── experience

export type Role = {
  id: string;
  org: string;
  role: string;
  when: string;
  line: string;
  formation: string;
  links: { label: string; href: string; internal?: boolean }[];
};

export const EXPERIENCE: Role[] = [
  {
    id: "qualizeal",
    org: "QualiZeal",
    role: "AI Engineering Intern",
    when: "Jun – Jul 2026",
    line: "Built smrthire, a multi-agent hiring platform that replaces the traditional ATS.",
    formation: "agents",
    links: [
      { label: "Case study", href: "/projects/smrthire/", internal: true },
      { label: "Live demo", href: "https://smarthire-frontend-flame.vercel.app" },
    ],
  },
  {
    id: "logrthm",
    org: "logrthm.ai",
    role: "Founder",
    when: "2024 – now",
    line: "An AI product studio. I set the product direction and system architecture for every app — seven shipped so far.",
    formation: "log",
    links: [{ label: "logrthm.ai", href: LINKS.logrthm }],
  },
  {
    id: "apex",
    org: "Apex Robotics · FTC 36674",
    role: "Code Lead",
    when: "FIRST Tech Challenge",
    line: "Lead the software for the team's competition robot.",
    formation: "field",
    links: [{ label: "theapexrobotics.com", href: LINKS.apex }],
  },
];

// ─────────────────────────────────────────────────────────── stack
// From the résumé's Skills section; each category is one cluster in the particle embedding space.

export const STACK: { name: string; items: string[]; note?: string }[] = [
  { name: "Languages", items: ["Python (primary)", "JavaScript", "TypeScript", "HTML", "CSS", "SQL"] },
  {
    name: "AI / ML",
    items: [
      "LangGraph",
      "LangChain",
      "PyTorch",
      "RAG",
      "Multi-agent systems",
      "CNNs",
      "RNNs / LSTMs / GRUs",
      "GNNs",
      "Transformers",
      "Deep reinforcement learning",
      "LLM evaluation",
      "Computer vision",
    ],
  },
  { name: "Web & Backend", items: ["React", "Next.js", "FastAPI", "Flask", "Django", "Node.js", "Tailwind CSS"] },
  {
    name: "Data & Infrastructure",
    items: ["PostgreSQL", "pgvector", "Docker", "GitHub Actions CI", "Pandas", "NumPy", "Seaborn", "Matplotlib"],
  },
  {
    name: "AI Architecture & Systems Design",
    items: [
      "Multi-agent orchestration",
      "RAG & vector search",
      "Provider-neutral LLM layer",
      "Structured outputs",
      "Human-in-the-loop",
      "Long-term memory",
      "Evaluation harnesses",
      "Prompt-injection defense",
      "PII protection",
      "Bias testing",
    ],
    note: "LangGraph state schemas, reducers, parallel map-reduce, interrupts and checkpointing",
  },
  {
    name: "LLM Platforms & Tools",
    items: ["OpenAI", "Anthropic", "AWS Bedrock", "Google Vertex AI", "Ollama", "Hugging Face", "sentence-transformers"],
  },
];

// ─────────────────────────────────────────────────────────── about

export const ABOUT = {
  statement: "From multi-agent orchestration and retrieval to the interface you touch — I design the whole system.",
  facts: [
    { k: "Student", v: "Class of 2029", note: "Engineering Pathway" },
    { k: "Taekwondo", v: "1st-degree black belt", note: "" },
    { k: "Based in", v: "Mountain House, CA", note: "" },
  ],
} as const;

// ─────────────────────────────────────────────────────────── recognition

export const RECOGNITION_LINE = "16 hackathons entered · 8 Devpost achievements";

export const AWARDS = [
  { rank: "1st", title: "Sierra Hacks", note: "+ Best AI" },
  { rank: "2nd", title: "Studiio Hacks", note: "Overall" },
  { rank: "Top 23", title: "Student HackPad", note: "2025" },
  { rank: "Finalist", title: "ICSC", note: "International, 2026" },
  { rank: "1 of 50", title: "Stanford seeME", note: "Selected twice" },
  { rank: "TEDx", title: "Mountain House", note: "Speaker, then coach" },
  { rank: "Gold", title: "MOEMS", note: "Top 10% globally" },
  { rank: "6th", title: "Reach for the Stars", note: "Astronomy, national" },
] as const;

// ─────────────────────────────────────────────────────────── contact

export const CONTACT_LINKS = [
  { label: "Email", value: LINKS.emailLabel, href: LINKS.email },
  { label: "Résumé", value: "Google Doc", href: LINKS.resume },
  { label: "GitHub", value: "@aaaravM", href: LINKS.github },
  { label: "Devpost", value: "muttanapalliaarav26", href: LINKS.devpost },
  { label: "Discord", value: "Message me", href: LINKS.discord },
] as const;
