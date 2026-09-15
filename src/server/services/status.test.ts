import { describe, it, expect } from "vitest";
import { nextStatus, availableActions, InvalidTransitionError } from "./status";

describe("nextStatus", () => {
  it("reserved → checked in", () => expect(nextStatus("RESERVED", "CHECK_IN")).toBe("CHECKED_IN"));
  it("checked in → checked out", () => expect(nextStatus("CHECKED_IN", "CHECK_OUT")).toBe("CHECKED_OUT"));
  it("reserved can be cancelled / no-show / void", () => {
    expect(nextStatus("RESERVED", "CANCEL")).toBe("CANCELLED");
    expect(nextStatus("RESERVED", "NO_SHOW")).toBe("NO_SHOW");
    expect(nextStatus("RESERVED", "VOID")).toBe("VOID");
  });
  it("rejects invalid transitions", () => {
    expect(() => nextStatus("CHECKED_IN", "CHECK_IN")).toThrow(InvalidTransitionError);
    expect(() => nextStatus("CHECKED_OUT", "VOID")).toThrow(InvalidTransitionError);
    expect(() => nextStatus("RESERVED", "CHECK_OUT")).toThrow(InvalidTransitionError);
  });
});

describe("availableActions", () => {
  it("lists actions per status", () => {
    expect(availableActions("RESERVED")).toEqual(["CHECK_IN", "CANCEL", "NO_SHOW", "VOID"]);
    expect(availableActions("CHECKED_IN")).toEqual(["CHECK_OUT"]);
    expect(availableActions("VOID")).toEqual([]);
  });
});
