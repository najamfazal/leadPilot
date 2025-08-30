'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { LeadsContext } from '@/context/LeadsContext';
import { Lead, LEAD_TRAITS, LEAD_INTENT_OPTIONS, LEAD_INTEREST_OPTIONS, ACTION_COMMITTED_OPTIONS } from '@/lib/types';
import { Loader2 } from 'lucide-react';

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
            <FormItem>
              <FormLabel>Lead Intent</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Select intent level" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {LEAD_INTENT_OPTIONS.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="interest"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lead Interest</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Select interest level" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {LEAD_INTEREST_OPTIONS.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="action"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Action Committed</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Select action committed" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ACTION_COMMITTED_OPTIONS.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="traits"
          render={() => (
            <FormItem>
              <div className="mb-2"><FormLabel>Lead Traits</FormLabel></div>
              <div className="grid grid-cols-2 gap-2">
              {LEAD_TRAITS.map((trait) => (
                <FormField
                  key={trait}
                  control={form.control}
                  name="traits"
                  render={({ field }) => {
                    return (
                      <FormItem key={trait} className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(trait)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, trait])
                                : field.onChange(field.value?.filter((value) => value !== trait));
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal text-sm">{trait}</FormLabel>
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
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Scoring...' : 'Log Interaction'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
