'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { LeadsContext } from '@/context/LeadsContext';
import { Lead, LEAD_TRAITS, LEAD_INTENT_OPTIONS, LEAD_INTEREST_OPTIONS, ACTION_COMMITTED_OPTIONS } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  intent: z.enum(LEAD_INTENT_OPTIONS),
  interest: z.enum(LEAD_INTEREST_OPTIONS),
  action: z.enum(ACTION_COMMITTED_OPTIONS),
  traits: z.array(z.enum(LEAD_TRAITS)).optional().default([]),
});

type InteractionFormProps = {
  lead: Lead;
  setOpen: (open: boolean) => void;
};

export default function InteractionForm({ lead, setOpen }: InteractionFormProps) {
  const { addInteraction, isLoading } = useContext(LeadsContext);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      traits: [],
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    await addInteraction(lead.id, values);
    form.reset();
    setOpen(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        <FormField
          control={form.control}
          name="intent"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Lead Intent</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-row space-x-2"
                >
                  {LEAD_INTENT_OPTIONS.map((option) => (
                    <FormItem key={option} className="flex-1">
                      <FormControl>
                        <Button
                          type="button"
                          variant={field.value === option ? 'default' : 'outline'}
                          onClick={() => field.onChange(option)}
                          className="w-full"
                        >
                          {option}
                        </Button>
                      </FormControl>
                    </FormItem>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="interest"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Lead Interest</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-row space-x-2"
                >
                  {LEAD_INTEREST_OPTIONS.map((option) => (
                    <FormItem key={option} className="flex-1">
                      <FormControl>
                        <Button
                          type="button"
                          variant={field.value === option ? 'default' : 'outline'}
                          onClick={() => field.onChange(option)}
                          className="w-full"
                        >
                          {option}
                        </Button>
                      </FormControl>
                    </FormItem>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="action"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Action Committed</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-wrap gap-2"
                >
                  {ACTION_COMMITTED_OPTIONS.map((option) => (
                    <FormItem key={option} className="flex-auto">
                      <FormControl>
                        <Button
                          type="button"
                          variant={field.value === option ? 'default' : 'outline'}
                          onClick={() => field.onChange(option)}
                          className="w-full"
                        >
                          {option}
                        </Button>
                      </FormControl>
                    </FormItem>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="traits"
          render={() => (
            <FormItem>
              <div className="mb-4"><FormLabel>Lead Traits</FormLabel></div>
              <div className="grid grid-cols-2 gap-4">
              {LEAD_TRAITS.map((trait) => (
                <FormField
                  key={trait}
                  control={form.control}
                  name="traits"
                  render={({ field }) => {
                    return (
                      <FormItem key={trait} className="flex flex-row items-center space-x-3 space-y-0 p-2 rounded-md border border-input transition-colors has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                        <FormControl>
                          <Checkbox
                            className="h-5 w-5"
                            checked={field.value?.includes(trait)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...(field.value || []), trait])
                                : field.onChange(field.value?.filter((value) => value !== trait));
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal text-base">{trait}</FormLabel>
                      </FormItem>
                    )
                  }}
                />
              ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Scoring...' : 'Log Interaction'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
