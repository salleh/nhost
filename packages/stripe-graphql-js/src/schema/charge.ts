import Stripe from 'stripe'
import { builder } from '../builder'
import { stripe } from '../utils'
import { StripeInvoice } from '../types'

builder.objectType('StripeCharge', {
  description: 'Stripe charge object',
  fields: (t) => ({
    id: t.exposeString('id'),
    customer: t.exposeString('customer'),
    amount: t.exposeInt('amount'),
    amountCaptured: t.exposeInt('amount_captured'),
    amount_refunded: t.exposeInt('amount_refunded'),
    applicationFeeAmount: t.exposeInt('application_fee_amount', { nullable: true }),
    calculatedStatementDescriptor: t.exposeString('calculated_statement_descriptor', {
      nullable: true
    }),
    billing_details: t.expose('billing_details', { type: 'JSON', nullable: true }),
    captured: t.exposeBoolean('captured'),
    created: t.exposeInt('created', {
      nullable: true
    }),
    currency: t.exposeString('currency'),
    description: t.exposeString('description', { nullable: true }),
    disputed: t.exposeBoolean('disputed'),
    failureCode: t.exposeString('failure_code', { nullable: true }),
    invoice: t.field({
      type: 'StripeInvoice',
      nullable: true,
      resolve: async (charge) => {
        const { invoice } = charge

        if (!invoice) {
          return null
        }

        const invoiceData = await stripe.invoices.retrieve(invoice as string)

        return invoiceData as Stripe.Response<StripeInvoice>
      }
    }),
    livemode: t.exposeBoolean('livemode'),
    metadata: t.expose('metadata', { nullable: true, type: 'JSON' }),
    outcome: t.expose('outcome', { nullable: true, type: 'JSON' }),
    fraudDetails: t.expose('fraud_details', { nullable: true, type: 'JSON' }),
    paid: t.exposeBoolean('paid'),
    receiptEmail: t.exposeString('receipt_email', { nullable: true }),
    receiptNumber: t.exposeString('receipt_number', { nullable: true }),
    receiptUrl: t.exposeString('receipt_url', { nullable: true }),
    refunded: t.exposeBoolean('refunded'),
    shipping: t.expose('shipping', { nullable: true, type: 'JSON' }),
    statementDescriptor: t.exposeString('statement_descriptor', { nullable: true }),
    statementDescriptorSuffix: t.exposeString('statement_descriptor_suffix', { nullable: true }),
    status: t.exposeString('status'),
    transferData: t.expose('transfer_data', { nullable: true, type: 'JSON' }),
    transferGroup: t.exposeString('transfer_group', { nullable: true }),
    refunds: t.expose('refunds', { nullable: true, type: 'JSON' }),
    paymentMethodDetails: t.expose('payment_method_details', { nullable: true, type: 'JSON' }),
    paymentIntent: t.exposeString('payment_intent', { nullable: true }),
    paymentMethod: t.exposeString('payment_method', { nullable: true })

    // todo: add missing fields
    //  Missing
    // application
    // application_fee
    // balanceTransaction
    // onBehalfOf
    // failure_balance_transaction
    // source_transfer
  })
})
