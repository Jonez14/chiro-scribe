import { lumbarDailyVisit } from "@chiro-scribe/domain/testing";
import type { EvalSuite } from "../eval-case.js";

const PRESENT = "(any text)";

/** Synthetic dictations written for this project. No real patient is described. */
export const lumbarDailyVisitSuite: EvalSuite = {
  template: lumbarDailyVisit,
  cases: [
    {
      name: "complete visit",
      probes: "baseline: every field dictated once, in a natural order",
      transcript:
        "Patient has been experiencing right-sided low back pain for three weeks. Worse with extension and prolonged sitting. Positive Kemp's on the right. Lumbar flexion 45 degrees. Performed lumbar adjustments and myofascial release.",
      expected: {
        "subjective.chief_complaint": PRESENT,
        "subjective.pain_side": "right",
        "objective.kemps_right": true,
        "objective.lumbar_flexion_deg": 45,
        "plan.treatment_performed": PRESENT,
      },
    },
    {
      name: "out of order",
      probes: "information given treatment-first, findings last",
      transcript:
        "Did lumbar adjustments today and gave three home exercises. Flexion measured 60 degrees. Kemp's was positive on the right. She came in with left-sided low back pain after gardening.",
      expected: {
        "subjective.chief_complaint": PRESENT,
        "subjective.pain_side": "left",
        "objective.kemps_right": true,
        "objective.lumbar_flexion_deg": 60,
        "plan.treatment_performed": PRESENT,
      },
    },
    {
      name: "negative finding",
      probes: "an explicitly negative test must be recorded as false, not omitted and not true",
      transcript:
        "Bilateral low back stiffness for two days. Kemp's negative on the right. Lumbar flexion 70 degrees. Performed lumbar adjustments.",
      expected: {
        "subjective.chief_complaint": PRESENT,
        "subjective.pain_side": "bilateral",
        "objective.kemps_right": false,
        "objective.lumbar_flexion_deg": 70,
        "plan.treatment_performed": PRESENT,
      },
    },
    {
      name: "test not performed",
      probes:
        "an unmentioned test and measurement must stay empty, never default to negative or zero",
      transcript:
        "Right-sided low back pain, improving since last visit. Performed lumbar adjustments and myofascial release.",
      expected: {
        "subjective.chief_complaint": PRESENT,
        "subjective.pain_side": "right",
        "plan.treatment_performed": PRESENT,
      },
    },
    {
      name: "wrong-side trap",
      probes: "a left-sided Kemp's must not fill the right-sided Kemp's field",
      transcript:
        "Left-sided low back pain for a week. Positive Kemp's on the left. Lumbar flexion 50 degrees. Performed lumbar adjustments.",
      expected: {
        "subjective.chief_complaint": PRESENT,
        "subjective.pain_side": "left",
        "objective.lumbar_flexion_deg": 50,
        "plan.treatment_performed": PRESENT,
      },
    },
    {
      name: "off-form findings",
      probes: "findings with no field on this form must not be forced into another field",
      transcript:
        "Right-sided low back pain. Straight leg raise negative bilaterally. Cervical rotation 55 degrees on the right. Performed lumbar adjustments.",
      expected: {
        "subjective.chief_complaint": PRESENT,
        "subjective.pain_side": "right",
        "plan.treatment_performed": PRESENT,
      },
    },
    {
      name: "self-correction",
      probes: "the corrected number wins when the clinician restates a measurement",
      transcript:
        "Bilateral low back pain. Lumbar flexion 40 degrees, correction, 50 degrees. Kemp's positive on the right. Performed myofascial release.",
      expected: {
        "subjective.chief_complaint": PRESENT,
        "subjective.pain_side": "bilateral",
        "objective.kemps_right": true,
        "objective.lumbar_flexion_deg": 50,
        "plan.treatment_performed": PRESENT,
      },
    },
  ],
};
