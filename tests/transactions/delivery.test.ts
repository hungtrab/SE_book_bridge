import { describe, expect, it } from "vitest";

import { ShipSchema } from "@/server/transactions/service";

describe("ship delivery validation", () => {
  it("accepts in-person handoff without a tracking number", () => {
    expect(ShipSchema.safeParse({ deliveryMethod: "IN_PERSON" }).success).toBe(true);
  });

  it("ignores a stray tracking number for in-person", () => {
    expect(ShipSchema.safeParse({ deliveryMethod: "IN_PERSON", trackingNumber: "X1" }).success).toBe(true);
  });

  it("requires a tracking number for postal delivery", () => {
    expect(ShipSchema.safeParse({ deliveryMethod: "POSTAL" }).success).toBe(false);
    expect(ShipSchema.safeParse({ deliveryMethod: "POSTAL", trackingNumber: "" }).success).toBe(false);
  });

  it("accepts postal delivery with a tracking number", () => {
    expect(ShipSchema.safeParse({ deliveryMethod: "POSTAL", trackingNumber: "VN123456789" }).success).toBe(true);
  });

  it("rejects an unknown delivery method", () => {
    expect(ShipSchema.safeParse({ deliveryMethod: "DRONE" }).success).toBe(false);
  });
});
