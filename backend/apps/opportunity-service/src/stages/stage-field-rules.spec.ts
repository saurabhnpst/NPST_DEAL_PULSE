import { missingRequiredFields } from './stage-field-rules';

describe('stage-field-rules (frontend GROUPS parity)', () => {
  const base = {
    name: 'Deal',
    owner: '1',
    account: 'Kaveri Co-op Bank',
    closeDate: '2027-06-01',
    productTsp: 'UPI',
    arr: 1000,
    oneTime: 100,
    currency: 'INR',
    compellingEvent: 'Contract ends',
  };

  it('Qualification requires compellingEvent and financials', () => {
    const missing = missingRequiredFields(0, { ...base, compellingEvent: '' });
    expect(missing).toContain('Compelling Event');
  });

  it('Needs Analysis requires reqReceived = Yes', () => {
    const missing = missingRequiredFields(1, { ...base, reqReceived: 'No' });
    expect(missing).toContain('Confirm Requirements/Doc Received?');
  });

  it('Needs Analysis requires presalesName when presalesInvolved', () => {
    const missing = missingRequiredFields(1, {
      ...base,
      reqReceived: 'Yes',
      presalesInvolved: 'Yes',
      presalesName: '',
    });
    expect(missing).toContain('Pre sales Person Name');
  });

  it('Impact Analysis requires demoDone and sow Yes', () => {
    expect(missingRequiredFields(2, { ...base, demoDone: false, sow: 'No' })).toEqual(
      expect.arrayContaining([
        'Demo/ POC/Deep Engagement Done?',
        'SOW done?',
      ]),
    );
  });

  it('Proposal requires proposalDate', () => {
    expect(missingRequiredFields(3, { ...base, proposalDate: '' })).toContain(
      'Proposal Submission date?',
    );
  });

  it('Negotiation requires signDate when contract signed', () => {
    expect(
      missingRequiredFields(4, { ...base, contractSigned: 'Yes', signDate: '' }),
    ).toContain('Date of signing the contract?');
  });
});