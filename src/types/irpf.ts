export type IrpfImpactDetail = {
  taxableIncome: number;
  taxBracket: string;
  irpfDue: number;
  deductions: number;
  netImpact: number;
  summary: string;
};

export type IrpfImpact = {
  impactDetails: IrpfImpactDetail;
};
