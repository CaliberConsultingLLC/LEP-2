import { SUPPORT_EMAIL } from './supportLinks';
import { LEGAL_COMPANY, LEGAL_VERSIONS } from './legalVersions';

// The four legal documents, as written, and the two help pages that sit
// beside them on /documents.
//
// A legal document here is an intro plus numbered sections, and a section is
// a list of blocks — a paragraph string, or one of:
//   { list: [...] }           a bulleted list
//   { sub: '...' }            a sub-heading inside the section
//   { lead: '...', text }     a paragraph with a bold run-in heading
//   { caps: '...' }           the all-capitals warranty and liability text
//
// The wording is North Star's. Change it here, and move the date in
// legalVersions.js when you do — that date is what the consent log records.

const LEGAL_EMAIL = 'support@northstarpartners.org';
const LEGAL_ADDRESS = `${LEGAL_COMPANY}, 27252 County Road 30, Elkhart, IN 46517`;

// "2026-08-24" → "August 24, 2026". Parsed by hand so no timezone can move it
// a day.
export function formatEffective(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  const month = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'][m - 1];
  return `${month} ${d}, ${y}`;
}

const TERMS = {
  id: 'terms',
  kind: 'legal',
  title: 'Terms of Service',
  effective: LEGAL_VERSIONS.terms,
  intro: [],
  sections: [
    {
      heading: 'Acceptance of Terms',
      blocks: [
        'By creating an account, purchasing, or otherwise using The Compass (the "Service"), you ("User," "you") agree to be bound by these Terms of Service ("Terms"). If you do not agree, do not use the Service. The Service is offered by North Star Partners, LLC, a State of Indiana limited liability company ("Company," "we," "us"). These Terms, together with our Privacy Policy and Consent to Participate, form the entire agreement between you and Company regarding the Service.',
      ],
    },
    {
      heading: 'Description of the Service',
      blocks: [
        'The Compass is a leadership development tool that collects information you provide about your background, experience, and leadership preferences and uses it to generate a personalized leadership development plan, insights, and related materials, which may include PDF documents and access to a web-based portal (collectively, "Compass Output"). The Compass provides decision-support and reflection tools only. It does not provide legal, financial, medical, psychological, or other professional advice, and it does not make decisions for you. All business, leadership, personnel, and other decisions remain solely your responsibility.',
      ],
    },
    {
      heading: 'Eligibility',
      blocks: [
        'The Service is intended for business and professional use by individuals age 18 or older, or by businesses purchasing on behalf of authorized personnel. By using the Service, you represent that you are at least 18 years old and have the authority to enter into these Terms, including, if purchasing on behalf of a company, the authority to bind that company.',
      ],
    },
    {
      heading: 'Accounts and Credentials',
      blocks: [
        'You must create an account to access certain features of the Service. You agree to: (a) provide accurate, current, and complete information; (b) keep your login credentials confidential; (c) notify Company promptly of any unauthorized use of your account; and (d) be responsible for all activity that occurs under your account. Company is not liable for any loss arising from your failure to safeguard your credentials.',
      ],
    },
    {
      heading: 'Fees, Payment, and Taxes',
      blocks: [
        'Access to The Compass requires payment of the applicable fee, processed through our third-party payment processor, Stripe, Inc. By purchasing, you authorize Company, through its payment processor, to charge your chosen payment method. All fees are stated in U.S. dollars. Applicable sales or use tax will be calculated and added at checkout where required by law. Company does not store your full payment card number; payment data is handled directly by our payment processor under its own terms and applicable card network rules.',
      ],
    },
    {
      heading: 'Refunds and Cancellation',
      blocks: [
        'Purchases of The Compass are one-time purchases; the Service does not currently auto-renew or recur.',
        { sub: 'Before Your Compass Output Is Generated' },
        'You are entitled to a full refund if you request one within 30 days of purchase and before your personalized Compass Output—including your plan, PDF materials, or portal results—has been generated. Once your personalized Compass Output has been generated, or more than 30 days have passed since your purchase, the purchase is no longer eligible for a refund.',
        { sub: 'After Your Compass Output Is Generated' },
        'Once your personalized Compass Output has been generated, the purchase is final and non-refundable. Because the Compass Output is a one-time, individually generated deliverable, it cannot be returned or reversed once produced.',
        `To request a refund, contact ${LEGAL_EMAIL}. This section, together with the standalone Refund Policy, is Company's official refund policy and controls over any prior informal statement, verbal or written.`,
      ],
    },
    {
      heading: 'Ownership and License',
      blocks: [
        { lead: 'Company IP.', text: 'The Compass platform, including its software, user interface, underlying methodology, prompts, algorithms, templates, and all related content (excluding the portions of Compass Output specific to you), (collectively, "Company IP") is owned by Company or its licensors and is protected by intellectual property laws. Nothing in these Terms transfers ownership of any Company IP to you.' },
        { lead: 'License to you.', text: 'Subject to your compliance with these Terms, Company grants you a limited, non-exclusive, non-transferable, revocable license to access and use the Service and your own Compass Output for your own professional development purposes.' },
        { lead: 'Your Compass Output.', text: 'You may use, print, and share your own personalized Compass Output, for example with a coach, mentor, or employer, for your own personal or business purposes. You may not resell, sublicense, or commercially redistribute the Service or your Compass Output as a standalone product.' },
        { lead: 'Feedback.', text: 'If you provide Company with suggestions or feedback about the Service, Company may use it without restriction or obligation to you.' },
      ],
    },
    {
      heading: 'Acceptable Use',
      blocks: [
        'You agree not to, and not to permit any third party to:',
        {
          list: [
            'reverse engineer, decompile, disassemble, or otherwise attempt to derive the source code, prompts, or underlying methodology of the Service;',
            "scrape, extract, or systematically copy the Service's content, prompts, or output in order to build a competing product or service;",
            'share, sell, sublicense, or provide your account credentials or access to another person;',
            'resell, sublicense, or redistribute access to the Service;',
            'use the Service for any unlawful purpose or in violation of any applicable law;',
            "attempt to gain unauthorized access to the Service, other accounts, or Company's systems; or",
            "use bots, scripts, or other automated means to access the Service without Company's written permission.",
          ],
        },
        'Nothing in this Section restricts you from publicly discussing, reviewing, or sharing your personal experience using The Compass. Word-of-mouth sharing of your experience is welcome; copying the mechanics behind it is not.',
      ],
    },
    {
      heading: 'No Professional Advice; Disclaimer of Warranties',
      blocks: [
        { caps: 'THE COMPASS PROVIDES DECISION-SUPPORT AND REFLECTION TOOLS ONLY AND DOES NOT CONSTITUTE PROFESSIONAL, LEGAL, FINANCIAL, OR PSYCHOLOGICAL ADVICE. THE SERVICE AND ALL COMPASS OUTPUT ARE PROVIDED "AS IS" AND "AS AVAILABLE," WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING WITHOUT LIMITATION WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. COMPANY DOES NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED OR ERROR-FREE, OR THAT ANY COMPASS OUTPUT WILL MEET YOUR EXPECTATIONS OR PRODUCE ANY PARTICULAR RESULT. ALL LEADERSHIP, BUSINESS, AND PERSONNEL DECISIONS BASED ON THE COMPASS OUTPUT REMAIN YOUR SOLE RESPONSIBILITY.' },
      ],
    },
    {
      heading: 'Limitation of Liability',
      blocks: [
        { caps: "TO THE MAXIMUM EXTENT PERMITTED BY LAW, COMPANY, ITS OFFICERS, MEMBERS, EMPLOYEES, AND AGENTS WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, REVENUE, DATA, OR BUSINESS OPPORTUNITY, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE, EVEN IF COMPANY HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. COMPANY'S TOTAL AGGREGATE LIABILITY ARISING OUT OF OR RELATED TO THESE TERMS OR THE SERVICE WILL NOT EXCEED THE AMOUNT YOU PAID COMPANY FOR THE SERVICE IN THE TWELVE MONTHS BEFORE THE CLAIM AROSE." },
        'Some jurisdictions do not allow the exclusion or limitation of certain damages, so some of the above limitations may not apply to you.',
      ],
    },
    {
      heading: 'Indemnification',
      blocks: [
        "You agree to indemnify, defend, and hold harmless Company and its officers, members, employees, and agents from and against any claims, liabilities, damages, losses, and expenses, including reasonable attorneys' fees, arising out of or related to: (a) your use of the Service; (b) your violation of these Terms; or (c) your violation of any applicable law or the rights of a third party.",
      ],
    },
    {
      heading: 'Termination',
      blocks: [
        'Company may suspend or terminate your access to the Service at any time, with or without cause, including for violation of these Terms. You may stop using the Service at any time. Sections 6 (as applicable), 7, 9, 10, 11, 13, and 14 survive termination.',
      ],
    },
    {
      heading: 'Governing Law and Disputes',
      blocks: [
        'These Terms are governed by the laws of the State of Indiana, without regard to conflict-of-laws principles. Any dispute arising out of or relating to these Terms or the Service will be resolved in the state or federal courts located in Elkhart County, Indiana, and you consent to the personal jurisdiction of those courts.',
      ],
    },
    {
      heading: 'General',
      blocks: [
        {
          list: [
            { lead: 'Entire agreement.', text: 'These Terms, the Privacy Policy, and the Consent to Participate are the entire agreement between you and Company regarding the Service.' },
            { lead: 'Changes.', text: 'Company may update these Terms from time to time; the updated version will show a new effective date, and continued use of the Service after changes take effect is acceptance of the changes.' },
            { lead: 'Severability.', text: 'If any provision of these Terms is found unenforceable, the remaining provisions remain in full effect.' },
            { lead: 'No waiver.', text: "Company's failure to enforce a provision is not a waiver of its right to do so later." },
            { lead: 'Assignment.', text: "Company may assign these Terms; you may not assign these Terms without Company's written consent." },
            { lead: 'Relationship of the parties.', text: 'Nothing in these Terms creates an employment, agency, partnership, or joint-venture relationship between you and Company.' },
          ],
        },
      ],
    },
    {
      heading: 'Contact',
      blocks: [`Questions about these Terms: ${LEGAL_EMAIL}, ${LEGAL_ADDRESS}.`],
    },
  ],
};

