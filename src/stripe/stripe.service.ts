import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { envs } from 'src/config';
import { CustomerInterface, EventInterface, UserInterface } from '../common/interfaces';
import { paymentConfig } from './const/constants';
import { EventDto } from 'src/payment/dto';

@Injectable()
export class StripeService {

  readonly client: Stripe;

  constructor() {
    this.client = new Stripe(envs.STRIPE_API_KEY, { 
      apiVersion: "2025-02-24.acacia", 
    })
  }

  async createCustomer(customer: { email: string, name: string}) {
    return this.client.customers.create({
      email: customer.email, 
      name: customer.name
    });
  }

  async createPayment(customerId: string) {
    return this.client.paymentIntents.create({
      customer: customerId,
      amount: paymentConfig.amount,
      currency: paymentConfig.currency
    })
  }

  async createCheckoutSession(event: EventDto, cuid: string, quantity: number, customerId: string) {
    const session = await this.client.checkout.sessions.create({
      line_items: [
        { 
          price_data: {
            currency: 'usd',
            product_data: {
              metadata: {
                id: event.id
              },
              name: event.name,
              description: event.description,
            },
            unit_amount: Math.round(event.price * 100)
          },
          quantity: quantity
        }
      ],
      customer: customerId,
      mode: 'payment',
      success_url: `${envs.DOMAIN}order;id=${event.id}?success=true`,
      cancel_url: `${envs.DOMAIN}orderid=${event.id}?canceled=true`,
    }, { idempotencyKey: cuid });

    return { data: session, url: session.url};
  }

  async confirmPayment(paymentId: string, paymentMethodId: string) {
    return this.client.paymentIntents.confirm(paymentId, {
      payment_method: paymentMethodId
    })
  }
  
  async findCustomerPayments(customerId: string) {
    return (await this.client.paymentIntents.list({ customer: customerId }))
      .data;
  }

  async findCustomerPayment(customerId: string, paymentId: string) {
    return (
      await this.client.paymentIntents.list({ customer: customerId })
    ).data.filter((p) => {
      return p.id === paymentId;
    })[0];
  }
}
