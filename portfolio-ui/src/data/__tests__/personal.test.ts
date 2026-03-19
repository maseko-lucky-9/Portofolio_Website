import { describe, it, expect } from "vitest";
import { personalData } from "@/data/personal";

describe("personalData validation", () => {
  it("tagline is under 200 characters", () => {
    expect(personalData.tagline.length).toBeLessThan(200);
  });

  it('LinkedIn URL starts with "https://"', () => {
    expect(personalData.social.linkedin).toMatch(/^https:\/\//);
  });

  it("email is valid format (contains @ and .)", () => {
    expect(personalData.email).toMatch(/.+@.+\..+/);
  });

  it("name is not empty", () => {
    expect(personalData.name.trim().length).toBeGreaterThan(0);
  });

  it("all social URLs are defined", () => {
    expect(personalData.social.github).toBeDefined();
    expect(personalData.social.github.length).toBeGreaterThan(0);

    expect(personalData.social.linkedin).toBeDefined();
    expect(personalData.social.linkedin.length).toBeGreaterThan(0);

    expect(personalData.social.twitter).toBeDefined();
    expect(personalData.social.twitter.length).toBeGreaterThan(0);

    expect(personalData.social.calendar).toBeDefined();
    expect(personalData.social.calendar.length).toBeGreaterThan(0);
  });

  it("GitHub URL starts with https://", () => {
    expect(personalData.social.github).toMatch(/^https:\/\//);
  });

  it("title is not empty", () => {
    expect(personalData.title.trim().length).toBeGreaterThan(0);
  });
});