const PRIVACY = {
  id: 'privacy',
  kind: 'legal',
  title: 'Privacy Policy',
  effective: LEGAL_VERSIONS.privacy,
  intro: [
    'This Privacy Policy explains how North Star Partners, LLC ("Company," "we," "us," "our") collects, uses, and shares information when you use The Compass (the "Service").',
  ],
  sections: [
    {
      heading: 'Information We Collect',
      blocks: [
        {
          list: [
            { lead: 'Account and contact information:', text: 'your first name, last name, and email address, provided when you create an account.' },
            { lead: 'Assessment and profile information:', text: 'information you enter into the Service about your background, experience, and leadership preferences, used to generate your personalized Compass Output.' },
            { lead: 'Payment information:', text: 'processed directly by our payment processor, Stripe, Inc. We do not store your full payment card number; we may retain limited transaction records, such as amount, date, and last four digits, for accounting and support purposes.' },
            'We do not collect employee, HR, or other third-party personal data through the Service, and we do not currently use analytics, advertising, or tracking technology on our site. If that changes, for example if we add website analytics, we will update this Policy.',
          ],
        },
      ],
    },
    {
      heading: 'How We Use Your Information',
      blocks: [
        'We use the information above to:',
        {
          list: [
            'create your account and generate your personalized Compass Output;',
            'provide customer support and respond to your requests;',
            'process payment and maintain transaction records;',
            'improve the quality, accuracy, and content of the Service; and',
            'comply with applicable law.',
          ],
        },
        'If you opt in at checkout or account creation, we will also use your email address to send you newsletters, product updates, and promotional offers. This use is separate from, and requires your affirmative opt-in beyond, your agreement to this Policy.',
      ],
    },
    {
      heading: 'How We Share Your Information',
      blocks: [
        'We do not sell your personal information. We do not share your assessment responses or Compass Output with your employer, HR department, or any other third party without your explicit authorization, except:',
        {
          list: [
            'with service providers who perform services on our behalf, such as Stripe (payment processing), our website hosting provider, and, if you opt in to marketing, our email service provider - each of whom is authorized to use your information only as necessary to provide those services;',
            'if required by law, regulation, legal process, or a valid governmental request; or',
            'to protect the rights, property, or safety of Company, our users, or others.',
          ],
        },
      ],
    },
    {
      heading: 'Email Marketing',
      blocks: [
        `If you opt in, we will use your email address to send newsletters, product updates, and promotional offers. You may unsubscribe at any time using the link in any marketing email or by contacting us at ${LEGAL_EMAIL}. Opting out of marketing emails does not affect transactional emails related to your purchase, account, or Compass Output.`,
      ],
    },
    {
      heading: 'Data Retention',
      blocks: [
        'We retain your account and assessment information for as long as your account is active and for a reasonable period afterward to meet legal, accounting, and support needs, after which it is deleted or de-identified.',
      ],
    },
    {
      heading: 'Your Choices and Rights',
      blocks: [
        `You may request access to, correction of, or deletion of your personal information, or withdraw your consent for further use of your data, by contacting us at ${LEGAL_EMAIL}. We will respond within a reasonable time. Depending on your state of residence, you may have additional rights under applicable state privacy law.`,
      ],
    },
    {
      heading: 'Data Security',
      blocks: [
        'We use reasonable administrative, technical, and organizational measures designed to protect your information. No method of transmission or storage is completely secure, and we cannot guarantee absolute security.',
      ],
    },
    {
      heading: "Children's Privacy",
      blocks: [
        'The Service is intended for business and professional use by adults and is not directed to children under 18. We do not knowingly collect information from children under 18.',
      ],
    },
    {
      heading: 'Where the Service Is Offered',
      blocks: ['The Service is currently offered only to users located in the United States.'],
    },
    {
      heading: 'Changes to This Policy',
      blocks: [
        'We may update this Privacy Policy from time to time. We will post the updated version with a new effective date. Continued use of the Service after changes take effect is acceptance of the changes.',
      ],
    },
    {
      heading: 'Contact Us',
      blocks: [`Questions about this Privacy Policy: ${LEGAL_EMAIL}, ${LEGAL_ADDRESS}.`],
    },
  ],
};

