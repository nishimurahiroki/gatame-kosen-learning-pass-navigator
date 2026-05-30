/**
 * Per-module technique labels for display and practice checklist.
 * Keys match module `id` in backend `modules.json`.
 *
 * **Source of truth:** `technique-focus-points.md` (same titles as ### headings).
 * Only techniques documented there are listed (typically up to 5 per module).
 */
export const TECHNIQUE_LIST: Record<string, readonly string[]> = {
  ukemi: ['Ushiro Ukemi', 'Yoko Ukemi', 'Mae Mawari Ukemi'],

  'solo-newaza-workout': [
    'Soto Mawashi (Outside Legs Rotation)',
    'Uchi Mawashi (Inside Legs Rotation)',
    'Ashi Keri (Kicking the Legs)',
    'Ashi Furi (Swing Legs)',
    'Ashi Kosa (Cross Legs)',
  ],

  osaekomi: [
    'Kesa Gatame Basic',
    'Yoko Shiho Gatame Basic',
    'Kata Gatame Basic',
    'Kami Shiho Gatame',
    'Around the World (15 Osaekomi Transitions)',
  ],

  'fundamental-tachi-waza': ['Basic Seoi Nage'],

  'kumikata-ai-yotsu': [
    'Win Kumikata in Ai Yotsu (same side grips)',
    'Simple Gripping in Ai Yotsu No.1 - No.3',
    'Simple Gripping in Ai Yotsu No.3 - No.4',
    'Get Sleeve in Kenka Yotsu No.1 - No.2',
    'Get Sleeve in Kenka Yotsu No.3 - No.4',
  ],

  'kumikata-kenka-yotsu': [
    'Win Kumikata in Kenka Yotsu (opposite side grips)',
    'Simple Gripping in Kenka Yotsu No.1 No.2 & No.2 Advance',
    'Simple Gripping in Kenka Yotsu No.3 No.4',
    'Simple Gripping in Ai Yotsu No.5 No.6',
    'Simple Gripping in Ai Yotsu No.7',
  ],

  'break-gripping-ai-yotsu': [
    'Breaking the Sleeve in Ai Yotsu',
    'Breaking the Collar in Ai Yotsu No.1',
    'Breaking the Collar in Ai Yotsu No.2',
  ],

  'break-gripping-kenka-yotsu': [
    'Breaking the Sleeve in Kenka Yotsu No.1 - No.3',
    'Breaking the Collar in Kenka Yotsu',
    'Avoid His Tsuri Te (collar hand) in Kenka Yotsu',
  ],

  'kansetsu-waza': [
    'JUJI GATAME Basic',
    'UDE GATAME No.1 (When he gets the pants)',
    'Waki Gatame Variations',
    'HIZA GATAME with KOMUlock in Butterfly Guard',
    'KESA GATAME Armlock No.1 (ASHI GATAME)',
  ],

  'shime-waza': [
    'HADAKA JIME',
    'OKURI ERI JIME',
    'OKURI ERI JIME Escape No.1',
    'KATA HA JIME',
    'JUJI GATAME → SANKAKU',
  ],

  'guard-pass-bottom': [
    'Scissors Sweep No.1',
    'Scissors Sweep No.2',
    'OBI TORI GAESHI in Guard Position',
    'Butterfly Guard Drill No.1',
    'Cross Grip Turnover on the Side in Butterfly Guard',
  ],

  'guard-pass-top': [
    'Guard Pass No.1 (KESA GATAME)',
    'Guard Pass No.2 (KUZURE KESA GATAME)',
    'Guard Pass No.3 (YOKO SHIHO GATAME)',
    'Kata Te Jime in JIGOKU ZEME',
    'Kurimura Guard Pass No.1',
  ],

  'on-the-turtle': [
    'OBI TORI GAESHI on the Turtle No.1',
    'OBI TORI GAESHI on the Turtle (How To Take The Arm)',
    'OBI TORI GAESHI on the Turtle No.2',
    'KOSHI JIME Basic',
    'KOSHI JIME with Pants (When he tries to stand up)',
  ],

  'escape-from-osaekomi': [
    'Kesa Gatame Escape No.1 (Push with the Arm)',
    'Kesa Gatame Escape No.2 (Swing the Legs)',
    'Kesa Gatame Escape No.3 (with Kobiri)',
    'YOKO SHIHO GATAME Escape No.1',
    'YOKO SHIHO GATAME Escape No.2',
  ],

  throwing: [
    'Kuchiki Daoshi Basic',
    'Single Leg with O Uchi Gari',
    'Kibisu Gaeshi Basic',
    'Morote Gari Basic',
    'Standing OBI TORI GAESHI (HIKIKOMI GAESHI) No.1',
  ],

  'shime-waza-transition': [
    'KOSHI JIME Transition (SASAE → KOSHI JIME)',
    'Break Seoi Nage → Koshi Jime',
    'Uki Waza → Koshi Jime',
    'Sumi Gaeshi → Ashi Jime',
  ],

  'kansetsu-waza-transition': [
    'Transition No.4 Forward Technique → Juji',
    'Tomoe Nage → He Resists → Juji',
    'He Does Ashi Tori → Avoid & Break → Ashi Gatame',
    'Ude Tori Gaeshi → Te Gatame',
    'Tai Otoshi → Get the Arm → Ude Garami',
  ],

  'osaekomi-transition': [
    'Morote Gari → Kuzure Kesa Gatame',
    'Transition No.1 Ko Uchi Gari → Sliding the Knee → Kesa Gatame',
    'Transition No.2 O Uchi Gari → Koshi Kiri → Yoko Shiho Gatame',
    'Transition No.3 O Soto Gari → Catch the Arm → Go Another Side → Kuzure Mune Gatame',
    'Tawara Gaeshi → Osaekomi',
  ],
}
