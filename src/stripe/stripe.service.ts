import { HttpStatus, Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { envs } from 'src/config';
import { CreateOrderDto } from 'src/orders/dto';

@Injectable()
export class StripeService {

  readonly client: Stripe;

  constructor() {
    this.client = new Stripe(envs.STRIPE_API_KEY, { 
      apiVersion: "2025-02-24.acacia", 
    })
  }

  async createCheckoutSession(createOrderDto: CreateOrderDto, orderId: number) {
    const { currency, userId, eventId, nameEvent, totalItems, unitAmount } = createOrderDto;
    const session = await this.client.checkout.sessions.create({
      line_items: [
        { 
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              metadata: {
                orderId,
                userId,
                eventId
              },
              name: `Bingo Table of the ${nameEvent} event`,
            },
            unit_amount: Math.round(unitAmount * 100)
          },
          quantity: totalItems
        }
      ],
      mode: 'payment',
      success_url: `${envs.DOMAIN}order;id=${eventId}?success=true`,
      cancel_url: `${envs.DOMAIN}orderid=${eventId}?canceled=true`,
    });

    return { data: session, url: session.url};
  }

  async findItemBySessionId(sessionId: string) {
    const listItems = await this.client.checkout.sessions.listLineItems(sessionId);
    const productId = listItems.data[0].price.product;
    const product = await this.client.products.retrieve(productId.toString());
    const orderId = parseInt(product.metadata.orderId);
    return orderId;
  }
}
