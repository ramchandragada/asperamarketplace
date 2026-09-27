export type NotificationInput = {
  channel: "email" | "sms" | "in_app";
  recipient: string;
  templateKey: string;
  payload: Record<string, unknown>;
};

export type NotificationResult = {
  providerRef: string;
  status: "sent" | "queued";
};

export interface NotificationPort {
  send(input: NotificationInput): Promise<NotificationResult>;
}

export class LocalNotificationAdapter implements NotificationPort {
  async send(input: NotificationInput): Promise<NotificationResult> {
    const providerRef = `local_${input.channel}_${Date.now()}`;
    // Development adapter only — does not send real messages.
    console.info(
      JSON.stringify({
        level: "info",
        msg: "notification.local",
        channel: input.channel,
        templateKey: input.templateKey,
        recipient: input.recipient,
        providerRef,
      }),
    );
    return { providerRef, status: "sent" };
  }
}

export function getNotificationPort(): NotificationPort {
  return new LocalNotificationAdapter();
}
