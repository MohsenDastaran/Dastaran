import { useId, useState } from "react";
import { Label } from "./ui/label";
import { AtIcon } from "@phosphor-icons/react/dist/ssr/At";
import { CheckCircleIcon } from "@phosphor-icons/react/dist/ssr/CheckCircle";
import { CircleNotchIcon } from "@phosphor-icons/react/dist/ssr/CircleNotch";
import { IdentificationBadgeIcon } from "@phosphor-icons/react/dist/ssr/IdentificationBadge";
import { PaperPlaneTiltIcon } from "@phosphor-icons/react/dist/ssr/PaperPlaneTilt";
import { PhoneTransferIcon } from "@phosphor-icons/react/dist/ssr/PhoneTransfer";
import { TextAlignLeftIcon } from "@phosphor-icons/react/dist/ssr/TextAlignLeft";
import { TextboxIcon } from "@phosphor-icons/react/dist/ssr/Textbox";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import FormMessage from "./FormMessage";
import FormItem from "./FormItem";
import { contactPayloadSchema } from "@/lib/definitions";

const SEND_ERROR = "Failed to send the message. Please try again later.";

type FieldErrors = Partial<Record<string, Array<string>>>;

function fieldErrorsFromZod(error: {
  issues: Array<{ path: Array<PropertyKey>; message: string }>;
}): FieldErrors {
  const fieldErrors: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (!key) {
      continue;
    }
    const existing = fieldErrors[key] ?? [];
    fieldErrors[key] = [...existing, issue.message];
  }
  return fieldErrors;
}

export default function ContactForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const formId = useId();
  const [isPending, setIsPending] = useState(false);
  const [didSucceed, setDidSucceed] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function onSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const parsed = contactPayloadSchema.safeParse(
      Object.fromEntries(new FormData(form).entries()),
    );

    if (!parsed.success) {
      setDidSucceed(false);
      setFormError(null);
      setFieldErrors(fieldErrorsFromZod(parsed.error));
      return;
    }

    setFieldErrors({});
    setFormError(null);
    setDidSucceed(false);
    setIsPending(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsed.data),
      });

      if (!response.ok) {
        setFormError(SEND_ERROR);
        return;
      }

      setDidSucceed(true);
      form.reset();
    } catch {
      setFormError(SEND_ERROR);
    } finally {
      setIsPending(false);
    }
  }

  const emailId = `${formId}-email`;
  const nameId = `${formId}-name`;
  const subjectId = `${formId}-subject`;
  const phoneId = `${formId}-phone`;
  const messageId = `${formId}-message`;

  return (
    <form
      className={cn(
        `inline-grid w-full grid-cols-1 gap-4 rounded-xl border bg-card p-4
        offset-border @lg:grid-cols-2`,
        className,
      )}
      noValidate
      {...props}
      onSubmit={onSubmit}
    >
      <FormItem>
        <Label htmlFor={emailId}>
          <AtIcon weight="duotone" size={20} />
          Email
        </Label>
        <Input
          id={emailId}
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={Boolean(fieldErrors.email)}
          placeholder="john.doe@example.com"
        />
        <FormMessage>{fieldErrors.email?.join(" ")}</FormMessage>
      </FormItem>
      <FormItem>
        <Label htmlFor={nameId}>
          <IdentificationBadgeIcon weight="duotone" size={20} />
          Name
        </Label>
        <Input
          id={nameId}
          name="name"
          type="text"
          autoComplete="name"
          aria-invalid={Boolean(fieldErrors.name)}
          placeholder="John Doe"
        />
        <FormMessage>{fieldErrors.name?.join(" ")}</FormMessage>
      </FormItem>
      <FormItem>
        <Label htmlFor={subjectId}>
          <TextboxIcon weight="duotone" size={20} />
          Subject
        </Label>
        <Input
          id={subjectId}
          name="subject"
          type="text"
          aria-invalid={Boolean(fieldErrors.subject)}
          placeholder="What can I help you with?"
        />
        <FormMessage>{fieldErrors.subject?.join(" ")}</FormMessage>
      </FormItem>
      <FormItem>
        <Label htmlFor={phoneId}>
          <PhoneTransferIcon weight="duotone" size={20} />
          Phone
        </Label>
        <Input
          id={phoneId}
          name="phone"
          type="tel"
          autoComplete="tel"
          aria-invalid={Boolean(fieldErrors.phone)}
          placeholder="+49 12345 6789"
        />
        <FormMessage>{fieldErrors.phone?.join(" ")}</FormMessage>
      </FormItem>

      <FormItem className="@lg:col-span-2">
        <Label htmlFor={messageId}>
          <TextAlignLeftIcon weight="duotone" size={20} />
          Message
        </Label>
        <Textarea
          id={messageId}
          name="message"
          required
          minLength={10}
          maxLength={500}
          aria-invalid={Boolean(fieldErrors.message)}
          placeholder="Type your message here."
        />
        <FormMessage>{fieldErrors.message?.join(" ")}</FormMessage>
      </FormItem>
      <div className="hidden" aria-hidden="true">
        <label>
          Company
          <input
            type="text"
            name="company"
            autoComplete="one-time-code"
            tabIndex={-1}
          />
        </label>
      </div>
      {formError ? (
        <FormMessage
          className="col-span-full items-start rounded-md border border-red-200
            bg-red-50 p-2 dark:border-red-900 dark:bg-red-950"
          iconSize={20}
        >
          {formError}
        </FormMessage>
      ) : null}
      {didSucceed ? (
        <FormMessage
          className="col-span-full items-start rounded-md border border-sky-200
            bg-sky-50 p-2 text-sky-600 dark:border-sky-900 dark:bg-sky-950
            dark:text-sky-400"
          icon={CheckCircleIcon}
          iconSize={20}
        >
          Thank you for your message! I will get back to you as soon as
          possible.
        </FormMessage>
      ) : null}
      <Button className="col-span-full" type="submit" disabled={isPending}>
        {isPending ? (
          <>
            Sending
            <CircleNotchIcon
              className="animate-spin"
              weight="duotone"
              size={20}
            />
          </>
        ) : (
          <>
            Submit
            <PaperPlaneTiltIcon weight="duotone" size={20} />
          </>
        )}
      </Button>
    </form>
  );
}
