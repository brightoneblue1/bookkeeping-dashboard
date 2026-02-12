// Bank and Mobile Money Service Configuration
// API Integration placeholders for financial institutions

export interface BankConfig {
  id: string;
  name: string;
  type: 'bank' | 'mobile_money' | 'digital_wallet';
  country: string;
  apiEndpoint?: string;
  apiKey?: string;
  icon: string;
  color: string;
  supportsCheques: boolean;
  supportsRealTimeBalance: boolean;
}

// Kenyan Banks
export const kenyanBanks: BankConfig[] = [
  {
    id: 'kcb',
    name: 'KCB Bank Kenya',
    type: 'bank',
    country: 'Kenya',
    apiEndpoint: 'https://api.kcbgroup.com/v1',
    icon: '🏦',
    color: '#006B3F',
    supportsCheques: true,
    supportsRealTimeBalance: true
  },
  {
    id: 'equity',
    name: 'Equity Bank',
    type: 'bank',
    country: 'Kenya',
    apiEndpoint: 'https://api.equitybank.co.ke/v1',
    icon: '🏦',
    color: '#E31E24',
    supportsCheques: true,
    supportsRealTimeBalance: true
  },
  {
    id: 'coop',
    name: 'Co-operative Bank',
    type: 'bank',
    country: 'Kenya',
    apiEndpoint: 'https://api.co-opbank.co.ke/v1',
    icon: '🏦',
    color: '#FF6B00',
    supportsCheques: true,
    supportsRealTimeBalance: true
  },
  {
    id: 'ncba',
    name: 'NCBA Bank',
    type: 'bank',
    country: 'Kenya',
    apiEndpoint: 'https://api.ncbagroup.com/v1',
    icon: '🏦',
    color: '#00A651',
    supportsCheques: true,
    supportsRealTimeBalance: true
  },
  {
    id: 'absa',
    name: 'Absa Bank Kenya',
    type: 'bank',
    country: 'Kenya',
    apiEndpoint: 'https://api.absa.co.ke/v1',
    icon: '🏦',
    color: '#C8102E',
    supportsCheques: true,
    supportsRealTimeBalance: true
  },
  {
    id: 'stanchart',
    name: 'Standard Chartered Kenya',
    type: 'bank',
    country: 'Kenya',
    apiEndpoint: 'https://api.sc.com/ke/v1',
    icon: '🏦',
    color: '#007B5F',
    supportsCheques: true,
    supportsRealTimeBalance: true
  },
  {
    id: 'dtb',
    name: 'Diamond Trust Bank',
    type: 'bank',
    country: 'Kenya',
    apiEndpoint: 'https://api.dtbafrica.com/v1',
    icon: '🏦',
    color: '#003087',
    supportsCheques: true,
    supportsRealTimeBalance: false
  },
  {
    id: 'ib',
    name: 'I&M Bank',
    type: 'bank',
    country: 'Kenya',
    apiEndpoint: 'https://api.imbank.co.ke/v1',
    icon: '🏦',
    color: '#ED1C24',
    supportsCheques: true,
    supportsRealTimeBalance: false
  },
  {
    id: 'family',
    name: 'Family Bank',
    type: 'bank',
    country: 'Kenya',
    apiEndpoint: 'https://api.familybank.co.ke/v1',
    icon: '🏦',
    color: '#0066B2',
    supportsCheques: true,
    supportsRealTimeBalance: false
  },
  {
    id: 'nic',
    name: 'NIC Bank',
    type: 'bank',
    country: 'Kenya',
    apiEndpoint: 'https://api.nicbank.co.ke/v1',
    icon: '🏦',
    color: '#E30613',
    supportsCheques: true,
    supportsRealTimeBalance: false
  }
];

// Kenyan Mobile Money
export const kenyanMobileMoney: BankConfig[] = [
  {
    id: 'mpesa',
    name: 'M-Pesa (Safaricom)',
    type: 'mobile_money',
    country: 'Kenya',
    apiEndpoint: 'https://sandbox.safaricom.co.ke/mpesa',
    icon: '📱',
    color: '#00A651',
    supportsCheques: false,
    supportsRealTimeBalance: true
  },
  {
    id: 'airtel',
    name: 'Airtel Money',
    type: 'mobile_money',
    country: 'Kenya',
    apiEndpoint: 'https://openapi.airtel.africa/merchant/v1',
    icon: '📱',
    color: '#ED1C24',
    supportsCheques: false,
    supportsRealTimeBalance: true
  },
  {
    id: 'tkash',
    name: 'T-Kash (Telkom)',
    type: 'mobile_money',
    country: 'Kenya',
    apiEndpoint: 'https://api.telkom.co.ke/tkash/v1',
    icon: '📱',
    color: '#0066B2',
    supportsCheques: false,
    supportsRealTimeBalance: false
  },
  {
    id: 'equitel',
    name: 'Equitel Money',
    type: 'mobile_money',
    country: 'Kenya',
    apiEndpoint: 'https://api.equitel.co.ke/v1',
    icon: '📱',
    color: '#E31E24',
    supportsCheques: false,
    supportsRealTimeBalance: false
  }
];

