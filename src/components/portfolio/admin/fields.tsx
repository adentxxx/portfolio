"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRef, type ReactNode } from "react";

export const inputClass =
  "w-full rounded-[12px] border border-border-default bg-surface-page px-3 py-2 text-subheadline text-text-primary outline-none focus-visible:border-accent-primary disabled:opacity-50";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-caption1 text-text-muted">{label}</span>
      <div className="mt-1">{children}</div>
      {hint ? (
        <span className="mt-1 block text-caption2 text-text-muted">{hint}</span>
      ) : null}
    </label>
  );
}

export function Status({
  message,
  error,
}: {
  message: string | null;
  error: string | null;
}) {
  if (!message && !error) return null;
  return (
    <p
      role="status"
      className={cn(
        "rounded-[16px] bg-surface-card px-4 py-3 text-subheadline",
        error ? "text-accent-information" : "text-accent-primary",
      )}
    >
      {error ?? message}
    </p>
  );
}

export function FileButton({
  label,
  multiple = false,
  disabled = false,
  onFiles,
}: {
  label: string;
  multiple?: boolean;
  disabled?: boolean;
  onFiles: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,.png,.jpg,.jpeg,.webp,.gif,.svg"
        multiple={multiple}
        className="sr-only"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          if (files.length > 0) onFiles(files);
        }}
      />
      <Button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        {label}
      </Button>
    </>
  );
}

function DeleteIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M10.0002 1.04167C7.81404 1.04167 6.04183 2.81388 6.04183 5.00001V5.20834H3.3335C2.98832 5.20834 2.7085 5.48816 2.7085 5.83334C2.7085 6.17852 2.98832 6.45834 3.3335 6.45834H16.6668C17.012 6.45834 17.2918 6.17852 17.2918 5.83334C17.2918 5.48816 17.012 5.20834 16.6668 5.20834H13.9585V5.00001C13.9585 2.81388 12.1863 1.04167 10.0002 1.04167ZM10.0002 2.29167C11.4959 2.29167 12.7085 3.50423 12.7085 5.00001V5.20834H7.29183V5.00001C7.29183 3.50423 8.50439 2.29167 10.0002 2.29167Z"
        fillRule="evenodd"
        clipRule="evenodd"
        fill="#E20000"
      />
      <path
        d="M4.78903 7.44089C4.75638 7.09726 4.45134 6.84516 4.10771 6.87781C3.76408 6.91046 3.51198 7.21549 3.54463 7.55912C3.62336 8.38769 3.76543 9.4086 3.94806 10.7209L4.18268 12.4068C4.40699 14.0191 4.5342 14.9334 4.80941 15.6825C5.32158 17.0765 6.23521 18.194 7.41021 18.6899C8.04827 18.9591 8.7781 18.9588 9.8646 18.9584H10.1357C11.2222 18.9588 11.9521 18.9591 12.5901 18.6899C13.7651 18.194 14.6787 17.0765 15.1909 15.6825C15.4661 14.9334 15.5933 14.0191 15.8176 12.4068L16.0523 10.7209C16.2349 9.4086 16.377 8.38769 16.4557 7.55912C16.4883 7.21549 16.2362 6.91046 15.8926 6.87781C15.549 6.84516 15.2439 7.09726 15.2113 7.44089C15.1354 8.23919 14.9972 9.23336 14.8121 10.5634L14.5935 12.1343C14.3514 13.874 14.2405 14.6446 14.0176 15.2514C13.5877 16.4215 12.8728 17.2138 12.1041 17.5382C11.729 17.6965 11.2745 17.7083 10.0002 17.7083C8.72586 17.7083 8.27136 17.6965 7.89619 17.5382C7.12749 17.2138 6.41263 16.4215 5.98272 15.2514C5.75979 14.6446 5.64892 13.874 5.40681 12.1343L5.1882 10.5634C5.00309 9.23336 4.86488 8.23919 4.78903 7.44089Z"
        fill="#E20000"
      />
      <path
        d="M8.9585 8.33334C8.9585 7.98816 8.67867 7.70834 8.3335 7.70834C7.98832 7.70834 7.7085 7.98816 7.7085 8.33334V15C7.7085 15.3452 7.98832 15.625 8.3335 15.625C8.67867 15.625 8.9585 15.3452 8.9585 15V8.33334Z"
        fill="#E20000"
      />
      <path
        d="M12.2918 8.33334C12.2918 7.98816 12.012 7.70834 11.6668 7.70834C11.3217 7.70834 11.0418 7.98816 11.0418 8.33334V15C11.0418 15.3452 11.3217 15.625 11.6668 15.625C12.012 15.625 12.2918 15.3452 12.2918 15V8.33334Z"
        fill="#E20000"
      />
    </svg>
  );
}

