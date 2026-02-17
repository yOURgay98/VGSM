import { describe, expect, it } from "vitest";
import { DispatchCallStatus } from "@prisma/client";

import { checkDispatchCallTransition } from "@/lib/services/dispatch";

describe("dispatch call state machine", () => {
  it("allows expected transitions", () => {
    expect(
      checkDispatchCallTransition({
        current: DispatchCallStatus.OPEN,
        next: DispatchCallStatus.ASSIGNED,
        supervisor: false,
      }).ok,
    ).toBe(true);

    expect(
      checkDispatchCallTransition({
        current: DispatchCallStatus.ASSIGNED,
        next: DispatchCallStatus.ENROUTE,
        supervisor: false,
      }).ok,
    ).toBe(true);
  });

  it("rejects invalid transitions", () => {
    const res = checkDispatchCallTransition({
      current: DispatchCallStatus.OPEN,
      next: DispatchCallStatus.ON_SCENE,
      supervisor: false,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("invalid_transition");
  });

  it("rejects non-supervisor cancellation from a terminal state with supervisor-only reason", () => {
    const res = checkDispatchCallTransition({
      current: DispatchCallStatus.CLEARED,
      next: DispatchCallStatus.CANCELLED,
      supervisor: false,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("supervisor_only_cancel");
  });
});
