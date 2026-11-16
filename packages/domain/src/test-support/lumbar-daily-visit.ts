import { TemplateDefinition } from "../template.js";

/** Synthetic template for tests. Not one of the clinic's real forms. */
export const lumbarDailyVisit = TemplateDefinition.parse({
  id: "tpl_lumbar_daily_visit",
  version: 1,
  name: "Daily Visit: Lumbar (synthetic)",
  documentType: "daily_visit",
  format: "docx",
  fields: [
    {
      id: "subjective.chief_complaint",
      label: "Chief complaint",
      section: "subjective",
      type: "text",
      required: true,
      binding: { kind: "docx.content_control", tag: "subjective.chief_complaint" },
    },
    {
      id: "subjective.pain_side",
      label: "Side",
      section: "subjective",
      type: "choice",
      options: ["left", "right", "bilateral"],
      binding: { kind: "docx.content_control", tag: "subjective.pain_side" },
    },
    {
      id: "objective.kemps_right",
      label: "Kemp's test, right",
      section: "objective",
      type: "checkbox",
      binding: { kind: "docx.content_control", tag: "objective.kemps_right" },
    },
    {
      id: "objective.lumbar_flexion_deg",
      label: "Lumbar flexion",
      section: "objective",
      type: "number",
      unit: "deg",
      min: 0,
      max: 120,
      binding: { kind: "docx.content_control", tag: "objective.lumbar_flexion_deg" },
    },
    {
      id: "plan.treatment_performed",
      label: "Treatment performed",
      section: "plan",
      type: "text",
      required: true,
      binding: { kind: "docx.content_control", tag: "plan.treatment_performed" },
    },
  ],
});

export const sampleDictation =
  "Patient has been experiencing right-sided low back pain for three weeks. " +
  "Worse with extension and prolonged sitting. Positive Kemp’s on the right. " +
  "Lumbar flexion 45 degrees. Performed lumbar adjustments and myofascial release.";
