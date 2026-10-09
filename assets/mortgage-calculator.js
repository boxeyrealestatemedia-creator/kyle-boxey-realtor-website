// Fixed-rate payment estimate; no network requests or borrower-data storage.
function calculateMortgageEstimate(values) {
  const { homePrice, downPayment, annualRate, termYears, annualTaxes,
    annualInsurance, monthlyPmi, monthlyHoa } = values;
  const numbers = [homePrice, downPayment, annualRate, termYears, annualTaxes,
    annualInsurance, monthlyPmi, monthlyHoa];
  if (numbers.some(value => !Number.isFinite(value))) {
    return { valid: false, message: 'Enter a number in every field. Use 0 when a cost does not apply.' };
  }
  if (homePrice <= 0 || homePrice > 1e12) {
    return { valid: false, message: 'Enter a home price greater than $0.' };
  }
  if (downPayment < 0 || downPayment > homePrice) {
    return { valid: false, message: 'Down payment must be between $0 and the home price.' };
  }
  if (annualRate < 0 || annualRate > 100) {
    return { valid: false, message: 'Enter an annual interest rate from 0% to 100%.' };
  }
  if (!Number.isInteger(termYears) || termYears < 1 || termYears > 50) {
    return { valid: false, message: 'Enter a loan term of 1 to 50 whole years.' };
  }
  if ([annualTaxes, annualInsurance, monthlyPmi, monthlyHoa].some(value => value < 0 || value > 1e9)) {
    return { valid: false, message: 'Enter nonnegative taxes, insurance, PMI, and HOA amounts within a practical range.' };
  }

  const loanAmount = homePrice - downPayment;
  const monthlyRate = annualRate / 1200;
  const payments = termYears * 12;
  const principalAndInterest = loanAmount === 0 ? 0
    : monthlyRate === 0 ? loanAmount / payments
      : loanAmount * monthlyRate / (1 - Math.pow(1 + monthlyRate, -payments));
  const monthlyTaxes = annualTaxes / 12;
  const monthlyInsurance = annualInsurance / 12;
  const appliedPmi = loanAmount === 0 ? 0 : monthlyPmi;
  const total = principalAndInterest + monthlyTaxes + monthlyInsurance + appliedPmi + monthlyHoa;
  if (![loanAmount, principalAndInterest, monthlyTaxes, monthlyInsurance, total]
    .every(value => Number.isFinite(value) && value >= 0)) {
    return { valid: false, message: 'These numbers are too large to estimate. Try smaller amounts.' };
  }
  return { valid: true, loanAmount, principalAndInterest, monthlyTaxes,
    monthlyInsurance, monthlyPmi: appliedPmi, monthlyHoa, total };
}

if (typeof module !== 'undefined' && module.exports) module.exports = { calculateMortgageEstimate };

if (typeof document !== 'undefined') {
  const calculator = document.getElementById('mortgage-calculator');
  if (calculator) {
    const fields = {
      homePrice: calculator.querySelector('#calc-home-price'),
      downPayment: calculator.querySelector('#calc-down-payment'),
      downPercent: calculator.querySelector('#calc-down-percent'),
      annualRate: calculator.querySelector('#calc-rate'),
      termYears: calculator.querySelector('#calc-term'),
      annualTaxes: calculator.querySelector('#calc-taxes'),
      annualInsurance: calculator.querySelector('#calc-insurance'),
      monthlyPmi: calculator.querySelector('#calc-pmi'),
      monthlyHoa: calculator.querySelector('#calc-hoa')
    };
    const outputs = {
      total: calculator.querySelector('#calc-total'),
      loanAmount: calculator.querySelector('#calc-loan-amount'),
      principalAndInterest: calculator.querySelector('#calc-principal-interest'),
      monthlyTaxes: calculator.querySelector('#calc-monthly-taxes'),
      monthlyInsurance: calculator.querySelector('#calc-monthly-insurance'),
      monthlyPmi: calculator.querySelector('#calc-monthly-pmi'),
      monthlyHoa: calculator.querySelector('#calc-monthly-hoa')
    };
    const status = calculator.querySelector('#calc-status');
    const defaults = Object.fromEntries(Object.entries(fields).map(([key, input]) => [key, input.value]));
    const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const read = input => input.value.trim() === '' ? NaN : Number(input.value);

    function render() {
      Object.values(fields).forEach(input => input.removeAttribute('aria-invalid'));
      const downPercent = read(fields.downPercent);
      const values = Object.fromEntries(Object.entries(fields)
        .filter(([key]) => key !== 'downPercent')
        .map(([key, input]) => [key, read(input)]));
      let result = calculateMortgageEstimate(values);
      if (!Number.isFinite(downPercent) || downPercent < 0 || downPercent > 100) {
        fields.downPercent.setAttribute('aria-invalid', 'true');
        result = { valid: false, message: 'Enter a down payment percentage from 0% to 100%.' };
      }
      if (!result.valid) {
        Object.entries(fields).forEach(([key, input]) => {
          const value = read(input);
          if (!Number.isFinite(value) || value < 0 ||
            (key === 'homePrice' && (value === 0 || value > 1e12)) ||
            (key === 'annualRate' && value > 100) ||
            (key === 'termYears' && (!Number.isInteger(value) || value < 1 || value > 50)) ||
            (['annualTaxes', 'annualInsurance', 'monthlyPmi', 'monthlyHoa'].includes(key) && value > 1e9)) {
            input.setAttribute('aria-invalid', 'true');
          }
        });
        if (Number.isFinite(values.homePrice) && values.downPayment > values.homePrice) {
          fields.downPayment.setAttribute('aria-invalid', 'true');
        }
        Object.values(outputs).forEach(output => { output.textContent = '—'; });
        status.textContent = result.message;
        status.classList.add('calc-status-error');
        return;
      }
      Object.entries(outputs).forEach(([key, output]) => { output.textContent = money.format(result[key]); });
      status.textContent = result.loanAmount === 0
        ? 'With no loan, mortgage insurance is excluded. Other costs still apply.'
        : '';
      status.classList.remove('calc-status-error');
    }

    function syncFromDollars() {
      const price = read(fields.homePrice);
      const down = read(fields.downPayment);
      if (Number.isFinite(price) && price > 0 && Number.isFinite(down) && down >= 0 && down <= price) {
        fields.downPercent.value = String(Math.round(down / price * 10000) / 100);
      }
    }
    function syncFromPercent() {
      const price = read(fields.homePrice);
      const percent = read(fields.downPercent);
      if (Number.isFinite(price) && price > 0 && Number.isFinite(percent) && percent >= 0 && percent <= 100) {
        fields.downPayment.value = String(Math.round(price * percent) / 100);
      }
    }

    Object.entries(fields).forEach(([key, input]) => {
      input.addEventListener('input', () => {
        if (key === 'downPayment') syncFromDollars();
        if (key === 'downPercent' || key === 'homePrice') syncFromPercent();
        render();
      });
    });
    calculator.querySelector('#calc-reset').addEventListener('click', () => {
      Object.entries(fields).forEach(([key, input]) => { input.value = defaults[key]; });
      render();
      fields.homePrice.focus();
    });
    render();
  }
}
