"use client";

import { useState, useTransition } from "react";
import { Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { updateProfile } from "@/app/dashboard/actions";

export function EditProfileForm({
  firstName,
  lastName,
  restaurantName,
}: {
  firstName: string | null;
  lastName: string | null;
  restaurantName: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await updateProfile(formData);
        setSaved(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField label="Prénom" htmlFor="first_name">
          <Input id="first_name" name="first_name" defaultValue={firstName ?? ""} />
        </FormField>
        <FormField label="Nom" htmlFor="last_name">
          <Input id="last_name" name="last_name" defaultValue={lastName ?? ""} />
        </FormField>
      </div>
      <FormField label="Restaurant" htmlFor="restaurant_name">
        <Input id="restaurant_name" name="restaurant_name" defaultValue={restaurantName ?? ""} />
      </FormField>

      {error && (
        <p className="rounded-(--radius-sm) bg-danger-soft px-3.5 py-2.5 text-[13px] text-danger-text">
          {error}
        </p>
      )}

      <Button type="submit" variant="secondary" size="md" disabled={isPending} className="w-fit">
        {isPending ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            Enregistrement…
          </>
        ) : saved ? (
          <>
            <Check size={15} />
            Enregistré
          </>
        ) : (
          "Enregistrer"
        )}
      </Button>
    </form>
  );
}
