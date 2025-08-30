'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import React, { useContext, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { LeadsContext } from '@/context/LeadsContext';
import { Lead, LEAD_TRAITS, LEAD_INTENT_OPTIONS, LEAD_INTEREST_OPTIONS, ACTION_COMMITTED_OPTIONS, BLOCKER_TYPE_OPTIONS } from '@/lib/types';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { format } from 'date-fns';
import { Textarea } from '../ui/textarea';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  intent: z.enum(LEAD_INTENT_OPTIONS),
  interest: z.enum(LEAD_INTEREST_OPTIONS),
  action: z.enum(ACTION_COMMITTED_OPTIONS),
  traits: z.array(z.enum(LEAD_TRAITS)).optional().default([]),
  specialFollowUpDate: z.date().optional(),
  preWorkRequired: z.boolean().optional().default(false),
  preWorkDescription: z.string().optional(),
  blockerType: z.enum(BLOCKER_TYPE_OPTIONS).optional(),
}).refine(data => {
    if(data.preWorkRequired) {
        return !!data.preWorkDescription && data.preWorkDescription.length > 0;
    }
    return true;
}, {
    message: "Description is required when 'Pre-work Required' is checked.",
    path: ["preWorkDescription"],
});

type InteractionFormProps = {
  lead: Lead;
  setOpen: (open: boolean) => void;
};

export default function InteractionForm({ lead, setOpen }: InteractionFormProps) {
  const { addInteraction, isLoading } = useContext(LeadsContext);
  const [showBlockerType, setShowBlockerType] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      traits: [],
      preWorkRequired: false,
      preWorkDescription: ""
    },
  });

  const intentValue = form.watch('intent');
  const preWorkRequiredValue = form.watch('preWorkRequired');
  
  // Logic to show blocker type
  React.useEffect(() => {
      setShowBlockerType(intentValue !== 'High');
      if (intentValue === 'High') {
          form.setValue('blockerType', undefined);
      }
  }, [intentValue, form]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    await addInteraction(lead.id, values);
    form.reset();
    setOpen(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        
        <FormField
          control={form.control}
          name="intent"
          render={({ field }) => (
            <FormItem className="space-y-2">
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
                          size="sm"
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
            <FormItem className="space-y-2">
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
                           size="sm"
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
            <FormItem className="space-y-2">
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
                          size="sm"
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

        {showBlockerType && (
            <FormField
            control={form.control}
            name="blockerType"
            render={({ field }) => (
                <FormItem className="space-y-2">
                <FormLabel>Blocker Type</FormLabel>
                <FormControl>
                    <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-row space-x-2"
                    >
                    {BLOCKER_TYPE_OPTIONS.map((option) => (
                        <FormItem key={option} className="flex-1">
                        <FormControl>
                            <Button
                            type="button"
                            variant={field.value === option ? 'default' : 'outline'}
                            onClick={() => field.onChange(option)}
                            className="w-full"
                            size="sm"
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
        )}
        
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
                      <FormItem key={trait} className="flex flex-row items-center space-x-3 space-y-0 p-3 rounded-md border border-input transition-colors has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                        <FormControl>
                          <Checkbox
                            className="h-6 w-6"
                            checked={field.value?.includes(trait)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...(field.value || []), trait])
                                : field.onChange(field.value?.filter((value) => value !== trait));
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal text-lg">{trait}</FormLabel>
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

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <FormField
            control={form.control}
            name="specialFollowUpDate"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                <FormLabel>Special Follow-up Date</FormLabel>
                <Popover>
                    <PopoverTrigger asChild>
                    <FormControl>
                        <Button
                        variant={"outline"}
                        className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                        )}
                        >
                        {field.value ? (
                            format(field.value, "PPP")
                        ) : (
                            <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                    </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                        date < new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                    />
                    </PopoverContent>
                </Popover>
                <FormMessage />
                </FormItem>
            )}
            />
            <div className="space-y-2">
                <FormField
                    control={form.control}
                    name="preWorkRequired"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 rounded-md border p-3">
                        <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} className='h-6 w-6'/>
                        </FormControl>
                        <FormLabel className='text-base'>Pre-work Required?</FormLabel>
                        </FormItem>
                    )}
                />
            </div>
        </div>

        {preWorkRequiredValue && (
            <FormField
                control={form.control}
                name="preWorkDescription"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Pre-work Description</FormLabel>
                        <FormControl>
                            <Textarea placeholder="e.g. Check course availability for Jane Doe" {...field} />
                        </FormControl>
                        <FormMessage/>
                    </FormItem>
                )}
            />
        )}


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
