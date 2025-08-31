'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import React, { useContext, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { LeadsContext } from '@/context/LeadsContext';
import { Lead, LEAD_INTENT_OPTIONS, LEAD_INTEREST_OPTIONS, ENGAGEMENT_OPTIONS, OUTCOME_TYPES, InteractionFormData } from '@/lib/types';
import { CalendarIcon, Loader2, PlusCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { format, add } from 'date-fns';
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
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  const outcomeValue = form.watch('outcome');
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    await addInteraction(lead.id, values as InteractionFormData, 'Engagement');
    form.reset();
    setOpen(false);
  }

  const DatePickerWithChips = ({ field, disabled }: { field: any, disabled: (date: Date) => boolean }) => {
    
    const setDateAndClose = (date: Date) => {
        field.onChange(date.toISOString());
        setIsCalendarOpen(false);
    }

    return (
       <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
            <FormControl>
                <Button
                variant={"outline"}
                className={cn(
                    "pl-3 text-left font-normal w-full justify-start",
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
            <PopoverContent className="w-auto p-2 space-y-2" align="start">
                <div className='grid grid-cols-2 gap-2'>
                    <Button variant="outline" size="sm" onClick={() => setDateAndClose(add(new Date(), {days: 1}))}>Tomorrow</Button>
                    <Button variant="outline" size="sm" onClick={() => setDateAndClose(add(new Date(), {days: 3}))}>In 3 days</Button>
                    <Button variant="outline" size="sm" onClick={() => setDateAndClose(add(new Date(), {days: 7}))}>In a week</Button>
                    <Button variant="outline" size="sm" onClick={() => setDateAndClose(add(new Date(), {months: 1}))}>In a month</Button>
                </div>
                <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) => date && field.onChange(date.toISOString())}
                    disabled={disabled}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    )
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
                        <DatePickerWithChips 
                            field={field} 
                            disabled={(date) => date < new Date()}
                        />
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
                         <DatePickerWithChips 
                            field={field} 
                            disabled={(date) => date < new Date()}
                         />
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
