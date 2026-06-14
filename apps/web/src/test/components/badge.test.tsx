import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "@/components/ui/badge";

describe("Badge", () => {
  it("renders children", () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("applies default variant classes", () => {
    const { container } = render(<Badge>Label</Badge>);
    expect(container.firstChild).toHaveClass("bg-primary");
  });

  it("applies destructive variant classes", () => {
    const { container } = render(<Badge variant="destructive">Error</Badge>);
    expect(container.firstChild).toHaveClass("bg-destructive");
  });

  it("applies outline variant classes", () => {
    const { container } = render(<Badge variant="outline">Draft</Badge>);
    expect(container.firstChild).toHaveClass("text-foreground");
  });

  it("merges custom className", () => {
    const { container } = render(<Badge className="my-custom">Tag</Badge>);
    expect(container.firstChild).toHaveClass("my-custom");
  });
});
