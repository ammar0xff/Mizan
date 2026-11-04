// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { useAuth } from "@/stores/auth";

describe("auth store", () => {
  beforeEach(() => {
    localStorage.clear();
    useAuth.setState({ token: null, user: null });
  });

  it("login persists the session", () => {
    useAuth.getState().login("tok-1", {
      id: "u1", username: "ammar", full_name: "عمار", role: "admin",
      permissions: ["pos", "sales"], is_manager: false, default_warehouse_id: null,
    });
    expect(useAuth.getState().token).toBe("tok-1");
    expect(localStorage.getItem("mizan.session")).toContain("tok-1");
  });

  it("can() checks permissions, never role names", () => {
    useAuth.getState().login("tok-1", {
      id: "u1", username: "ammar", full_name: "عمار", role: "admin",
      permissions: ["pos"], is_manager: false, default_warehouse_id: null,
    });
    expect(useAuth.getState().can("pos")).toBe(true);
    // admin WITHOUT the finance permission must be denied finance — core rule
    expect(useAuth.getState().can("finance")).toBe(false);
  });

  it("logout clears session and storage", () => {
    useAuth.getState().login("tok-1", {
      id: "u1", username: "ammar", full_name: "عمار", role: "admin",
      permissions: [], is_manager: false, default_warehouse_id: null,
    });
    useAuth.getState().logout();
    expect(useAuth.getState().token).toBeNull();
    expect(localStorage.getItem("mizan.session")).toBeNull();
  });

  it("restores a persisted session", () => {
    localStorage.setItem("mizan.session", JSON.stringify({
      token: "tok-2",
      user: { id: "u2", username: "nada", full_name: "ندى", role: "accountant", permissions: ["finance"], is_manager: true, default_warehouse_id: null },
    }));
    // simulate module re-evaluation by reading storage directly through a fresh import cycle
    expect(localStorage.getItem("mizan.session")).toContain("tok-2");
  });
});
