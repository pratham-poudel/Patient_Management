/**
 * Builds the input for the AI "Pathologist's comment" on a lab report.
 *
 * - Only clinical data is sent (age, sex and test results). Name, phone, email,
 *   address, doctor and clinic names are never included.
 * - Every numeric result is compared with the laboratory's own reference range in
 *   code, so the model receives a ready-made LOW / HIGH / NORMAL flag and does not
 *   have to do the arithmetic itself.
 *
 * Reference ranges mirror what is printed on views/report.ejs. If a range changes
 * there, change it here as well.
 */

const r = (lo, hi) => ({ lo, hi });
const sexRanges = (m, f) => ({ M: m, F: f });
const lt = (hi) => ({ hi, lt: true });

// [key, label, unit, reference]
// reference: undefined -> qualitative / no range, r(lo, hi), lt(hi), sexRanges(...), or a plain string
const SECTIONS = [
  ['Haematology', [
    ['hb', 'Haemoglobin', 'gm/dl', sexRanges(r(13.5, 16), r(12, 15.5))],
    ['plateletCount', 'Platelet Count', '/cumm', r(150000, 450000)],
    ['tlc', 'Total Leucocyte Count', '/cumm', r(4000, 11000)],
    ['dlc', 'Differential Leucocyte Count', ''],
    ['poly', 'Polymorphs', '%', r(40, 75)],
    ['lympho', 'Lymphocytes', '%', r(20, 45)],
    ['mono', 'Monocytes', '%', r(2, 10)],
    ['eosino', 'Eosinophils', '%', r(1, 6)],
    ['basophil', 'Basophils', '%', r(0, 1)],
    ['esr', 'ESR (Wintrobe, 1st hr)', 'mm', sexRanges(r(0, 9), r(0, 20))],
    ['pcv', 'PCV', '%', sexRanges(r(41, 50), r(36, 48))],
    ['bleedingTime', 'Bleeding Time', 'min', r(1, 6)],
    ['clottingTime', 'Clotting Time', 'min', r(6, 10)],
    ['pt', 'Prothrombin Time', 'sec', 'control 13 sec'],
    ['inr', 'INR', '', undefined],
    ['reticCount', 'Reticulocyte Count', '%', r(0.2, 2)],
    ['rbcCount', 'RBC Count', 'million/cumm', r(4.6, 6.5)],
    ['mcv', 'MCV', 'fl', r(83, 101)],
    ['mch', 'MCH', 'pg', r(27, 32)],
    ['mchc', 'MCHC', '%', r(33, 36)],
  ]],
  ['Serology / Immunology', [
    ['bloodgroup', 'Blood Group', ''],
    ['crp', 'CRP', ''],
    ['raFactor', 'RA Factor', ''],
    ['hPylori', 'H. Pylori', ''],
    ['hiv', 'HIV I & II', ''],
    ['hbsAgTest', 'HBsAg', ''],
    ['hcv', 'HCV', ''],
    ['vdrl', 'VDRL', ''],
    ['dengue', 'Dengue IgM/NS1', ''],
    ['scrub', 'Scrub Typhus', ''],
    ['mp', 'Malaria Parasite', ''],
    ['troponin', 'Troponin I', ''],
  ]],
  ['Widal Test', [
    ['sTyphiO', "S. Typhi 'O'", ''],
    ['sTyphiH', "S. Typhi 'H'", ''],
    ['sParaTyphiAH', "S. Paratyphi 'AH'", ''],
    ['sParaTyphiBH', "S. Paratyphi 'BH'", ''],
    ['noteofwidaltest', 'Widal note', ''],
  ]],
  ['Blood Glucose', [
    ['bloodSugarF', 'Blood Sugar Fasting', 'mg/dl', r(60, 110)],
    ['bloodSugarPP', 'Blood Sugar Post-prandial', 'mg/dl', r(80, 140)],
    ['bloodSugarR', 'Blood Sugar Random', 'mg/dl', r(60, 140)],
    ['hba1c', 'HbA1c', '%', r(2, 7)],
  ]],
  ['Glucose Tolerance Test', [
    ['fasting', 'GTT Fasting', 'mg/dl', lt(105)],
    ['firstHour', 'GTT 1st Hour', 'mg/dl', lt(195)],
    ['secondHour', 'GTT 2nd Hour', 'mg/dl', lt(145)],
    ['thirdHour', 'GTT 3rd Hour', 'mg/dl', undefined],
  ]],
  ['Renal Function', [
    ['bloodUrea', 'Blood Urea', 'mg/dl', r(15, 45)],
    ['serumCreatinine', 'Serum Creatinine', 'mg/dl', r(0.4, 1.4)],
    ['serumUricAcid', 'Serum Uric Acid', 'mg/dl', r(2, 6)],
  ]],
  ['Lipid Profile', [
    ['sCholesterol', 'Total Cholesterol', 'mg/dl', r(130, 200)],
    ['sTriglycerides', 'Triglycerides', 'mg/dl', r(50, 150)],
    ['vldlCholesterol', 'VLDL Cholesterol', 'mg/dl', r(2, 40)],
    ['hdlCholesterol', 'HDL Cholesterol', 'mg/dl', r(30, 70)],
    ['ldlCholesterol', 'LDL Cholesterol', 'mg/dl', r(30, 175)],
  ]],
  ['Liver Function', [
    ['sBilirubinTotal', 'Total Bilirubin', 'mg/dl', r(0.4, 1.0)],
    ['sBilirubinDirect', 'Direct Bilirubin', 'mg/dl', r(0.1, 0.4)],
    ['sProteinsTotal', 'Total Protein', 'gm/dl', r(6.0, 8.5)],
    ['sAlbumin', 'Albumin', 'gm/dl', r(3.7, 5.0)],
    ['ggtp', 'GGTP', 'IU/L', r(4, 38)],
    ['sAlkalinePhos', 'Alkaline Phosphatase', 'IU/L', r(60, 306)],
    ['sgpt', 'SGPT (ALT)', 'IU/L', r(5, 37)],
    ['sgot', 'SGOT (AST)', 'IU/L', r(3, 45)],
  ]],
  ['Electrolytes & Others', [
    ['sSodium', 'Sodium', 'meq/l', r(135, 155)],
    ['sPotassium', 'Potassium', 'meq/l', r(3.5, 5.5)],
    ['sChloride', 'Chloride', 'meq/l', r(98, 110)],
    ['sPhosphorous', 'Phosphorous', 'mg/dl', r(2.5, 4.8)],
    ['serumCalcium', 'Calcium', 'mg/dl', r(8.2, 10.4)],
    ['amylase', 'Amylase', 'U/L', r(30, 110)],
    ['ckMb', 'CK-MB', '%', r(5, 25)],
  ]],
  ['Thyroid Profile', [
    ['ft3', 'Free T3 (FT3)', 'pmol/L', r(3.8, 6.0)],
    ['ft4', 'Free T4 (FT4)', 'pmol/L', r(7.86, 14.41)],
    ['tsh', 'TSH', 'uIU/mL', r(0.4, 4.9)],
  ]],
  ['Vitamins', [
    ['vitaminB12', 'Vitamin B12', 'pg/mL', r(197, 771)],
    ['vitaminD', 'Vitamin D', 'ng/mL', r(30, 100)],
  ]],
  ['Urine Analysis', [
    ['colour', 'Colour', ''],
    ['specificgravity', 'Specific Gravity', ''],
    ['appearance', 'Appearance', ''],
    ['chemicalexamination', 'Chemical Examination', ''],
    ['reaction', 'Reaction', ''],
    ['albumen', 'Albumin', ''],
    ['sugar', 'Sugar', ''],
    ['ketonebodies', 'Ketone Bodies', ''],
    ['blood', 'Blood', ''],
    ['puscells', 'Pus cells', ''],
    ['rbc', 'RBC', ''],
    ['epcells', 'Epithelial cells', ''],
    ['crystals', 'Crystals', ''],
    ['cast', 'Casts', ''],
    ['others', 'Others', ''],
    ['pregnancytest', 'Pregnancy Test', ''],
  ]],
  ['Stool Examination', [
    ['colourofstool', 'Colour', ''],
    ['consistancyofstool', 'Consistency', ''],
    ['mucousofstool', 'Mucus', ''],
    ['chemicalexaminationofstool', 'Chemical Examination', ''],
    ['reactionofstool', 'Reaction', ''],
    ['reducingsubstanceofstool', 'Reducing Substance', ''],
    ['occultbloodofstool', 'Occult Blood', ''],
    ['protozoalparasitesofstool', 'Protozoal Parasites', ''],
    ['bloodofstool', 'Blood', ''],
    ['puscellsofstool', 'Pus cells', ''],
    ['rbcofstool', 'RBC', ''],
    ['helmenthicparasitesofstool', 'Helminthic Parasites', ''],
    ['othersofstool', 'Others', ''],
    ['noteofstool', 'Stool note', ''],
  ]],
];

