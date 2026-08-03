// Unit tests for the shipped outbound-click tracker.
//
// Imports ../../public/outbound.js directly — the file the browser actually
// loads — so there is no second copy that can drift out of sync with the tests.
// This is the only thing standing between "outbound link tracking works" and
// "outbound link tracking silently records nothing", because a broken classifier
// produces no error anywhere: the link still navigates, the page still works,
// and the dashboard simply stays empty.

import { describe, expect, it } from "vitest";

import { classify, isDownload, isOutbound } from "../../public/outbound.js";

const HOST = "thulanimaseko.co.za";

describe("isOutbound", () => {
  it.each([
    ["https://github.com/maseko-lucky-9", true, "external host"],
    ["https://www.linkedin.com/in/thulani", true, "external host, www"],
    ["https://thulanimaseko.co.za/blog", false, "same host, absolute"],
    ["/blog", false, "same host, root-relative"],
    ["blog/post", false, "same host, path-relative"],
    ["#contact", false, "in-page anchor"],
    ["", false, "empty href"],
    ["//github.com", true, "protocol-relative"],
    ["https://thulanimaseko.co.za:8443/x", true, "same hostname, different port"],
    ["mailto:ltmaseko7@gmail.com", true, "mailto is a contact conversion"],
    ["tel:+27000000000", true, "tel is a contact conversion"],
    ["javascript:void(0)", false, "javascript: is in-page behaviour"],
    ["data:text/plain,hi", false, "data: is not a departure"],
  ])("%s -> %s (%s)", (href, expected) => {
    expect(isOutbound(href, HOST)).toBe(expected);
  });

  it("compares host, not hostname — a different port is a different origin", () => {
    // Guards a plausible refactor to link.hostname, which would silently stop
    // counting anything served from a non-default port.
    expect(isOutbound("https://thulanimaseko.co.za:8443/x", HOST)).toBe(true);
    expect(isOutbound("https://thulanimaseko.co.za/x", HOST)).toBe(false);
  });

  it("does not throw on an unparseable href", () => {
    expect(() => isOutbound("ht!tp://[[[", HOST)).not.toThrow();
    expect(isOutbound("ht!tp://[[[", HOST)).toBe(false);
  });
});

describe("isDownload", () => {
  it.each([
    ["/resume.pdf", true, "the CV — highest-value signal in a job search"],
    ["/resume.PDF", true, "extension match is case-insensitive"],
    ["https://thulanimaseko.co.za/resume.pdf", true, "absolute same-origin"],
    ["/resume.pdf?v=2", true, "query string is not part of the extension"],
    ["/blog", false, "no extension"],
    ["/blog/some.post/index", false, "dot in a directory, not the filename"],
    ["mailto:x@y.com", false, "not an http(s) URL"],
  ])("%s -> %s (%s)", (href, expected) => {
    expect(isDownload(href, HOST)).toBe(expected);
  });
});

describe("classify", () => {
  it("reports an external link as outbound-link-click", () => {
    expect(classify("https://github.com/x", HOST)).toEqual({
      name: "outbound-link-click",
      url: "https://github.com/x",
    });
  });

  it("reports a same-origin CV download as file-download", () => {
    expect(classify("/resume.pdf", HOST)).toEqual({
      name: "file-download",
      url: "/resume.pdf",
    });
  });

  it("reports ordinary internal navigation as nothing", () => {
    // Umami already counts these as pageviews; emitting an event too would
    // double-count every internal click.
    expect(classify("/blog", HOST)).toBeNull();
    expect(classify("#contact", HOST)).toBeNull();
  });

  it("prefers outbound over download for an external file", () => {
    // An external PDF is someone else's document — it belongs in the outbound
    // report, not in the CV-download conversion count.
    expect(classify("https://example.com/paper.pdf", HOST)?.name).toBe("outbound-link-click");
  });
});
