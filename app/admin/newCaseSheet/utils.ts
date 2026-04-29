export const calculateServiceDeadline = (dateFiled: string) => {
  const filedDate = new Date(dateFiled);
  const deadline = new Date(filedDate);
  
  // Add 120 days per CPLR 306-b
  deadline.setDate(filedDate.getDate() + 120);
  
  return deadline.toISOString().split('T')[0]; // Returns YYYY-MM-DD
};