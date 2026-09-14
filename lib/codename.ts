const TRAITS = [
  "Sneaky",
  "Stealthy",
  "Sassy",
  "Nimble",
  "Cunning",
  "Plucky",
  "Daring",
  "Silent",
];

const ROLES = [
  "Intern",
  "Manager",
  "Analyst",
  "Courier",
  "Mascot",
  "Janitor",
  "Auditor",
  "Barista",
];

const PROPS = [
  "Stapler",
  "Postit",
  "Printer",
  "Paperclip",
  "Binder",
  "Cubicle",
  "Keycard",
  "Thermos",
];

export const CODENAME_WORD_SETS = [TRAITS, ROLES, PROPS] as const;

export function generateCodename(): string {
  return CODENAME_WORD_SETS.map(
    (set) => set[Math.floor(Math.random() * set.length)],
  ).join("");
}
