export const demo = {
  user: {
    userId: 1,
    fullName: "Mohammed Al Najjar",
    email: "mohammed@medhmar.om",
    preferredLanguage: "en",
    roles: ["OWNER", "ADMIN"],
    status: "ACTIVE",
  },
  challenges: [
    { challengeId: 17, title: "Desert Champions Challenge", status: "OPEN", opensAt: "2026-10-06T06:00:00Z", closesAt: "2026-10-10T18:00:00Z",
      camels: [
        { camelId: 11, name: "Barq", voteCount: 624, votePercent: 52.0 },
        { camelId: 12, name: "Shahin", voteCount: 576, votePercent: 48.0 }
      ]},
    { challengeId: 18, title: "Heritage Sprint Vote", status: "UPCOMING", opensAt: "2026-10-12T06:00:00Z", closesAt: "2026-10-15T18:00:00Z",
      camels: [
        { camelId: 13, name: "Al Sahab", voteCount: 0, votePercent: 0 },
        { camelId: 14, name: "Najm", voteCount: 0, votePercent: 0 }
      ]},
  ],
  trainer: {
    userId: 22,
    name: "Salim Al Rashidi",
    bio: "Professional camel trainer focused on endurance, race preparation and structured training plans.",
    location: "Nizwa, Oman",
    rating: 4.8,
    assigned: 12,
    years: 8,
  },
  logs: [
    { id: 1, date: "06 Oct 2026", type: "Endurance Training", duration: 45, notes: "Good response during final phase." },
    { id: 2, date: "04 Oct 2026", type: "Speed Training", duration: 30, notes: "Pace and recovery were strong." },
    { id: 3, date: "01 Oct 2026", type: "General Training", duration: 55, notes: "Steady warm-up and controlled finish." },
  ],
  users: [
    { userId: 1, fullName: "Mohammed Al Najjar", email: "mohammed@medhmar.om", roles: ["ADMIN", "OWNER"], status: "ACTIVE" },
    { userId: 2, fullName: "Salim Al Rashidi", email: "salim@medhmar.om", roles: ["TRAINER"], status: "ACTIVE" },
    { userId: 3, fullName: "Ahmed Al Balushi", email: "ahmed@medhmar.om", roles: ["ORGANIZER"], status: "ACTIVE" },
    { userId: 4, fullName: "Khalid Al Harthy", email: "khalid@medhmar.om", roles: ["VIEWER"], status: "SUSPENDED" },
  ],
  organizations: [
    { id: 1, name: "Al Bashayer Racing Organization", region: "Al Dakhiliyah", members: 14, races: 8, status: "ACTIVE" },
    { id: 2, name: "Nizwa Heritage Racing", region: "Nizwa", members: 9, races: 5, status: "ACTIVE" },
    { id: 3, name: "Dhofar Camel Racing", region: "Dhofar", members: 11, races: 6, status: "ACTIVE" },
  ],
  tourism: [
    { id: 1, title: "Camel Racing Heritage Exhibition", type: "Cultural Content", location: "Nizwa", status: "APPROVED", date: "18 Oct 2026" },
    { id: 2, title: "Race Day Visitor Experience", type: "Tourist Event", location: "Adam", status: "APPROVED", date: "24 Oct 2026" },
    { id: 3, title: "Traditional Racing Terminology", type: "Cultural Content", location: "Oman", status: "PENDING", date: "—" },
  ],
  raceCards: [
    { cardId: 13, raceId: 5, race: "Al Bashayer Camel Race", version: 3, published: "06 Oct 2026 • 09:15", participants: 8 },
    { cardId: 12, raceId: 5, race: "Al Bashayer Camel Race", version: 2, published: "05 Oct 2026 • 16:30", participants: 8 },
    { cardId: 11, raceId: 5, race: "Al Bashayer Camel Race", version: 1, published: "05 Oct 2026 • 10:10", participants: 7 },
  ],
  pedigree: {
    camel: "Barq",
    sire: "Al Zoeem",
    dam: "Bint Al Reem",
    grands: ["Al Majd", "Al Noor", "Al Sultan", "Al Dana"],
  },
};