// International Banks
export const internationalBanks: BankConfig[] = [
  {
    id: 'hsbc',
    name: 'HSBC',
    type: 'bank',
    country: 'International',
    apiEndpoint: 'https://api.hsbc.com/open-banking/v3.1',
    icon: '🏦',
    color: '#DB0011',
    supportsCheques: true,
    supportsRealTimeBalance: true
  },
  {
    id: 'citi',
    name: 'Citibank',
    type: 'bank',
    country: 'International',
    apiEndpoint: 'https://api.citi.com/gcb/api/v1',
    icon: '🏦',
    color: '#003D7D',
    supportsCheques: true,
    supportsRealTimeBalance: true
  },
  {
    id: 'bofa',
    name: 'Bank of America',
    type: 'bank',
    country: 'USA',
    apiEndpoint: 'https://api.bankofamerica.com/v1',
    icon: '🏦',
    color: '#E31837',
    supportsCheques: true,
    supportsRealTimeBalance: true
  },
  {
    id: 'chase',
    name: 'JPMorgan Chase',
    type: 'bank',
    country: 'USA',
    apiEndpoint: 'https://api.chase.com/v1',
    icon: '🏦',
    color: '#117ACA',
    supportsCheques: true,
    supportsRealTimeBalance: true
  },
  {
    id: 'barclays',
    name: 'Barclays',
    type: 'bank',
    country: 'UK',
    apiEndpoint: 'https://api.barclays.com/open-banking/v3.1',
    icon: '🏦',
    color: '#00AEEF',
    supportsCheques: true,
    supportsRealTimeBalance: true
  }
];

// Digital Wallets & Payment Services
export const digitalWallets: BankConfig[] = [
  {
    id: 'paypal',
    name: 'PayPal',
    type: 'digital_wallet',
    country: 'International',
    apiEndpoint: 'https://api.paypal.com/v1',
    icon: '💳',
    color: '#003087',
    supportsCheques: false,
    supportsRealTimeBalance: true
  },
  {
    id: 'stripe',
    name: 'Stripe',
    type: 'digital_wallet',
    country: 'International',
    apiEndpoint: 'https://api.stripe.com/v1',
    icon: '💳',
    color: '#635BFF',
    supportsCheques: false,
    supportsRealTimeBalance: true
  },
  {
    id: 'skrill',
    name: 'Skrill',
    type: 'digital_wallet',
    country: 'International',
    apiEndpoint: 'https://api.skrill.com/v1',
    icon: '💳',
    color: '#8B1874',
    supportsCheques: false,
    supportsRealTimeBalance: true
  },
  {
    id: 'payoneer',
    name: 'Payoneer',
    type: 'digital_wallet',
    country: 'International',
    apiEndpoint: 'https://api.payoneer.com/v2',
    icon: '💳',
    color: '#FF6C00',
    supportsCheques: false,
    supportsRealTimeBalance: true
  },
  {
    id: 'wise',
    name: 'Wise (TransferWise)',
    type: 'digital_wallet',
    country: 'International',
    apiEndpoint: 'https://api.transferwise.com/v1',
    icon: '💳',
    color: '#00B9FF',
    supportsCheques: false,
    supportsRealTimeBalance: true
  },
  {
    id: 'revolut',
    name: 'Revolut',
    type: 'digital_wallet',
    country: 'International',
    apiEndpoint: 'https://api.revolut.com/v1',
    icon: '💳',
    color: '#0075EB',
    supportsCheques: false,
    supportsRealTimeBalance: true
  }
];

// Regional Mobile Money (Africa)
export const africanMobileMoney: BankConfig[] = [
  {
    id: 'mtn',
    name: 'MTN Mobile Money',
    type: 'mobile_money',
    country: 'Africa',
    apiEndpoint: 'https://api.mtn.com/v1',
    icon: '📱',
    color: '#FFCB05',
    supportsCheques: false,
    supportsRealTimeBalance: true
  },
  {
    id: 'orange',
    name: 'Orange Money',
    type: 'mobile_money',
    country: 'Africa',
    apiEndpoint: 'https://api.orange.com/orange-money/v1',
    icon: '📱',
    color: '#FF6600',
    supportsCheques: false,
    supportsRealTimeBalance: true
  },
  {
    id: 'vodacom',
    name: 'Vodacom M-Pesa',
    type: 'mobile_money',
    country: 'Africa',
    apiEndpoint: 'https://api.vodacom.co.za/mpesa/v1',
    icon: '📱',
    color: '#E60000',
    supportsCheques: false,
    supportsRealTimeBalance: true
  },
  {
    id: 'tigo',
    name: 'Tigo Pesa',
    type: 'mobile_money',
    country: 'Africa',
    apiEndpoint: 'https://api.tigo.com/pesa/v1',
    icon: '📱',
    color: '#1F3A93',
    supportsCheques: false,
    supportsRealTimeBalance: false
  }
];

