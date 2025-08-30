# **App Name**: ScoreCard CRM

## Core Features:

- Lead List Display: Display leads in a scrollable list with Name, Course, and Lead Score. Tap a list item to see lead detail.
- Add New Lead Form: A modal or screen to add new leads with fields for Name, Phone Number, and Course. Initial Lead Score is set to 50.
- Lead Detail Page: Display a single lead's Name, Phone, and Course, plus the interaction history. Provide a Log New Interaction button.
- Log Interaction Form: Capture lead interaction details with dropdowns/selectors for Lead Intent (High/Medium/Low), Lead Interest (High/Medium/Low), Action Committed (None, Demo Scheduled, Visit Scheduled, Payment Link Sent), and multi-select for Lead Traits (Haggling, Price Sensitive, Time Constraint, Pays for Value, Browser-not-Buyer).
- Automatic Scoring Algorithm: An AI tool which dynamically adjusts a lead's score. Recalculate the Lead Score based on form inputs using the weighted scoring system. Cap the Lead Score between 0 and 100.
- Interaction History: Display a reverse-chronological history of logged interactions for each lead.
- Score Indicator: The score should appear with a color background that reflects the score level. Example: Red background = poor, Green background = good.

## Style Guidelines:

- Primary color: Strong Blue (#2962FF) evokes trust, professionalism, and forward-thinking, essential for sales.
- Background color: Light Blue (#E5EBF4) for a clean, trustworthy interface.
- Accent color: Vivid Purple (#A214FF) for highlighting key interactive elements and CTAs.
- Font: 'Inter', a grotesque-style sans-serif, for both headlines and body text due to its modern and neutral appearance which assures readability.
- Use clear, simple icons from a consistent set (e.g. Material Design Icons) to represent lead status, interaction types, and scoring factors.
- Use a clean, card-based layout for the lead list and lead details. Ensure good spacing and clear visual hierarchy to facilitate scanning and quick understanding of information.
- Subtle animations on score updates and form submissions. Use a slide-in or fade-in effect to indicate new interactions in the history.