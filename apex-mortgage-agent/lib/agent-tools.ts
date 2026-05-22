import Anthropic from "@anthropic-ai/sdk";
import {
  calculateMonthlyPayment,
  buildAmortizationSchedule,
  totalInterestPaid,
  maxAffordableLoan,
  SAMPLE_RATES,
} from "./mortgage-calculations";

export const tools: Anthropic.Tool[] = [
  {
    name: "calculate_monthly_payment",
    description:
      "Calculate the monthly mortgage payment for a given loan amount, interest rate, and term.",
    input_schema: {
      type: "object" as const,
      properties: {
        loan_amount: {
          type: "number",
          description: "The total loan amount in dollars",
        },
        annual_interest_rate: {
          type: "number",
          description: "The annual interest rate as a percentage (e.g. 6.5 for 6.5%)",
        },
        term_years: {
          type: "number",
          description: "The loan term in years (e.g. 15, 20, or 30)",
        },
      },
      required: ["loan_amount", "annual_interest_rate", "term_years"],
    },
  },
  {
    name: "check_affordability",
    description:
      "Determine how much a borrower can afford based on income, existing debts, and standard DTI limits.",
    input_schema: {
      type: "object" as const,
      properties: {
        gross_monthly_income: {
          type: "number",
          description: "Gross (pre-tax) monthly income in dollars",
        },
        monthly_debts: {
          type: "number",
          description:
            "Total monthly debt obligations excluding a new mortgage (car loans, student loans, credit cards, etc.)",
        },
        annual_interest_rate: {
          type: "number",
          description: "Expected annual interest rate as a percentage",
        },
        term_years: {
          type: "number",
          description: "Desired loan term in years",
        },
        down_payment: {
          type: "number",
          description: "Available down payment in dollars",
        },
      },
      required: [
        "gross_monthly_income",
        "monthly_debts",
        "annual_interest_rate",
        "term_years",
        "down_payment",
      ],
    },
  },
  {
    name: "compare_loan_types",
    description:
      "Compare current rates and total costs across conventional, FHA, VA, and jumbo loan types for a given loan amount and term.",
    input_schema: {
      type: "object" as const,
      properties: {
        loan_amount: {
          type: "number",
          description: "The loan amount in dollars",
        },
        term_years: {
          type: "number",
          description: "The loan term in years",
        },
        loan_types: {
          type: "array",
          items: { type: "string" },
          description:
            "Loan types to compare: 'conventional', 'fha', 'va', 'jumbo'",
        },
      },
      required: ["loan_amount", "term_years"],
    },
  },
  {
    name: "generate_amortization_schedule",
    description:
      "Generate a full month-by-month amortization schedule showing principal, interest, and remaining balance.",
    input_schema: {
      type: "object" as const,
      properties: {
        loan_amount: {
          type: "number",
          description: "The total loan amount in dollars",
        },
        annual_interest_rate: {
          type: "number",
          description: "The annual interest rate as a percentage",
        },
        term_years: {
          type: "number",
          description: "The loan term in years",
        },
        show_months: {
          type: "number",
          description: "Number of months to show (defaults to 12 for the first year)",
        },
      },
      required: ["loan_amount", "annual_interest_rate", "term_years"],
    },
  },
  {
    name: "estimate_closing_costs",
    description:
      "Estimate typical closing costs for a home purchase based on purchase price and loan amount.",
    input_schema: {
      type: "object" as const,
      properties: {
        purchase_price: {
          type: "number",
          description: "The home purchase price in dollars",
        },
        loan_amount: {
          type: "number",
          description: "The loan amount in dollars",
        },
        state: {
          type: "string",
          description:
            "The US state where the property is located (affects transfer taxes)",
        },
      },
      required: ["purchase_price", "loan_amount"],
    },
  },
];

type ToolInput = Record<string, unknown>;

