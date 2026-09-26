import { beforeEach, describe, expect, it, vi } from "vitest";

const rootMock = vi.hoisted(() => ({ render: vi.fn() }));

vi.mock("react-dom/client", () => ({
  createRoot: vi.fn(() => rootMock),
}));

vi.mock("./App.tsx", () => ({ default: () => null }));

import { createRoot } from "react-dom/client";

describe("application entry point", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '<div id="root"></div>';
  });

  it("mounts the app into the root element", async () => {
    await import("./main");

    expect(createRoot).toHaveBeenCalledWith(document.getElementById("root"));
    expect(rootMock.render).toHaveBeenCalledOnce();
  });
});