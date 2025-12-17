export const formatCurrency = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return 'R$ 0,00';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const formatPercentage = (value: number | undefined | null, fractionDigits = 2): string => {
  if (value === undefined || value === null) return '0,00%';
  return value.toLocaleString('pt-BR', {
    style: 'percent',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
};
