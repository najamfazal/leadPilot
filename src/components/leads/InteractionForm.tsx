'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import React, { useContext, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { LeadsContext } from '@/context/LeadsContext';
import { Lead, LEAD_INTENT_OPTIONS, LEAD_INTEREST_OPTIONS, ENGAGEMENT_OPTIONS, OUTCOME_TYPES, InteractionFormData } from '@/lib/types';
import { CalendarIcon, Loader2, PlusCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { format } from 'date-fns';
import { Textarea } from '../ui/textarea';
import { cn } from '@/lib/utils';
import { RadioGroup } from '../ui/radio-group';

const formSchema = z.object({
  interest: z.enum(LEAD_INTEREST_OPTIONS),
  intent: z.enum(LEAD_INTENT_OPTIONS),
  engagement: z.enum(ENGAGEMENT_OPTIONS),
  outcome: z.enum(OUTCOME_TYPES).optional(),
  outcomeDetail: z.string().optional(),
});

type InteractionFormProps = {
  lead: Lead;
  setOpen: (open: boolean) => void;
};

export default function InteractionForm({ lead, setOpen }: InteractionFormProps) {
  const { addInteraction, isLoading } = useContext(LeadsContext);
  const [showOutcomes, setShowOutcomes] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  const outcomeValue = form.watch('outcome');
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    await addInteraction(lead.id, values as InteractionFormData);
    form.reset();
    setOpen(false);
  }

  const renderOutcomeDetail = () => {
    switch(outcomeValue) {
        case 'FollowLater':
            return (
                 <FormField
                    control={form.control}
                    name="outcomeDetail"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Follow-up Date</FormLabel>
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
                                    format(new Date(field.value), "PPP p")
                                ) : (
                                    <span>Pick a date and time</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value ? new Date(field.value) : undefined}
                                onSelect={(date) => field.onChange(date?.toISOString())}
                                disabled={(date) =>
                                date < new Date()
                                }
                            />
                            {/* Simple time picker could go here if needed */}
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
            );
        case 'NeedsInfo':
             return (
                <FormField
                    control={form.control}
                    name="outcomeDetail"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Information Needed</FormLabel>
                            <FormControl>
                                <Textarea placeholder="e.g., Send brochure for advanced course" {...field} />
                            </FormControl>
                            <FormMessage/>
                        </FormItem>
                    )}
                />
            );
        case 'Demo':
        case 'Visit':
            return (
                <FormField
                    control={form.control}
                    name="outcomeDetail"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>{outcomeValue} Date</FormLabel>
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
                                    format(new Date(field.value), "PPP")
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
                                selected={field.value ? new Date(field.value) : undefined}
                                onSelect={(date) => field.onChange(date?.toISOString())}
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
            );
        default:
            return null;
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="interest"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel>Interest Level</FormLabel>
              <FormControl>
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-5 gap-2">
                  {LEAD_INTEREST_OPTIONS.map(option => (
                    <FormItem key={option}>
                      <FormControl>
                        <Button type="button" variant={field.value === option ? 'default' : 'outline'} onClick={() => field.onChange(option)} className="w-full" size="sm">{option}</Button>
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
          name="intent"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel>Buying Intent</FormLabel>
              <FormControl>
                 <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-3 gap-2">
                  {LEAD_INTENT_OPTIONS.map(option => (
                    <FormItem key={option}>
                      <FormControl>
                        <Button type="button" variant={field.value === option ? 'default' : 'outline'} onClick={() => field.onChange(option)} className="w-full" size="sm">{option}</Button>
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
          name="engagement"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel>Engagement</FormLabel>
              <FormControl>
                 <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-3 gap-2">
                  {ENGAGEMENT_OPTIONS.map(option => (
                     <FormItem key={option}>
                      <FormControl>
                        <Button type="button" variant={field.value === option ? 'default' : 'outline'} onClick={() => field.onChange(option)} className="w-full" size="sm">{option}</Button>
                      </FormControl>
                    </FormItem>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!showOutcomes ? (
            <Button variant="outline" className="w-full" onClick={() => setShowOutcomes(true)}>
                <PlusCircle className="mr-2"/>
                Add Specific Outcome
            </Button>
        ) : (
             <FormField
                control={form.control}
                name="outcome"
                render={({ field }) => (
                    <FormItem className="space-y-2 rounded-lg border p-3">
                    <FormLabel>Specific Outcome</FormLabel>
                    <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-3 gap-2">
                        {OUTCOME_TYPES.map(option => (
                            <FormItem key={option}>
                            <FormControl>
                                <Button type="button" variant={field.value === option ? 'default' : 'outline'} onClick={() => field.onChange(option)} className="w-full" size="sm">{option}</Button>
                            </FormControl>
                            </FormItem>
                        ))}
                        </RadioGroup>
                    </FormControl>
                    <div className="pt-2">
                        {renderOutcomeDetail()}
                    </div>
                    <FormMessage />
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
