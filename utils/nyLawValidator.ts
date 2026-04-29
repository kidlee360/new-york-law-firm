// utils/nyLawValidators.ts

export const validateNYResidency = (
  yearsInNY: number, 
  marriedInNY: boolean, 
  causeInNY: boolean
): { valid: boolean; message: string } => {
  
  // Rule 1: Either party lived in NY for 2+ continuous years immediately prior
  if (yearsInNY >= 2) return { valid: true, message: "Meets 2-year residency requirement." };

  // Rule 2: 1-year residency + Married in NY
  if (yearsInNY >= 1 && marriedInNY) return { valid: true, message: "Meets 1-year residency + Marriage requirement." };

  // Rule 3: 1-year residency + Cause of action (grounds) occurred in NY
  if (yearsInNY >= 1 && causeInNY) return { valid: true, message: "Meets 1-year residency + Cause of action requirement." };

  return { 
    valid: false, 
    message: "Does not meet NY residency requirements for divorce filing." 
  };
};