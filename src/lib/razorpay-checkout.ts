/**
 * Browser helper: open Razorpay Checkout.js after /api/payments/start.
 * Paid status is set only by the verified webhook — not by this client callback.
 */

export type RazorpayCheckoutInput = {
  keyId: string;
  orderId: string;
  amountPaise: number;
  currencyCode?: string;
  name?: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  onDismiss?: () => void;
};

type RazorpayConstructor = new (options: Record<string, unknown>) => {
  open: () => void;
};

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadCheckoutScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay Checkout requires a browser"));
  }
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-aspera-razorpay="1"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Razorpay Checkout")),
      );
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.dataset.asperaRazorpay = "1";
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Failed to load Razorpay Checkout"));
    document.body.appendChild(script);
  });
  return scriptPromise;
}

export async function openRazorpayCheckout(
  input: RazorpayCheckoutInput,
): Promise<"opened" | "dismissed"> {
  await loadCheckoutScript();
  if (!window.Razorpay) {
    throw new Error("Razorpay Checkout failed to initialize");
  }

  return new Promise((resolve) => {
    const rzp = new window.Razorpay!({
      key: input.keyId,
      amount: input.amountPaise,
      currency: input.currencyCode ?? "INR",
      name: input.name ?? "Aspera Express",
      description: input.description ?? "Prepaid order",
      order_id: input.orderId,
      prefill: input.prefill ?? {},
      theme: { color: "#0b5fff" },
      handler() {
        // Capture is confirmed by webhook — client success only closes the modal.
        resolve("opened");
      },
      modal: {
        ondismiss() {
          input.onDismiss?.();
          resolve("dismissed");
        },
      },
    });
    rzp.open();
  });
}