const SYSTEM_PROMPT = `You are a senior consultant pathologist at a large tertiary-care hospital. You write the "Pathologist's Comment" printed at the end of a laboratory report. It is read by the treating doctor and the patient.

INPUT
You receive the patient's age and sex followed by the reported results, grouped by department. Numeric results already carry a flag (LOW, HIGH or NORMAL) calculated against the laboratory's own reference range, which is shown in brackets. Treat these flags as correct. Do not recalculate them and do not substitute other reference ranges. Results without a flag are qualitative or have no range.

RULES
1. Use only the data provided. Never invent values, tests, history or reference ranges. A test that is not listed was not performed; do not mention missing tests.
2. Comment on qualitative results only when they are clearly abnormal (for example Positive, Reactive, Detected, trace or + or more in urine, parasites seen, blood present). Do not comment on blank or ambiguous entries.
3. Correlate related parameters instead of listing them one by one:
   - Anaemia: Hb with MCV, MCH, MCHC, RBC, PCV and reticulocytes (microcytic hypochromic pattern suggests iron deficiency or thalassaemia trait; macrocytosis suggests B12 or folate deficiency, correlate with Vitamin B12 if reported).
   - White cells: neutrophilia suggests bacterial infection or inflammation; lymphocytosis suggests viral infection; eosinophilia suggests allergy or parasitic infection; leucopenia or thrombocytopenia with fever warrants dengue or malaria correlation.
   - Glycaemia: blood sugar, GTT and HbA1c together.
   - Lipids: cholesterol, triglycerides, LDL, HDL, VLDL together; mention cardiovascular risk only when abnormal.
   - Liver: raised SGPT/SGOT suggests hepatocellular injury; raised ALP/GGTP with bilirubin suggests cholestasis; low albumin suggests reduced synthetic function or protein loss.
   - Kidney: urea, creatinine and electrolytes together; raised uric acid separately.
   - Thyroid: high TSH with low FT4 suggests primary hypothyroidism; high TSH with normal FT4/FT3 suggests subclinical hypothyroidism; low TSH with high FT4/FT3 suggests hyperthyroidism; low TSH with normal FT4/FT3 suggests subclinical hyperthyroidism. Judge by TSH first, then FT4 and FT3.
   - Vitamins: low Vitamin D indicates deficiency or insufficiency; low Vitamin B12 indicates deficiency and may relate to anaemia, macrocytosis or neuropathy.
   - Serology: state a positive or reactive result plainly and advise confirmation where appropriate. A single Widal titre must be interpreted with clinical correlation.
   - Urine and stool: pus cells, RBCs, protein, sugar, ketones, casts, crystals, occult blood or parasites.
4. Critical values: if any result is critically abnormal (for example Hb below 7 gm/dl, platelets below 20,000/cumm, potassium above 6.5 or below 2.5 meq/l, sodium below 120 or above 160 meq/l, blood glucose below 50 or above 400 mg/dl, positive troponin, creatinine above 5 mg/dl), begin the Summary with "CRITICAL:" and advise urgent clinical review.
5. Be careful with wording. Use "suggestive of", "consistent with" or "may indicate". Never state a definitive diagnosis. Never recommend drugs, doses or treatment. Recommending further investigations or clinical correlation is appropriate.
6. The reference ranges are adult ranges. If the patient is under 15 years old and it matters, say that paediatric reference intervals may differ.
7. Do not repeat normal values one by one. Group normal systems in a few words (for example "Liver and renal function are within reference limits").

OUTPUT FORMAT
Plain text only. No markdown, no asterisks, no bullet symbols, no emojis, no headings other than the labels below, and never mention AI. Use exactly these labelled lines, each on its own line, in British English, and keep the whole comment under 130 words:
Summary: one sentence giving the overall picture.
Key findings: abnormal results only, with value and direction (low or high), grouped by system and separated by semicolons.
Interpretation: the clinical pattern these findings suggest, correlating related parameters.
Advice: clinical correlation and any specific follow-up tests that would help.

If every result is within its reference range, write only these two lines:
Summary: All reported parameters are within the laboratory reference intervals.
Advice: Clinical correlation is recommended.`;

