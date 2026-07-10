/**
 * Vehicle Financing Calculator
 * ----------------------------
 * Standard amortised loan calculation for auto financing offered by partner
 * banks / credit unions in Ghana.
 */

export interface FinancingInput {
  vehiclePrice: number;
  downPayment: number;
  /** Annual interest rate, e.g. 28 for 28% APR (Ghana rates run high). */
  annualRatePercent: number;
  /** Term in months. */
  termMonths: number;
}

export interface AmortisationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface FinancingResult {
  loanAmount: number;
  monthlyPayment: number;
  totalInterest: number;
  totalPayable: number;
  termMonths: number;
  schedule: AmortisationRow[];
}

export function calculateFinancing(input: FinancingInput): FinancingResult {
  const loanAmount = Math.max(0, input.vehiclePrice - input.downPayment);
  const monthlyRate = input.annualRatePercent / 100 / 12;
  const n = Math.max(1, Math.round(input.termMonths));

  let monthlyPayment: number;
  if (monthlyRate === 0) {
    monthlyPayment = loanAmount / n;
  } else {
    const factor = Math.pow(1 + monthlyRate, n);
    monthlyPayment = (loanAmount * monthlyRate * factor) / (factor - 1);
  }

  const schedule: AmortisationRow[] = [];
  let balance = loanAmount;
  let totalInterest = 0;

  for (let month = 1; month <= n; month++) {
    const interest = balance * monthlyRate;
    const principal = Math.min(monthlyPayment - interest, balance);
    balance = Math.max(0, balance - principal);
    totalInterest += interest;
    schedule.push({
      month,
      payment: monthlyPayment,
      principal,
      interest,
      balance,
    });
  }

  return {
    loanAmount,
    monthlyPayment,
    totalInterest,
    totalPayable: loanAmount + totalInterest,
    termMonths: n,
    schedule,
  };
}