const movePaths = {
  left: "M11.2265 14.6106C11.4717 14.8535 11.8674 14.8518 12.1104 14.6066C12.3534 14.3614 12.3516 13.9657 12.1065 13.7227L10.6373 12.2666C10.0411 11.6757 9.63208 11.269 9.35533 10.9244C9.0865 10.5896 8.99427 10.3746 8.96973 10.1821C8.95432 10.0612 8.95432 9.93881 8.96973 9.81789C8.99427 9.62533 9.0865 9.41031 9.35533 9.07557C9.63208 8.73096 10.0411 8.32426 10.6373 7.73331L12.1065 6.27722C12.3516 6.03424 12.3534 5.63851 12.1104 5.39335C11.8674 5.14818 11.4717 5.14642 11.2265 5.3894L9.73093 6.87173C9.16762 7.43001 8.70722 7.8863 8.38072 8.29286C8.04119 8.71563 7.79542 9.14475 7.72976 9.65985C7.70097 9.8857 7.70097 10.1143 7.72976 10.3401C7.79542 10.8552 8.04119 11.2843 8.38072 11.7071C8.70722 12.1137 9.16762 12.5699 9.73093 13.1282L11.2265 14.6106Z",
  right:
    "M8.77346 14.6106C8.5283 14.8535 8.13257 14.8518 7.88959 14.6066C7.6466 14.3614 7.64837 13.9657 7.89353 13.7227L9.36267 12.2666C9.95892 11.6757 10.3679 11.269 10.6447 10.9244C10.9135 10.5896 11.0057 10.3746 11.0303 10.1821C11.0457 10.0612 11.0457 9.93881 11.0303 9.81789C11.0057 9.62533 10.9135 9.41031 10.6447 9.07557C10.3679 8.73096 9.95892 8.32426 9.36267 7.73331L7.89353 6.27722C7.64837 6.03424 7.6466 5.63851 7.88959 5.39335C8.13257 5.14818 8.5283 5.14642 8.77346 5.3894L10.2691 6.87173C10.8324 7.43001 11.2928 7.8863 11.6193 8.29286C11.9588 8.71563 12.2046 9.14475 12.2702 9.65985C12.299 9.8857 12.299 10.1143 12.2702 10.3401C12.2046 10.8552 11.9588 11.2843 11.6193 11.7071C11.2928 12.1137 10.8324 12.5699 10.2691 13.1282L8.77346 14.6106Z",
  up: "M9.81808 8.96987C9.93899 8.95446 10.0613 8.95446 10.1822 8.96987C10.3748 8.99442 10.5898 9.08664 10.9246 9.35547C11.2692 9.63222 11.6759 10.0412 12.2668 10.6375L13.7229 12.1066C13.9659 12.3518 14.3616 12.3535 14.6068 12.1106C14.852 11.8676 14.8537 11.4718 14.6107 11.2267L13.1284 9.73107C12.5701 9.16776 12.1138 8.70736 11.7073 8.38086C11.2845 8.04134 10.8554 7.79556 10.3403 7.7299C10.1144 7.70112 9.88588 7.70112 9.66003 7.7299C9.14493 7.79556 8.71582 8.04134 8.29305 8.38086C7.88648 8.70737 7.43019 9.16776 6.87191 9.73108L5.38959 11.2267C5.1466 11.4718 5.14837 11.8676 5.39353 12.1106C5.63869 12.3535 6.03442 12.3518 6.27741 12.1066L7.73349 10.6375C8.32444 10.0412 8.73114 9.63223 9.07575 9.35547C9.4105 9.08664 9.62551 8.99442 9.81808 8.96987Z",
  down: "M14.6107 8.77328C14.8537 8.52811 14.852 8.13239 14.6068 7.8894C14.3616 7.64642 13.9659 7.64818 13.7229 7.89335L12.2668 9.36249C11.6759 9.95873 11.2692 10.3677 10.9246 10.6445C10.5898 10.9133 10.3748 11.0055 10.1822 11.0301C10.0613 11.0455 9.93899 11.0455 9.81808 11.0301C9.62551 11.0055 9.4105 10.9133 9.07575 10.6445C8.73114 10.3677 8.32444 9.95873 7.7335 9.36249L6.27741 7.89335C6.03442 7.64818 5.63869 7.64642 5.39353 7.8894C5.14837 8.13239 5.1466 8.52812 5.38959 8.77328L6.87191 10.2689C7.4302 10.8322 7.88649 11.2926 8.29305 11.6191C8.71582 11.9586 9.14493 12.2044 9.66003 12.2701C9.88588 12.2988 10.1144 12.2988 10.3403 12.2701C10.8554 12.2044 11.2845 11.9586 11.7073 11.6191C12.1138 11.2926 12.5701 10.8322 13.1284 10.2689L14.6107 8.77328Z",
} as const;

function MoveIcon({ direction }: { direction: keyof typeof movePaths }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d={movePaths[direction]} fill="currentColor" />
    </svg>
  );
}

export function MoveButton({
  direction,
  label,
  disabled = false,
  onClick,
}: {
  direction: keyof typeof movePaths;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button type="button" aria-label={label} disabled={disabled} onClick={onClick}>
      <MoveIcon direction={direction} />
    </Button>
  );
}

export function TrashButton({
  label = "Удалить",
  disabled = false,
  onClick,
  className,
}: {
  label?: string;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <Button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={className}
    >
      <DeleteIcon />
    </Button>
  );
}

export function CheckField({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-subheadline text-text-primary">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 accent-accent-primary"
      />
      {label}
    </label>
  );
}