export function executeTool(
  toolName: string,
  toolInput: ToolInput
): Record<string, unknown> {
  switch (toolName) {
    case "calculate_monthly_payment": {
      const { loan_amount, annual_interest_rate, term_years } = toolInput as {
        loan_amount: number;
        annual_interest_rate: number;
        term_years: number;
      };
      const monthly = calculateMonthlyPayment(
        loan_amount,
        annual_interest_rate,
        term_years
      );
      const interest = totalInterestPaid(
        loan_amount,
        annual_interest_rate,
        term_years
      );
      return {
        monthly_payment: +monthly.toFixed(2),
        total_paid: +(monthly * term_years * 12).toFixed(2),
        total_interest: interest,
        loan_amount,
        annual_rate: annual_interest_rate,
        term_years,
      };
    }

    case "check_affordability": {
      const {
        gross_monthly_income,
        monthly_debts,
        annual_interest_rate,
        term_years,
        down_payment,
      } = toolInput as {
        gross_monthly_income: number;
        monthly_debts: number;
        annual_interest_rate: number;
        term_years: number;
        down_payment: number;
      };
      const maxLoan = maxAffordableLoan(
        gross_monthly_income,
        monthly_debts,
        annual_interest_rate,
        term_years
      );
      const maxPurchasePrice = +(maxLoan + down_payment).toFixed(2);
      const monthly = calculateMonthlyPayment(
        maxLoan,
        annual_interest_rate,
        term_years
      );
      const frontEndRatio = +(monthly / gross_monthly_income).toFixed(4);
      const backEndRatio = +((monthly + monthly_debts) / gross_monthly_income).toFixed(4);

      return {
        max_loan_amount: maxLoan,
        max_purchase_price: maxPurchasePrice,
        estimated_monthly_payment: +monthly.toFixed(2),
        front_end_dti: +(frontEndRatio * 100).toFixed(1),
        back_end_dti: +(backEndRatio * 100).toFixed(1),
        down_payment,
        note:
          "Based on 43% back-end DTI limit. Some lenders may allow up to 50%.",
      };
    }

    case "compare_loan_types": {
      const {
        loan_amount,
        term_years,
        loan_types = ["conventional", "fha", "va", "jumbo"],
      } = toolInput as {
        loan_amount: number;
        term_years: number;
        loan_types?: string[];
      };

      const termOptions = [15, 20, 30];
      const closestTerm = termOptions.reduce((prev, curr) =>
        Math.abs(curr - term_years) < Math.abs(prev - term_years) ? curr : prev
      );

      const comparison = loan_types.map((type) => {
        const rate = SAMPLE_RATES[type]?.[closestTerm] ?? 7.0;
        const monthly = calculateMonthlyPayment(loan_amount, rate, term_years);
        const interest = totalInterestPaid(loan_amount, rate, term_years);
        return {
          loan_type: type,
          annual_rate: rate,
          monthly_payment: +monthly.toFixed(2),
          total_interest: interest,
          total_cost: +(monthly * term_years * 12).toFixed(2),
        };
      });

      return {
        loan_amount,
        term_years,
        comparison,
        rates_as_of: "May 2026 (indicative — confirm with lenders)",
      };
    }

    case "generate_amortization_schedule": {
      const {
        loan_amount,
        annual_interest_rate,
        term_years,
        show_months = 12,
      } = toolInput as {
        loan_amount: number;
        annual_interest_rate: number;
        term_years: number;
        show_months?: number;
      };
      const full = buildAmortizationSchedule(
        loan_amount,
        annual_interest_rate,
        term_years
      );
      const schedule = full.slice(0, show_months);
      const yearOneSummary = full.slice(0, 12);
      return {
        schedule,
        year_one_total_interest: +yearOneSummary
          .reduce((s, r) => s + r.interest, 0)
          .toFixed(2),
        year_one_total_principal: +yearOneSummary
          .reduce((s, r) => s + r.principal, 0)
          .toFixed(2),
        total_months: full.length,
        showing_months: schedule.length,
      };
    }

    case "estimate_closing_costs": {
      const { purchase_price, loan_amount, state = "unknown" } = toolInput as {
        purchase_price: number;
        loan_amount: number;
        state?: string;
      };
      const originationFee = +(loan_amount * 0.01).toFixed(2);
      const appraisalFee = 550;
      const titleInsurance = +(purchase_price * 0.005).toFixed(2);
      const titleSearch = 300;
      const recordingFees = 200;
      const prepaidInterest = +(loan_amount * (6.75 / 100 / 12) * 15).toFixed(2);
      const homeownersInsurance = +(purchase_price * 0.005).toFixed(2);
      const propertyTaxEscrow = +(purchase_price * 0.012 * (2 / 12)).toFixed(2);
      const surveyFee = 400;
      const attorneyFee = state === "GA" || state === "NY" ? 800 : 0;

      const total = +(
        originationFee +
        appraisalFee +
        titleInsurance +
        titleSearch +
        recordingFees +
        prepaidInterest +
        homeownersInsurance +
        propertyTaxEscrow +
        surveyFee +
        attorneyFee
      ).toFixed(2);

      return {
        breakdown: {
          origination_fee: originationFee,
          appraisal_fee: appraisalFee,
          title_insurance: titleInsurance,
          title_search: titleSearch,
          recording_fees: recordingFees,
          prepaid_interest: prepaidInterest,
          homeowners_insurance_escrow: homeownersInsurance,
          property_tax_escrow: propertyTaxEscrow,
          survey_fee: surveyFee,
          attorney_fee: attorneyFee,
        },
        estimated_total: total,
        as_percent_of_purchase: +((total / purchase_price) * 100).toFixed(2),
        note: "Estimates only. Actual costs vary by lender and location.",
      };
    }

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}
