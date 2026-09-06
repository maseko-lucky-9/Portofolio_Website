import { experiences } from "@/data/experience";

/** Sourced from personalData's own framing of the career — the one claim the
 *  strip makes beyond the employer list, so it stays a literal constant that
 *  tests can assert against rather than free-floating copy. */
export const TRUST_BADGE = "8+ years in South African banking";

/**
 * The employer marquee.
 *
 * Names as set type, not logos: no employer mark exists in the repo (`logoUrl`
 * is unset on every entry in experience.ts), and an approximated bank mark
 * would be both wrong and read as endorsement — which is a claim this site is
 * not entitled to make.
 *
 * Two identical sets with a trailing gap so the -50% translate lands exactly on
 * the second set's first item; a single set would visibly snap.
 */
export function TrustStrip() {
  const companies = [...new Set(experiences.map((e) => e.company))];
  const set = companies.map((name) => (
    <span className="mq-item" key={name}>
      <b>{name}</b>
    </span>
  ));

  return (
    <div className="trust">
      <div className="mq-row">
        <div className="mq">
          <div className="mq-track">
            <div className="mq-set">{set}</div>
            <div className="mq-set" aria-hidden="true">
              {set}
            </div>
          </div>
        </div>
        <span className="mono tiny mq-badge">
          [ <span className="tick">&#10003;</span> ] {TRUST_BADGE}
        </span>
      </div>
    </div>
  );
}
