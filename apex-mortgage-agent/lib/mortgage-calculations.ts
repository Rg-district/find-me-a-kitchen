export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  termYears: number
): number {
  const monthlyRate = annualRate / 100 / 12;
  const n = termYears * 12;
  if (monthlyRate === 0) return principal / n;
  return (principal * (monthlyRate * Math.pow(1 + monthlyRate, n))) /
    (Math.pow(1 + monthlyRate, n) - 1);
}

export function buildAmortizationSchedule(
  principal: number,
  annualRate: number,
  termYears: number
): Array<{
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}> {
  const monthlyRate = annualRate / 100 / 12;
  const payment = calculateMonthlyPayment(principal, annualRate, termYears);
  const schedule = [];
  let balance = principal;

  for (let month = 1; month <= termYears * 12; month++) {
    const interestPayment = balance * monthlyRate;
    const principalPayment = payment - interestPayment;
    balance -= principalPayment;

    schedule.push({
      month,
      payment: +payment.toFixed(2),
      principal: +principalPayment.toFixed(2),
      interest: +interestPayment.toFixed(2),
      balance: +Math.max(balance, 0).toFixed(2),
    });
  }

  return schedule;
}

export function totalInterestPaid(
  principal: number,
  annualRate: number,
  termYears: number
): number {
  const payment = calculateMonthlyPayment(principal, annualRate, termYears);
  return +(payment * termYears * 12 - principal).toFixed(2);
}

export function maxAffordableLoan(
  grossMonthlyIncome: number,
  monthlyDebts: number,
  annualRate: number,
  termYears: number,
  maxDtiRatio = 0.43
): number {
  const availableForHousing = grossMonthlyIncome * maxDtiRatio - monthlyDebts;
  if (availableForHousing <= 0) return 0;

  const monthlyRate = annualRate / 100 / 12;
  const n = termYears * 12;
  if (monthlyRate === 0) return availableForHousing * n;

  return +(
    (availableForHousing * (Math.pow(1 + monthlyRate, n) - 1)) /
    (monthlyRate * Math.pow(1 + monthlyRate, n))
  ).toFixed(2);
}

export const SAMPLE_RATES: Record<string, Record<number, number>> = {
  conventional: { 15: 6.25, 20: 6.5, 30: 6.875 },
  fha: { 15: 5.875, 20: 6.125, 30: 6.5 },
  va: { 15: 5.75, 20: 6.0, 30: 6.25 },
  jumbo: { 15: 6.5, 20: 6.75, 30: 7.125 },
};
