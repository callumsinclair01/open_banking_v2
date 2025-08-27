export type Frequency = 'monthly' | 'fortnightly' | 'weekly';

export interface MortgageInput {
  principal: number; // starting balance
  annualRate: number; // e.g. 0.0695
  termMonths: number; // total months
  startDate: string; // ISO date
  frequency: Frequency;
  extraPayment?: number; // per period extra
}

export interface PaymentPeriod {
  date: string;
  payment: number;
  interest: number;
  principal: number;
  balance: number;
}

export interface SimulationResult {
  schedule: PaymentPeriod[];
  totalInterest: number;
  monthsToPayoff: number;
}

export function periodsPerYear(freq: Frequency): number {
  return freq === 'weekly' ? 52 : freq === 'fortnightly' ? 26 : 12;
}

export function monthlyEquivalentRate(annual: number): number {
  return annual / 12; // nominal simple monthly rate
}

export function periodicRate(annual: number, freq: Frequency): number {
  return annual / periodsPerYear(freq);
}

export function amortizationSchedule(input: MortgageInput): SimulationResult {
  const { principal, annualRate, termMonths, startDate, frequency, extraPayment = 0 } = input;
  let balance = principal;
  const schedule: PaymentPeriod[] = [];

  const perYear = periodsPerYear(frequency);
  const ratePer = periodicRate(annualRate, frequency);
  const totalPeriods = frequency === 'monthly' ? termMonths : Math.ceil((termMonths / 12) * perYear);

  // Payment formula: P = r*L / (1 - (1+r)^-n)
  const r = ratePer;
  const n = totalPeriods;
  const basePayment = r > 0 ? (r * principal) / (1 - Math.pow(1 + r, -n)) : principal / n;

  const start = new Date(startDate);

  let totalInterest = 0;
  for (let i = 0; i < n && balance > 0.01; i++) {
    const interest = balance * r;
    let payment = basePayment + extraPayment;
    let principalPaid = payment - interest;
    if (principalPaid > balance) {
      principalPaid = balance;
      payment = interest + principalPaid;
    }
    balance = balance - principalPaid;

    const date = new Date(start);
    if (frequency === 'monthly') {
      date.setMonth(start.getMonth() + i);
    } else if (frequency === 'fortnightly') {
      date.setDate(start.getDate() + i * 14);
    } else {
      date.setDate(start.getDate() + i * 7);
    }

    schedule.push({
      date: date.toISOString().slice(0, 10),
      payment: round2(payment),
      interest: round2(interest),
      principal: round2(principalPaid),
      balance: round2(balance),
    });
    totalInterest += interest;
  }

  return {
    schedule,
    totalInterest: round2(totalInterest),
    monthsToPayoff: frequency === 'monthly' ? schedule.length : Math.round((schedule.length / perYear) * 12),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

