import { useStore } from "@tanstack/react-form";
import type { ReactNode } from "react";
import { Button } from "~/components/ui/button";
import { Field as UIField } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select as ShadcnSelect,
  SelectContent as ShadcnSelectContent,
  SelectGroup as ShadcnSelectGroup,
  SelectItem as ShadcnSelectItem,
  SelectLabel as ShadcnSelectLabel,
  SelectTrigger as ShadcnSelectTrigger,
  SelectValue as ShadcnSelectValue,
} from "~/components/ui/select";
import { Slider as ShadcnSlider } from "~/components/ui/slider";
import { Switch as ShadcnSwitch } from "~/components/ui/switch";
import { Textarea as ShadcnTextarea } from "~/components/ui/textarea";
import { useFieldContext, useFormContext } from "~/hooks/form-context";

export function Field({ children }: { children: ReactNode }) {
  return <UIField>{children}</UIField>;
}

export function SubscribeButton({ label }: { label: string }) {
  const form = useFormContext();
  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <Button disabled={isSubmitting} type="submit">
          {label}
        </Button>
      )}
    </form.Subscribe>
  );
}

function ErrorMessages({
  errors,
}: {
  errors: Array<string | { message: string }>;
}) {
  return (
    <>
      {errors.map((error) => (
        <div
          className="mt-1 font-bold text-destructive"
          key={typeof error === "string" ? error : error.message}
        >
          {typeof error === "string" ? error : error.message}
        </div>
      ))}
    </>
  );
}

export function TextField({
  label,
  placeholder,
}: {
  label: string;
  placeholder?: string;
}) {
  const field = useFieldContext<string>();
  const errors = useStore(field.store, (state) => state.meta.errors);

  return (
    <div>
      <Label className="mb-2 font-bold text-xl" htmlFor={label}>
        {label}
      </Label>
      <Input
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        placeholder={placeholder}
        value={field.state.value}
      />
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
  );
}

export function TextArea({
  label,
  rows = 3,
}: {
  label: string;
  rows?: number;
}) {
  const field = useFieldContext<string>();
  const errors = useStore(field.store, (state) => state.meta.errors);

  return (
    <div>
      <Label className="mb-2 font-bold text-xl" htmlFor={label}>
        {label}
      </Label>
      <ShadcnTextarea
        id={label}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        rows={rows}
        value={field.state.value}
      />
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
  );
}

export function Select({
  label,
  values,
  placeholder,
}: {
  label: string;
  values: Array<{ label: string; value: string }>;
  placeholder?: string;
}) {
  const field = useFieldContext<string>();
  const errors = useStore(field.store, (state) => state.meta.errors);
  const currentValue = field.state.value ?? "";

  return (
    <div>
      <ShadcnSelect
        name={field.name}
        onValueChange={(value) => {
          field.handleChange(value ?? "");
        }}
        value={currentValue}
      >
        <ShadcnSelectTrigger className="w-full">
          <ShadcnSelectValue>
            {currentValue
              ? values.find((v) => v.value === currentValue)?.label
              : placeholder}
          </ShadcnSelectValue>
        </ShadcnSelectTrigger>
        <ShadcnSelectContent>
          <ShadcnSelectGroup>
            <ShadcnSelectLabel>{label}</ShadcnSelectLabel>
            {values.map((value) => (
              <ShadcnSelectItem key={value.value} value={value.value}>
                {value.label}
              </ShadcnSelectItem>
            ))}
          </ShadcnSelectGroup>
        </ShadcnSelectContent>
      </ShadcnSelect>
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
  );
}

export function Slider({ label }: { label: string }) {
  const field = useFieldContext<number>();
  const errors = useStore(field.store, (state) => state.meta.errors);

  return (
    <div>
      <Label className="mb-2 font-bold text-xl" htmlFor={label}>
        {label}
      </Label>
      <ShadcnSlider
        id={label}
        onBlur={field.handleBlur}
        onValueChange={(value) =>
          field.handleChange(Array.isArray(value) ? value[0] : value)
        }
        value={[field.state.value]}
      />
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
  );
}

export function Switch({ label }: { label: string }) {
  const field = useFieldContext<boolean>();
  const errors = useStore(field.store, (state) => state.meta.errors);

  return (
    <div>
      <div className="flex items-center gap-2">
        <ShadcnSwitch
          checked={field.state.value}
          id={label}
          onBlur={field.handleBlur}
          onCheckedChange={(checked) => field.handleChange(checked)}
        />
        <Label htmlFor={label}>{label}</Label>
      </div>
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
  );
}