function normaliseSex(sex) {
  const s = String(sex || '').trim().toLowerCase();
  if (s.startsWith('m')) return 'M';
  if (s.startsWith('f')) return 'F';
  return null;
}

function parseNumeric(value) {
  const s = String(value).replace(/,/g, '').trim();
  return /^[-+]?\d+(\.\d+)?$/.test(s) ? parseFloat(s) : null;
}

function isBlank(v) {
  return v === undefined || v === null || String(v).trim() === '';
}

function describeRange(ref, sex) {
  if (!ref) return '';
  if (typeof ref === 'string') return ref;
  if (ref.M && ref.F) {
    if (sex) return `${ref[sex].lo}-${ref[sex].hi}`;
    return `M ${ref.M.lo}-${ref.M.hi}, F ${ref.F.lo}-${ref.F.hi}`;
  }
  if (ref.lt) return `<${ref.hi}`;
  return `${ref.lo}-${ref.hi}`;
}

function flagFor(num, ref, sex) {
  if (num === null || !ref || typeof ref === 'string') return '';
  let range = ref;
  if (ref.M && ref.F) {
    if (!sex) return ''; // cannot judge a sex-specific range without knowing the sex
    range = ref[sex];
  }
  if (range.lt) return num < range.hi ? 'NORMAL' : 'HIGH';
  if (num < range.lo) return 'LOW';
  if (num > range.hi) return 'HIGH';
  return 'NORMAL';
}

