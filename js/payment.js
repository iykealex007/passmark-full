/**
 * PASSMARK — payment.js
 * Paystack payment integration.
 *
 * SETUP INSTRUCTIONS (read before deploying):
 * ─────────────────────────────────────────────────────────────
 * 1. Sign up at https://paystack.com and get your PUBLIC key
 *    from Dashboard → Settings → API Keys & Webhooks.
 *
 * 2. Replace PAYSTACK_PUBLIC_KEY below with your actual key.
 *    Public key starts with "pk_test_" (test) or "pk_live_" (live).
 *
 * 3. Your BACKEND handles the secret key — NEVER put the secret
 *    key in frontend JavaScript. The secret key lives only in
 *    your server environment variables (see backend/server.js).
 *
 * 4. The payment flow:
 *    a. User clicks "Subscribe" on a plan
 *    b. Frontend calls POST /api/payments/initialize
 *       → backend creates a Paystack transaction, returns { reference, access_code }
 *    c. Frontend opens Paystack popup with the access_code
 *    d. User pays in the popup
 *    e. Paystack calls your webhook (POST /api/payments/webhook) server-side
 *    f. Backend verifies payment, activates subscription
 *    g. Frontend polls GET /api/payments/verify/:reference to confirm
 *
 * API ENDPOINTS USED:
 *    POST /api/payments/initialize  → { reference, access_code, authorization_url }
 *    GET  /api/payments/verify/:ref → { status, plan, expiresAt }
 *    POST /api/payments/webhook     → (Paystack server-to-server only)
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

/* ── Replace with your actual Paystack public key ── */
const PAYSTACK_PUBLIC_KEY = 'pk_test_YOUR_KEY_HERE';

/* ── Plan definitions ── */
const PLANS = {
  ielts: {
    name:     'IELTS',
    code:     'PLN_IELTS_MONTHLY',    // Create this plan in Paystack dashboard
    amount:   850000,                  // Kobo (₦8,500 × 100)
    interval: 'monthly'
  },
  waec: {
    name:     'WAEC & NECO',
    code:     'PLN_WAEC_MONTHLY',
    amount:   600000,
    interval: 'monthly'
  },
  nursing: {
    name:     'Nursing & Medical',
    code:     'PLN_NURSING_MONTHLY',
    amount:   950000,
    interval: 'monthly'
  },
  medical: {
    name:     'Medical Licensing',
    code:     'PLN_MEDICAL_MONTHLY',
    amount:   1100000,
    interval: 'monthly'
  },
  bundle: {
    name:     'Full Bundle',
    code:     'PLN_BUNDLE_MONTHLY',
    amount:   2200000,
    interval: 'monthly'
  },
  bundle_annual: {
    name:     'Full Bundle (Annual)',
    code:     'PLN_BUNDLE_ANNUAL',
    amount:   18480000,                // ₦15,400 × 12 × 100
    interval: 'annually'
  }
};

const Payment = (() => {

  /* ── Load Paystack JS SDK ── */
  function loadPaystackScript() {
    return new Promise((resolve, reject) => {
      if (window.PaystackPop) { resolve(); return; }

      const script    = document.createElement('script');
      script.src      = 'https://js.paystack.co/v1/inline.js';
      script.onload   = resolve;
      script.onerror  = () => reject(new Error('Failed to load Paystack script'));
      document.head.appendChild(script);
    });
  }

  /* ── Initialize payment ── */
  async function initializePayment(planKey, billingPeriod = 'monthly') {
    const user = Auth.getCurrentUser();
    if (!user) {
      Auth.open('signup');
      return;
    }

    const planId = billingPeriod === 'annual' && planKey === 'bundle'
      ? 'bundle_annual'
      : planKey;

    const plan = PLANS[planId];
    if (!plan) {
      PM.showToast('Invalid plan selected.', 'error');
      return;
    }

    try {
      // 1. Get transaction reference from backend
      const { reference, access_code } = await PM.apiRequest('/payments/initialize', {
        method: 'POST',
        body: {
          plan:   planId,
          email:  user.email,
          userId: user.id
        }
      });

      // 2. Load Paystack SDK
      await loadPaystackScript();
    
      // 3. Open Paystack popup
      const handler = window.PaystackPop.setup({
        key:       PAYSTACK_PUBLIC_KEY,
        email:     user.email,
        amount:    plan.amount,
        ref:       reference,
        currency:  'NGN',
        plan:      plan.code,
        metadata: {
          custom_fields: [
            { display_name: 'Plan',      variable_name: 'plan',     value: plan.name },
            { display_name: 'User ID',   variable_name: 'user_id',  value: user.id }
          ]
        },

        onSuccess: (transaction) => {
          handlePaymentSuccess(transaction.reference, planId);
        },

        onCancel: () => {
          PM.showToast('Payment was cancelled.', 'warning');
        }
      });

      handler.openIframe();

    } catch (err) {
      PM.showToast(err.message || 'Payment initialisation failed.', 'error');
    }
  }

  /* ── Handle successful payment ── */
  async function handlePaymentSuccess(reference, planId) {
    PM.showToast('Payment received! Activating your subscription…');

    // Poll backend to confirm webhook received and subscription activated
    let attempts = 0;
    const maxAttempts = 10;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const result = await PM.apiRequest(`/payments/verify/${reference}`);

        if (result.status === 'success') {
          clearInterval(interval);

          // Update local user state
          const user = PM.store.get('pm_user') || {};
          user.plan = planId;
          user.planExpiresAt = result.expiresAt;
          PM.store.set('pm_user', user);

          PM.showToast('Subscription activated! Welcome to Passmark.', 'success', 5000);

          setTimeout(() => {
            window.location.href = '/pages/dashboard.html';
          }, 1500);
        }

      } catch (err) {
        // Keep polling
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval);
        PM.showToast('Payment processed. Check your dashboard to confirm access.', 'default', 6000);
        setTimeout(() => { window.location.href = '/pages/dashboard.html'; }, 2000);
      }

    }, 2000); // poll every 2 seconds
  }

  /* ── Bind plan buttons ── */
  function bindPlanButtons() {
    PM.$$('[data-subscribe]').forEach(btn => {
      btn.addEventListener('click', () => {
        const planKey = btn.dataset.subscribe;
        const billing = btn.dataset.billing || 'monthly';
        initializePayment(planKey, billing);
      });
    });
  }

  /* ── Init ── */
  function init() {
    bindPlanButtons();
  }

  return { init, initializePayment };
})();

document.addEventListener('DOMContentLoaded', () => Payment.init());

/*
 * ─────────────────────────────────────────────────────────────
 * BACKEND WEBHOOK SETUP (server.js)
 * ─────────────────────────────────────────────────────────────
 *
 * In your Paystack dashboard:
 *   Settings → API Keys & Webhooks → Webhook URL
 *   Set to: https://yourdomain.com/api/payments/webhook
 *
 * Your backend (backend/routes/payments.js) handles:
 *   1. Receives POST from Paystack
 *   2. Validates signature using PAYSTACK_SECRET_KEY
 *   3. On charge.success event:
 *      - Look up user by email in DB
 *      - Create/update subscription record
 *      - Set plan and expiry date
 *      - Send confirmation email
 *
 * ENVIRONMENT VARIABLES (add to backend/.env):
 *   PAYSTACK_SECRET_KEY=sk_test_YOUR_SECRET_KEY
 *   PAYSTACK_PUBLIC_KEY=pk_test_YOUR_PUBLIC_KEY
 * ─────────────────────────────────────────────────────────────
 */