// Get all financial institutions
export function getAllFinancialInstitutions(): BankConfig[] {
  return [
    ...kenyanBanks,
    ...kenyanMobileMoney,
    ...internationalBanks,
    ...digitalWallets,
    ...africanMobileMoney
  ];
}

// Get institutions by type
export function getInstitutionsByType(type: 'bank' | 'mobile_money' | 'digital_wallet'): BankConfig[] {
  return getAllFinancialInstitutions().filter(inst => inst.type === type);
}

// Get institutions by country
export function getInstitutionsByCountry(country: string): BankConfig[] {
  return getAllFinancialInstitutions().filter(inst => inst.country === country);
}

// Get institution by ID
export function getInstitutionById(id: string): BankConfig | undefined {
  return getAllFinancialInstitutions().find(inst => inst.id === id);
}

// API Integration Functions (Placeholders)
export async function fetchAccountBalance(institutionId: string, accountId: string): Promise<number> {
  const institution = getInstitutionById(institutionId);
  if (!institution || !institution.supportsRealTimeBalance) {
    throw new Error('Real-time balance not supported for this institution');
  }

  // Placeholder for API call
  console.log(`Fetching balance from ${institution.name} API: ${institution.apiEndpoint}`);
  
  // TODO: Implement actual API call
  // const response = await fetch(`${institution.apiEndpoint}/accounts/${accountId}/balance`, {
  //   headers: {
  //     'Authorization': `Bearer ${institution.apiKey}`,
  //     'Content-Type': 'application/json'
  //   }
  // });
  // return response.json();
  
  return 0; // Placeholder return
}

export async function syncTransactions(institutionId: string, accountId: string, fromDate: string, toDate: string): Promise<any[]> {
  const institution = getInstitutionById(institutionId);
  if (!institution) {
    throw new Error('Institution not found');
  }

  console.log(`Syncing transactions from ${institution.name} API: ${institution.apiEndpoint}`);
  
  // TODO: Implement actual API call
  // const response = await fetch(`${institution.apiEndpoint}/accounts/${accountId}/transactions`, {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${institution.apiKey}`,
  //     'Content-Type': 'application/json'
  //   },
  //   body: JSON.stringify({ fromDate, toDate })
  // });
  // return response.json();
  
  return []; // Placeholder return
}

export async function initiateMobileMoneyPayment(
  institutionId: string,
  phoneNumber: string,
  amount: number,
  reference: string
): Promise<{ success: boolean; transactionId: string }> {
  const institution = getInstitutionById(institutionId);
  if (!institution || institution.type !== 'mobile_money') {
    throw new Error('Invalid mobile money provider');
  }

  console.log(`Initiating ${institution.name} payment: ${institution.apiEndpoint}`);
  
  // TODO: Implement actual API call
  // Example for M-Pesa:
  // const response = await fetch(`${institution.apiEndpoint}/stkpush/v1/processrequest`, {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${institution.apiKey}`,
  //     'Content-Type': 'application/json'
  //   },
  //   body: JSON.stringify({
  //     BusinessShortCode: '174379',
  //     Password: 'base64EncodedPassword',
  //     Timestamp: new Date().toISOString(),
  //     TransactionType: 'CustomerPayBillOnline',
  //     Amount: amount,
  //     PartyA: phoneNumber,
  //     PartyB: '174379',
  //     PhoneNumber: phoneNumber,
  //     CallBackURL: 'https://yourdomain.com/callback',
  //     AccountReference: reference,
  //     TransactionDesc: 'Payment'
  //   })
  // });
  // return response.json();
  
  return { success: true, transactionId: `TXN-${Date.now()}` }; // Placeholder return
}

export async function verifyBankAccount(institutionId: string, accountNumber: string): Promise<boolean> {
  const institution = getInstitutionById(institutionId);
  if (!institution) {
    throw new Error('Institution not found');
  }

  console.log(`Verifying account with ${institution.name}: ${institution.apiEndpoint}`);
  
  // TODO: Implement actual API call
  
  return true; // Placeholder return
}