const CONSENT = {
  id: 'consent',
  kind: 'legal',
  title: 'Consent to Participate',
  effective: LEGAL_VERSIONS.consent,
  intro: [
    'This leadership development tool collects information about your background, experiences, and leadership preferences to create your personalized Compass Output, meaning your leadership development plan and related materials.',
    'Your responses will be stored securely and used by North Star Partners, LLC to generate your Compass Output, provide insights or feedback, and improve the quality of the Service, as described in our Privacy Policy.',
    'All personally identifying information will be kept strictly confidential and will not be shared with any employer or third party without your explicit consent, except as described in our Privacy Policy, for example with service providers who help us operate the Service, such as our payment processor.',
    'If you opt in separately at checkout or account creation, we may also use your email address to send you newsletters, product updates, and promotional offers. You can unsubscribe at any time. This marketing use is optional and is not required to use the Service.',
    'Participation is voluntary. You may exit the tool at any time, though your personalized Compass Output may not be available if you exit before it is generated.',
    'By selecting "I Agree," you confirm that you have read and agree to this Consent, our Terms of Service, and our Privacy Policy, and you consent to the collection and use of your data by North Star Partners, LLC as described above.',
  ],
  sections: [],
};

const REFUNDS = {
  id: 'refunds',
  kind: 'legal',
  title: 'Refund & Cancellation Policy',
  effective: LEGAL_VERSIONS.refunds,
  intro: [
    'The Compass is sold as a one-time purchase. It does not auto-renew and there is no subscription to cancel.',
  ],
  sections: [
    {
      heading: 'Before Your Compass Output Is Generated',
      blocks: [
        'You are entitled to a full refund if you request one within 30 days of purchase and before your personalized Compass Output—including your plan, PDF materials, or portal results—has been generated. Once your personalized Compass Output has been generated, or more than 30 days have passed since your purchase, the purchase is no longer eligible for a refund.',
      ],
    },
    {
      heading: 'After Your Compass Output Is Generated',
      blocks: [
        'Once your personalized Compass Output has been generated, the purchase is final and non-refundable. Because the Compass Output is a one-time, individually generated deliverable, it cannot be returned or reversed once produced.',
      ],
    },
    {
      heading: 'Exceptions',
      blocks: [
        'Company may make exceptions to this policy at its sole discretion – or where required by applicable law. Any exception granted in one case does not obligate Company to grant the same exception in another case – and does not change this written policy.',
      ],
    },
    {
      heading: 'How to Request a Refund',
      blocks: [
        `Email ${LEGAL_EMAIL} with your order or account information. Requests are typically reviewed within 48 hours.`,
      ],
    },
    {
      heading: 'Relationship to the Terms of Service',
      blocks: [
        'This Policy is part of, and should be read together with, The Compass Terms of Service. In the event of any conflict, the Terms of Service control.',
      ],
    },
  ],
};

