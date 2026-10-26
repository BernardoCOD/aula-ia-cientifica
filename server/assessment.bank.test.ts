import { describe, expect, it } from "vitest";
import {
  postestQuestions,
  pretestQuestions,
  validateAssessmentBank,
} from "../client/src/lib/assessment";

describe("assessment question banks", () => {
  it("keeps exactly ten valid questions in each form", () => {
    expect(validateAssessmentBank(pretestQuestions)).toBe(true);
    expect(validateAssessmentBank(postestQuestions)).toBe(true);
    expect(pretestQuestions).toHaveLength(10);
    expect(postestQuestions).toHaveLength(10);
  });

  it("keeps equivalent content and capacity coverage without repeating the item text", () => {
    expect(new Set(pretestQuestions.map(item => item.text)).size).toBe(10);
    expect(new Set(postestQuestions.map(item => item.text)).size).toBe(10);
    expect(postestQuestions.map(item => item.content)).toEqual(
      pretestQuestions.map(item => item.content)
    );
    expect(postestQuestions.map(item => item.capacity)).toEqual(
      pretestQuestions.map(item => item.capacity)
    );
    expect(postestQuestions.map(item => item.text)).not.toEqual(
      pretestQuestions.map(item => item.text)
    );
    expect(pretestQuestions.every(item => item.options.length === 4)).toBe(
      true
    );
    expect(postestQuestions.every(item => item.options.length === 4)).toBe(
      true
    );
  });
});