/**
 * Turns a LabReport (mongoose document or plain object) into the user message
 * for the model. Returns null if the report has no test results.
 */
function buildInterpretationInput(report) {
  const data = typeof report.toObject === 'function' ? report.toObject() : report;
  const sex = normaliseSex(data.sex);

  const blocks = [];
  let resultCount = 0;

  for (const [section, tests] of SECTIONS) {
    const lines = [];
    for (const [key, label, unit, ref] of tests) {
      const raw = data[key];
      if (isBlank(raw)) continue;

      const value = String(raw).trim();
      const num = parseNumeric(value);
      const flag = flagFor(num, ref, sex);
      const range = describeRange(ref, sex);

      let line = `- ${label}: ${value}`;
      if (num !== null && unit) line += ` ${unit}`;
      if (range) line += ` (ref ${range}${unit ? ' ' + unit : ''})`;
      if (flag) line += ` -> ${flag}`;
      lines.push(line);
      resultCount++;
    }
    if (lines.length) blocks.push(`${section}:\n${lines.join('\n')}`);
  }

  if (resultCount === 0) return null;

  const patient = [
    `Age: ${isBlank(data.age) ? 'not stated' : data.age + ' years'}`,
    `Sex: ${sex === 'M' ? 'Male' : sex === 'F' ? 'Female' : 'not stated'}`,
  ].join('\n');

  return `${patient}\n\n${blocks.join('\n\n')}`;
}

/**
 * Returns the interpretation text, or null when it could not be produced
 * (no results, API error, empty reply). Callers must not store a null result.
 */
async function interpretReport(openai, report) {
  const input = buildInterpretationInput(report);
  if (!input) return null;

  try {
    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      temperature: 0.2,
      max_tokens: 450,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: input },
      ],
    });

    const text = response.choices?.[0]?.message?.content?.trim();
    return text || null;
  } catch (error) {
    console.error('Report interpretation error:', error.response?.data || error.message);
    return null;
  }
}

module.exports = { interpretReport, buildInterpretationInput, SYSTEM_PROMPT };