// Plain help pages rather than agreements, so they keep the simple shape.
const SURVEY = {
  id: 'survey',
  kind: 'help',
  title: 'Team survey & anonymity',
  body: [
    'After your self-assessment you send a separate link to your team — at least three people you lead directly. They answer the same observable statements you did. The survey is short and does not require a Compass account.',
    'You see counts and combined scores — never individual responses, names, or emails attached to answers.',
    'More responses make a steadier Signal. If only a few people answer, treat the pattern as a sketch, not a conclusion.',
    'Once you accept no more answers (or the expected team count is in), the campaign locks and the dashboard can calculate. Locked surveys reject new submits.',
  ],
};

const SUPPORT = {
  id: 'support',
  kind: 'help',
  title: 'How to get support',
  body: [
    `Email ${SUPPORT_EMAIL}. Include the email on your Compass account and what you were doing when something broke.`,
    'We can help with sign-in, the team survey link, and reading the dashboard. We cannot recover anonymous team answers or tell you who said what.',
    'Account and product questions go to that inbox. It is also the address on the welcome email.',
  ],
};

export const LEGAL_DOCS = [TERMS, PRIVACY, CONSENT, REFUNDS, SURVEY, SUPPORT];

export function legalDocById(id) {
  return LEGAL_DOCS.find((doc) => doc.id === id) || null;
}

export function legalDocPath(id) {
  return `/documents/${id}`;
}
